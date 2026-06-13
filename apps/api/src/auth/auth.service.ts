import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SiweMessage, generateNonce } from 'siwe';
import { UsersService } from '../users/users.service';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class AuthService {
  private nonces = new Map<string, string>(); // In-memory nonce storage

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async getNonce(): Promise<string> {
    const nonce = generateNonce();
    // In a real app, you might associate this nonce with a session ID
    return nonce;
  }

  async verifySignature(message: string, signature: string): Promise<string> {
    return Sentry.startSpan(
      { op: 'auth.verify', name: 'SIWE Cryptographic Verification' },
      async (span) => {
        try {
          Sentry.addBreadcrumb({ category: 'auth', message: 'Starting SIWE verification process' });
          const siweMessage = new SiweMessage(message);
          const { data: fields } = await siweMessage.verify({ signature });

          if (fields.nonce !== siweMessage.nonce) {
            Sentry.addBreadcrumb({ category: 'auth', message: 'Nonce mismatch detected', level: 'warning' });
            throw new UnauthorizedException('Invalid nonce');
          }

          // Find or create user
          const user = await this.usersService.findOrCreateUser(fields.address);

          // Generate JWT
          const payload = { sub: user.id, walletAddress: user.walletAddress };
          const token = this.jwtService.sign(payload);
          
          span?.setAttribute('auth.status', 'success');
          return token;
        } catch (error) {
          Sentry.addBreadcrumb({ category: 'auth', message: `SIWE verification failed`, level: 'error' });
          span?.setAttribute('auth.status', 'failed');
          throw new UnauthorizedException('Signature verification failed');
        }
      }
    );
  }
}
