import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    return Sentry.startSpan(
      {
        op: 'http.server',
        name: `${request.method} ${request.route?.path || request.url}`,
      },
      (span) => {
        return next.handle().pipe(
          tap(() => {
            if (span) {
              const response = context.switchToHttp().getResponse();
              span.setAttribute('http.status_code', response.statusCode);
            }
          }),
          catchError((exception) => {
            Sentry.captureException(exception);
            if (span) {
              span.setAttribute('http.status_code', exception.status || 500);
            }
            throw exception;
          }),
        );
      },
    );
  }
}
