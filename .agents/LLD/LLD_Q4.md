# Low-Level Design (LLD): Quarter 4 – Enterprise Deployment, Performance Tuning & Production Launch

Quarter 4 marks the final phase of transforming dWorkspace into a production-ready application. This stage moves the project from a local Docker Compose environment onto a live, cost-optimized cloud topology.

The focus here is configuring a hardened infrastructure, conducting continuous integration testing, and tuning system bottlenecks so the application runs smoothly on minimal compute resources.

## 1. System Topology & Network Infrastructure (AWS Architecture)

To support 40 concurrent team members while keeping monthly costs predictable, the production infrastructure balances security with cost optimization. Instead of expensive multi-node structures, it uses a single-instance Docker-managed topology running beside a cloud-managed database layer.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                AWS Cloud VPC (Region: ap-southeast-1)                  │
│                                                                                        │
│ ┌────────────────────────────────────────────────────────────────────────────────┐     │
│ │                            Public Subnet (Internet Facing)                     │     │
│ │                                                                                │     │
│ │ [ALB / Nginx Proxy] ──(Reverse Proxy over Port 3000)──┐                        │     │
│ │          │                                            │                        │     │
│ │  TLS Termination (Port 443)                           ▼                        │     │
│ └───────────┼───────────────────────────────────────[EC2 Host VM]────────────┘     │
│             │                                     (t3.medium instance)               │
│             │                                           │                            │
│             │                           ┌────────────────────┐                       │     │
│             │                           │ NestJS API Container│                       │     │
│             │                           └────────────────────┘                       │     │
│             │                                           │                            │     │
│             │                                    In-Memory IPC                       │     │
│             │                                           ▼                            │     │
│             │                           ┌────────────────────┐                       │     │
│             │                           │  Temporal Worker   │                       │     │
│             │                           └────────────────────┘                       │     │
│             └─────┬────────────┬─────┘                                               │
│                   │            │                                                     │
│                   ▼            │                                                     │
│ ┌─────────────────────────────────────────────────────────┼────────────┼─────┐     │
│ │                       Private Isolated Subnet           │            │     │     │
│ │                                                         ▼            │     │     │
│ │  [Amazon RDS Instance] <───────────────────────────────┘             │     │     │
│ │  (db.t3.micro - PostgreSQL Engine Engine)                            │     │     │
│ │                                                                      ▼     │     │
│ │  [External Serverless Mesh] <───────────────────────────────────────┘      │     │
│ │  (Upstash Kafka Stream Layer via SASL/SCRAM Security)                      │     │
│ └────────────────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Production Infrastructure Topology

*   **Host Virtual Machine**: Single Amazon EC2 `t3.medium` compute instance (2 vCPUs, 4 GiB RAM). It runs both the Next.js frontend, NestJS API, and the local Temporal state engine within an isolated Docker daemon network.
*   **Database Tier**: Amazon RDS running a `db.t3.micro` instance equipped with a native PostgreSQL engine and 20 GB of General Purpose SSD (gp2) storage.
*   **Asynchronous Message Queue**: Managed Serverless Kafka cluster hosted via Upstash, communicating over encrypted TLS using SASL/SCRAM-SHA-512 mechanisms.

## 2. Infrastructure as Code: Deployment Configuration

The production environment maps container bounds explicitly via Compose scripts, decoupling application runtimes from transient instance states.

### Production Environment Blueprint (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  dworkspace-backend:
    image: ${DOCKER_REGISTRY}/dworkspace-backend:${IMAGE_TAG:-latest}
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require
      - KAFKA_BROKERS=${KAFKA_ENDPOINT}
      - KAFKA_USERNAME=${KAFKA_SASL_USER}
      - KAFKA_PASSWORD=${KAFKA_SASL_PASS}
      - TEMPORAL_ADDRESS=temporal-frontend:7233
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - production-mesh
    deploy:
      resources:
        limits:
          memory: 1536M
        reservations:
          memory: 512M

  temporal-frontend:
    image: temporalio/auto-setup:${TEMPORAL_VERSION:-latest}
    restart: always
    environment:
      - DB=postgresql
      - POSTGRES_SEEDS=${DB_HOST}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PWD=${DB_PASSWORD}
      - POSTGRES_NAME=temporal_persistence
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
    networks:
      - production-mesh
    ports:
      - "7233:7233"

networks:
  production-mesh:
    driver: bridge
```

## 3. Production Deployment & Continuous Integration Pipeline

The system uses a git-triggered automated pipeline via GitHub Actions to run tests, assemble lightweight images, and execute atomic hot-swaps on the host.

```text
[Developer Workspace]
         │
 git push origin main
         │
         ▼
[GitHub Actions Runner Layer]
         │
         ├── Phase 1: Execution Engine Quality Analysis (Prisma Lint & Jest Testing Hooks)
         │
         ├── Phase 2: Compiling Production Build Artifacts (Multi-Stage Docker Compilations)
         │
         └── Phase 3: Deployment Run Execution Loops
                  │
                  ├── Establish Secure SSH Tunnel to AWS Host
                  ├── Sync docker-compose.prod.yml configuration
                  └── Execute: docker compose pull && docker compose up -d --remove-orphans
```

## 4. Performance Tuning & Stress Testing Protocols

To certify that our system can handle sudden coordination spikes among the 40 team members, we use `k6` to run stress testing scripts against our transaction logic.

```text
                     [k6 Stress Testing Suite Orchestrator]
                                       │
                Simulates 50 Virtual Users Sending Tokens Simultaneously
                                       │
                                       ▼
                     [NestJS /api/v1/kudos/send Ingress Gateway]
                                       │
                     Writes Payload directly to Outbox Table
                                       │
                                       ▼
                     [PostgreSQL Isolation Metrics Monitor]
              Goal: Ensure Connection Pools match peak loads without dropping
```

### Automated Performance Profiling Configuration (`test/stress/kudos.stress.js`)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 }, // Ramp up profile parameters safely
    { duration: '3m', target: 50 }, // Maintain peak stress traffic conditions
    { duration: '1m', target: 0 },  // Cool down connections smoothly
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'], // 95% of transactions must resolve under 150ms
    http_req_failed: ['rate<0.01'],   // Error tolerances must not cross 1% limits
  },
};

export default function () {
  const url = 'https://dworkspace.company.internal/api/v1/kudos/send';
  const payload = JSON.stringify({
    receiverAddress: '0x90f8bf65d27a1097d42d46abc4a3b1141d46be9e',
    amount: 5,
    message: 'Automated infrastructure load simulation stress block verification.',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SIMULATED_STRESS_TEST_JWT_TOKEN',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status code is 201': (r) => r.status === 201,
    'body contains kudosId': (r) => r.body.includes('kudosId'),
  });

  sleep(0.5); // Space transactions out to avoid unrealistic flood loops
}
```

## 5. Quarter 4 Acceptance Criteria (AC)

### Production Checklist

*   **Security Baseline Verification**: The database port (5432) must be locked down within a private AWS Security Group. It must only accept incoming connections originating from the specific private IP address of the EC2 backend host.
*   **Connection Pool Sizing**: PostgreSQL pool parameters within the Prisma client configuration must be optimized for constrained resources (`connection_limit=15`). This prevents connection allocation panics if multiple worker threads access the database at the same time.
*   **Zero-Downtime Rollover Target**: Container upgrade workflows must use explicit health checks before terminating old instances. The proxy layer should only route incoming traffic to new containers once they pass initialization sequences.

## 6. Detailed Weekly Sprint Backlog: Quarter 4

*   **Weeks 37–38 (AWS Account Isolation & Securing Networks)**: Configure the isolated AWS VPC subnets and set up access tokens for Upstash Kafka. Deploy the production relational database instance with SSL encryption enforced.
*   **Weeks 39–40 (CI/CD Deployment Automation Pipeline)**: Author and test GitHub Actions configuration scripts. Wire up environment key handling workflows to push images cleanly to production targets.
*   **Weeks 41–42 (Resource Constraints & Connection Optimization)**: Run k6 stress testing scripts to trace resource bottlenecks. Tune the app's Prisma connection pools and set memory caps on Node runtimes to maintain stability under load.
*   **Weeks 43–44 (Logging Infrastructure & System Monitoring)**: Configure automatic log rotation profiles to protect storage space on the instance. Set up simple metric monitors to track instance health and alert on high disk usage or memory leaks.
*   **Weeks 45–48 (Smart Contract Mainnet Deployment & Launch)**: Deploy verified copies of our smart contracts onto production Layer-2 testnets. Bind the final environment configuration variables to the frontend UI and securely onboard the 40 team members.
