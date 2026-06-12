import { Test, TestingModule } from '@nestjs/testing';
import { KudosController } from './kudos.controller';
import { KudosService } from './kudos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('KudosController', () => {
  let controller: KudosController;
  let service: KudosService;

  const mockKudos = {
    id: 'kudos-id',
    message: 'Awesome work!',
    senderId: 'sender-id',
    receiverId: 'receiver-id',
  };

  const mockKudosService = {
    sendKudos: jest.fn().mockResolvedValue(mockKudos),
    getReceivedKudos: jest.fn().mockResolvedValue([mockKudos]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KudosController],
      providers: [
        {
          provide: KudosService,
          useValue: mockKudosService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    controller = module.get<KudosController>(KudosController);
    service = module.get<KudosService>(KudosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendKudos', () => {
    it('should call kudosService.sendKudos with current user address and input payload', async () => {
      const user = { userId: 'sender-id', walletAddress: '0xsender' };
      const body = { receiverAddress: '0xreceiver', message: 'Awesome work!' };

      const result = await controller.sendKudos(user, body);

      expect(service.sendKudos).toHaveBeenCalledWith('0xsender', '0xreceiver', 'Awesome work!');
      expect(result).toEqual(mockKudos);
    });
  });

  describe('getReceived', () => {
    it('should call kudosService.getReceivedKudos and return list', async () => {
      const result = await controller.getReceived('0xreceiver');

      expect(service.getReceivedKudos).toHaveBeenCalledWith('0xreceiver');
      expect(result).toEqual([mockKudos]);
    });
  });
});
