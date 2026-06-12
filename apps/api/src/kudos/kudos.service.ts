import { Injectable, BadRequestException } from '@nestjs/common';
import { KudosRepository } from './kudos.repository';
import { UsersService } from '../users/users.service';
import * as Sentry from '@sentry/node';

@Injectable()
export class KudosService {
  constructor(
    private kudosRepository: KudosRepository,
    private usersService: UsersService,
  ) {}

  async sendKudos(senderWallet: string, receiverWallet: string, message: string) {
    if (senderWallet.toLowerCase() === receiverWallet.toLowerCase()) {
      Sentry.addBreadcrumb({ category: 'kudos', message: 'User tried to send kudos to self', level: 'warning' });
      throw new BadRequestException('You cannot send kudos to yourself');
    }

    return Sentry.startSpan(
      { op: 'db.query', name: 'KudosService.sendKudos Transaction' },
      async (span) => {
        Sentry.addBreadcrumb({ 
          category: 'kudos', 
          message: `Sending kudos from ${senderWallet} to ${receiverWallet}` 
        });
        
        const sender = await this.usersService.findOrCreateUser(senderWallet);
        const receiver = await this.usersService.findOrCreateUser(receiverWallet);

        const result = await this.kudosRepository.create({
          message,
          sender: { connect: { id: sender.id } },
          receiver: { connect: { id: receiver.id } },
        });

        span?.setAttribute('db.records_updated', 1);
        return result;
      }
    );
  }

  async getReceivedKudos(walletAddress: string) {
    return Sentry.startSpan(
      { op: 'db.query', name: 'KudosService.getReceivedKudos' },
      async () => {
        const user = await this.usersService.getProfile(walletAddress);
        return this.kudosRepository.findByReceiver(user.id);
      }
    );
  }
}
