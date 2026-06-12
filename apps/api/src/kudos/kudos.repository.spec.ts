import { Test, TestingModule } from '@nestjs/testing';
import { KudosRepository } from './kudos.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('KudosRepository', () => {
  let repository: KudosRepository;
  let prismaService: PrismaService;

  const mockKudos = {
    id: 'kudos-id',
    message: 'Thanks!',
    points: 1,
    senderId: 'sender-id',
    receiverId: 'receiver-id',
    timestamp: new Date(),
  };

  const mockPrismaService = {
    kudos: {
      create: jest.fn().mockResolvedValue(mockKudos),
      findMany: jest.fn().mockResolvedValue([mockKudos]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KudosRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<KudosRepository>(KudosRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should invoke prisma.kudos.create with correct data', async () => {
      const createData = {
        message: 'Thanks!',
        sender: { connect: { id: 'sender-id' } },
        receiver: { connect: { id: 'receiver-id' } },
      };
      const res = await repository.create(createData);
      expect(prismaService.kudos.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(res).toEqual(mockKudos);
    });
  });

  describe('findByReceiver', () => {
    it('should invoke prisma.kudos.findMany with receiver filter and relations included', async () => {
      const res = await repository.findByReceiver('receiver-id');
      expect(prismaService.kudos.findMany).toHaveBeenCalledWith({
        where: { receiverId: 'receiver-id' },
        include: { sender: true },
        orderBy: { timestamp: 'desc' },
      });
      expect(res).toEqual([mockKudos]);
    });
  });

  describe('findBySender', () => {
    it('should invoke prisma.kudos.findMany with sender filter and relations included', async () => {
      const res = await repository.findBySender('sender-id');
      expect(prismaService.kudos.findMany).toHaveBeenCalledWith({
        where: { senderId: 'sender-id' },
        include: { receiver: true },
        orderBy: { timestamp: 'desc' },
      });
      expect(res).toEqual([mockKudos]);
    });
  });
});
