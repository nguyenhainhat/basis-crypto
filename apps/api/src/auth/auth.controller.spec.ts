import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    getNonce: jest.fn().mockResolvedValue('mock-nonce-456'),
    verifySignature: jest.fn().mockResolvedValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNonce', () => {
    it('should return a nonce object', async () => {
      const result = await controller.getNonce();
      expect(service.getNonce).toHaveBeenCalled();
      expect(result).toEqual({ nonce: 'mock-nonce-456' });
    });
  });

  describe('verify', () => {
    it('should call authService.verifySignature and return an access token object', async () => {
      const verifyDto = { message: 'siwe-msg', signature: '0xabc' };
      const result = await controller.verify(verifyDto);
      expect(service.verifySignature).toHaveBeenCalledWith('siwe-msg', '0xabc');
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });
  });
});
