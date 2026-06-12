import { Module } from '@nestjs/common';
import { KudosService } from './kudos.service';
import { KudosController } from './kudos.controller';
import { KudosRepository } from './kudos.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [KudosController],
  providers: [KudosService, KudosRepository],
})
export class KudosModule {}
