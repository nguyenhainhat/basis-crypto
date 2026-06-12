import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;

  const mockUser = {
    id: 'user-id',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    username: 'testuser',
  };

  const mockUserRepository = {
    findByWalletAddress: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should convert walletAddress to lowercase, find and return user', async () => {
      mockUserRepository.findByWalletAddress.mockResolvedValue(mockUser);

      const result = await service.getProfile('0x1234567890ABCDEF1234567890ABCDEF12345678');

      expect(repository.findByWalletAddress).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserRepository.findByWalletAddress.mockResolvedValue(null);

      await expect(
        service.getProfile('0x1234567890abcdef1234567890abcdef12345678'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOrCreateUser', () => {
    it('should normalize and return existing user if found', async () => {
      mockUserRepository.findByWalletAddress.mockResolvedValue(mockUser);

      const result = await service.findOrCreateUser('0x1234567890ABCDEF1234567890ABCDEF12345678');

      expect(repository.findByWalletAddress).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
      );
      expect(repository.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should normalize, create and return user if not found', async () => {
      mockUserRepository.findByWalletAddress.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreateUser('0x1234567890ABCDEF1234567890ABCDEF12345678');

      expect(repository.findByWalletAddress).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
      );
      expect(repository.create).toHaveBeenCalledWith({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      });
      expect(result).toEqual(mockUser);
    });
  });
});
