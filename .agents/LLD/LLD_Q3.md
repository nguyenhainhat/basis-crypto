# Deep-Dive Low-Level Design (LLD): Quarter 3 – Distributed Orchestration & Systems Linking

Quarter 3 is where the architecture transitions from a standard CRUD application into an enterprise-grade distributed system. We will implement the Transactional Outbox Pattern, an Idempotent Kafka Consumer, a Real-time WebSocket Bridge, and Temporal Worker Clusters.

The primary goal of this quarter is **Zero Data Loss**. Whether the Web3 RPC node goes down, the Kafka broker restarts, or the NestJS server crashes during a database transaction, the system must recover gracefully without duplicating Kudos or dropping votes.

## 1. Advanced Event-Driven Architecture (Kafka)

In Q2, the frontend communicated synchronously with the backend. In Q3, we decouple the write operations (mutations) from the read operations and side-effects (notifications, real-time updates) using Kafka.

### 1.1 Expanding the Database Schema for Idempotency

To guarantee we never process the same Kafka event twice (even if Kafka's at-least-once delivery mechanism sends duplicates), we must track consumed events.

```prisma
// schema.prisma (Q3 Additions)

// Tracks outgoing events (Outbox Pattern)
model OutboxEvent {
  id          String   @id @default(uuid())
  topic       String
  payload     Json
  status      String   @default("PENDING") // PENDING, PROCESSED, FAILED
  retryCount  Int      @default(0)
  createdAt   DateTime @default(now())
}

// Tracks incoming events to guarantee Idempotency (Exactly-Once processing)
model ProcessedEvent {
  eventId     String   @id // Maps to the Kafka Message Key / OutboxEvent ID
  topic       String
  processedAt DateTime @default(now())

  @@index([eventId])
}
```

### 1.2 The Idempotent Kafka Consumer (`src/messaging/kafka.consumer.ts`)

This consumer reads events from Kafka and updates the read-models or triggers notifications. It wraps database operations in a transaction that first checks the `ProcessedEvent` table.

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KudosEventConsumer implements OnModuleInit {
  private kafka = new Kafka({ clientId: 'dworkspace', brokers: [process.env.KAFKA_BROKER] });
  private consumer = this.kafka.consumer({ groupId: 'kudos-notification-group' });

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'kudos.events', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const eventId = message.key.toString();
        const payload = JSON.parse(message.value.toString());

        try {
          // Wrap in a serializable transaction to prevent race conditions
          await this.prisma.$transaction(async (tx) => {
            // 1. Idempotency Check: Has this event been processed?
            const alreadyProcessed = await tx.processedEvent.findUnique({
              where: { eventId },
            });

            if (alreadyProcessed) {
              console.log(`[Idempotency] Event ${eventId} already processed. Skipping.`);
              return; // Acknowledge message without side effects
            }

            // 2. Execute Business Logic (e.g., Update Leaderboard, Send Slack Alert)
            await this.updateLeaderboard(tx, payload);
            await this.dispatchSlackNotification(payload);

            // 3. Mark as Processed
            await tx.processedEvent.create({
              data: { eventId, topic },
            });
          });
        } catch (error) {
          console.error(`[Consumer Error] Failed to process ${eventId}:`, error);
          throw error; // Throwing forces Kafka to not commit the offset and retry
        }
      },
    });
  }
}
```

## 2. Real-Time WebSocket Bridge (Live Proposal Comments)

When users discuss a Proposal, comments shouldn't require page refreshes. We will bridge Kafka events to WebSockets.

### WebSocket Gateway Implementation (`src/events/proposal.gateway.ts`)

```typescript
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { KafkaProducerService } from '../messaging/kafka.producer';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/proposals' })
export class ProposalGateway {
  @WebSocketServer()
  server: Server;

  constructor(private kafkaProducer: KafkaProducerService) {}

  // 1. Client joins a specific proposal room
  @SubscribeMessage('joinProposalRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, proposalId: string) {
    client.join(`proposal_${proposalId}`);
  }

  // 2. Client submits a comment via Socket (or HTTP API)
  // The gateway pushes it to Kafka instead of broadcasting directly.
  @SubscribeMessage('submitComment')
  async handleComment(client: Socket, payload: { proposalId: string; userId: string; text: string }) {
    await this.kafkaProducer.emitEvent('proposal.comments', crypto.randomUUID(), payload);
  }

  // 3. An internal service listening to Kafka calls this method to broadcast
  broadcastComment(proposalId: string, commentData: any) {
    this.server.to(`proposal_${proposalId}`).emit('newComment', commentData);
  }
}
```

**Architecture Note**: Why push to Kafka first? If you have multiple backend instances running behind a load balancer, standard Socket.io broadcasts only reach users connected to that specific instance. By bouncing the message through Kafka, all backend instances consume the event and broadcast it to their respective connected clients.

## 3. Deep Dive: Temporal Worker Cluster & Saga Pattern

Temporal consists of three parts: The Server (Cloud/Docker), the Client (Triggers workflows), and the Worker (Executes code). In Q3, we must set up the NestJS application to run a Temporal Worker.

### 3.1 Worker Initialization (`src/temporal/temporal.worker.ts`)

The worker process must run continuously alongside the NestJS HTTP server.

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

@Injectable()
export class TemporalWorkerService implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

  async onModuleInit() {
    this.worker = await Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities, // Injects functions that hit DB or Smart Contracts
      taskQueue: 'dworkspace-tasks',
    });

    // Start worker in the background
    this.worker.run().catch((err) => {
      console.error('Temporal Worker crashed:', err);
    });
  }

  async onModuleDestroy() {
    if (this.worker) {
      this.worker.shutdown(); // Graceful shutdown ensures active tasks complete
    }
  }
}
```

### 3.2 Advanced Workflow: The SBT Minting Saga

When a user hits 100 Kudos, we trigger a workflow to mint a Soulbound Token. Because Web3 RPC nodes can fail, or the system wallet might run out of gas, we need a Saga pattern to handle compensation (e.g., reverting local DB state if the chain fails permanently).

```typescript
// src/temporal/workflows/mintSbt.workflow.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/sbt.activities';

const {
  verifyEligibility,
  mintOnChain,
  recordMintInDatabase,
  revertEligibilityLock
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 5, // Fails after ~5 minutes of retrying
  },
});

export async function mintAchievementSaga(userId: string, achievementId: string): Promise<string> {
  // Step 1: Lock the user's eligibility in DB so we don't trigger this twice
  await verifyEligibility(userId, achievementId);

  try {
    // Step 2: Interact with the Blockchain (High risk of RPC/Gas failure)
    const txHash = await mintOnChain(userId, achievementId);

    // Step 3: Save the final TxHash to local DB
    await recordMintInDatabase(userId, achievementId, txHash);

    return txHash;

  } catch (error) {
    // Saga Compensation: If the chain interaction permanently fails,
    // unlock the user's eligibility so an Admin can manually retry later.
    await revertEligibilityLock(userId, achievementId);
    throw error; // Bubble up failure to Temporal Dashboard
  }
}
```

## 4. Fault Tolerance & Chaos Engineering (Testing the Limits)

As a Senior Developer, your Q3 deliverable isn't complete until you prove it survives failure. You must document and execute the following Chaos Engineering scenarios:

| Failure Scenario | System Response Mechanism (AC) |
| :--- | :--- |
| **Web3 RPC Node goes offline during `mintOnChain`.** | Temporal automatically catches the network timeout and applies exponential backoff. The workflow stays in a Running state for up to hours without blocking the NestJS event loop. |
| **Kafka Broker crashes while API is writing Kudos.** | The `/kudos/send` HTTP endpoint writes the event to the PostgreSQL `OutboxEvent` table and returns `201 Created` immediately. When Kafka restarts, the `OutboxScheduler` picks up the pending rows and streams them. No data lost. |
| **NestJS Server restarts while consuming Kafka.** | Because the consumer only writes to the `ProcessedEvent` table after processing, the uncommitted Kafka offset will be picked up by the server when it reboots, resuming exactly where it left off. |

## 5. Granular Weekly Sprint Backlog (Q3)

*   **Week 25: The Outbox Implementation**
    *   Create Prisma migrations for `OutboxEvent` and `ProcessedEvent`.
    *   Refactor the KudosService to write to the outbox instead of emitting directly.
    *   Implement the `OutboxScheduler` Cron job.
*   **Week 26: Kafka Broker & Producers**
    *   Set up Upstash Serverless Kafka cluster.
    *   Implement `KafkaProducerService` using kafkajs.
    *   Write integration tests verifying DB writes successfully translate to Kafka topics.
*   **Week 27: Idempotent Consumers**
    *   Implement the Consumer groups for Kudos and Proposals.
    *   Write the transactional logic to check `ProcessedEvent` before acting.
    *   Testing: Manually push the exact same payload twice via Kafka UI and assert the database only updates once.
*   **Week 28-29: Temporal Foundation & Worker Setup**
    *   Integrate `@temporalio/client` and `@temporalio/worker` into NestJS.
    *   Define the `dworkspace-tasks` task queue.
    *   Migrate the 7-day Proposal Voting timer from standard Cron to a Temporal `sleep()` workflow.
*   **Week 30-31: Saga Patterns & Web3 Integration**
    *   Write the `mintAchievementSaga` combining local DB locks with ethers.js contract calls.
    *   Handle nonces properly in the Activity worker to prevent "Nonce too low" errors when multiple workflows mint simultaneously.
*   **Week 32-33: Real-Time WebSockets**
    *   Implement `@nestjs/websockets` Gateway.
    *   Bridge the Kafka consumer to emit Socket.io broadcasts for live commenting.
    *   Update Next.js UI to listen to Socket events and append comments optimistically.
*   **Week 34-36: System Hardening & Chaos Testing**
    *   Review all timeouts and retry policies.
    *   Run chaos tests: Manually kill the Docker container running PostgreSQL mid-transaction, kill the Temporal server during a sleep cycle, and verify state recovery upon reboot.
    *   Finalize Q3 Architecture Documentation for the team presentation.
