import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WalletNormalizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Normalize body walletAddress
    if (request.body && request.body.walletAddress) {
      request.body.walletAddress = request.body.walletAddress.toLowerCase();
    }
    
    // Normalize receiverAddress if present (for kudos)
    if (request.body && request.body.receiverAddress) {
      request.body.receiverAddress = request.body.receiverAddress.toLowerCase();
    }

    // Normalize params if walletAddress is there
    if (request.params && request.params.walletAddress) {
      request.params.walletAddress = request.params.walletAddress.toLowerCase();
    }

    return next.handle();
  }
}
