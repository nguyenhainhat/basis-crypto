import { Test, TestingModule } from '@nestjs/testing';
import { KudosService } from './kudos.service';
import { KudosRepository } from './kudos.repository';
import { UsersService } from '../users/users.service';
import { BadRequestException } from '@nestjs/common';

describe('KudosService', () => {
  let service: KudosService;
  let repository: KudosRepository;
  let usersService: UsersService;

  const mockSender = { id: 'sender-id', walletAddress: '0xsender' };
  const mockReceiver = { id: 'receiver-id', walletAddress: '0xreceiver' };
  const mockKudos = { id: 'kudos-id', message: 'Good job!', senderId: 'sender-id', receiverId: 'receiver-id' };

  const mockKudosRepository = {
    create: jest.fn().mockResolvedValue(mockKudos),
    findByReceiver: jest.fn().mockResolvedValue([mockKudos]),
  };

  const mockUsersService = {
    findOrCreateUser: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KudosService,
        {
          provide: KudosRepository,
          useValue: mockKudosRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<KudosService>(KudosService);
    repository = module.get<KudosRepository>(KudosRepository);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendKudos', () => {
    it('should successfully send kudos when sender and receiver are different', async () => {
      mockUsersService.findOrCreateUser.mockImplementation((wallet: string) => {
        if (wallet === '0xsender') return mockSender;
        if (wallet === '0xreceiver') return mockReceiver;
        return null;
      });

      const result = await service.sendKudos('0xsender', '0xreceiver', 'Good job!');

      expect(usersService.findOrCreateUser).toHaveBeenCalledWith('0xsender');
      expect(usersService.findOrCreateUser).toHaveBeenCalledWith('0xreceiver');
      expect(repository.create).toHaveBeenCalledWith({
        message: 'Good job!',
        sender: { connect: { id: 'sender-id' } },
        receiver: { connect: { id: 'receiver-id' } },
      });
      expect(result).toEqual(mockKudos);
    });

    it('should throw BadRequestException on self-gifting attempt', async () => {
      await expect(
        service.sendKudos('0xsender', '0xSENDER', 'Self kudos!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReceivedKudos', () => {
    it('should load received kudos for valid user address', async () => {
      mockUsersService.getProfile.mockResolvedValue(mockReceiver);

      const result = await service.getReceivedKudos('0xreceiver');

      expect(usersService.getProfile).toHaveBeenCalledWith('0xreceiver');
      expect(repository.findByReceiver).toHaveBeenCalledWith('receiver-id');
      expect(result).toEqual([mockKudos]);
    });
  });
});
