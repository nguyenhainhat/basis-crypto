import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { KudosModule } from './kudos/kudos.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    SentryModule.forRoot(),
    PrismaModule, 
    UsersModule, 
    KudosModule, 
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    }
  ],
})
export class AppModule {}
