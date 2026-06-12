import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Kudos, Prisma } from '@prisma/client';

@Injectable()
export class KudosRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.KudosCreateInput): Promise<Kudos> {
    return this.prisma.kudos.create({ data });
  }

  async findByReceiver(receiverId: string): Promise<Kudos[]> {
    return this.prisma.kudos.findMany({
      where: { receiverId },
      include: { sender: true },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findBySender(senderId: string): Promise<Kudos[]> {
    return this.prisma.kudos.findMany({
      where: { senderId },
      include: { receiver: true },
      orderBy: { timestamp: 'desc' },
    });
  }
}
