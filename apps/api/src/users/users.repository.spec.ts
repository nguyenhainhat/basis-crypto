import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-id',
    walletAddress: '0x123',
    username: 'testuser',
    profilePicture: null,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should call prisma.user.findUnique with correct args', async () => {
      const res = await repository.findById('user-id');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(res).toEqual(mockUser);
    });
  });

  describe('findByWalletAddress', () => {
    it('should call prisma.user.findUnique with correct args', async () => {
      const res = await repository.findByWalletAddress('0x123');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { walletAddress: '0x123' },
      });
      expect(res).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should call prisma.user.create with correct args', async () => {
      const createData = { walletAddress: '0x123' };
      const res = await repository.create(createData);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(res).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should call prisma.user.update with correct args', async () => {
      const updateData = { username: 'updated' };
      const res = await repository.update('user-id', updateData);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: updateData,
      });
      expect(res).toEqual(mockUser);
    });
  });
});
