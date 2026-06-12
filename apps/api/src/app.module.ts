import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { KudosModule } from './kudos/kudos.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, UsersModule, KudosModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
