import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

const mockNonce = 'mock-nonce-123';
const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
const mockUser = {
  id: 'user-id-abc',
  walletAddress: mockAddress,
};

// Mock SIWE verify flow
const mockVerify = jest.fn();
jest.mock('siwe', () => {
  const original = jest.requireActual('siwe');
  return {
    ...original,
    generateNonce: () => 'mock-nonce-123',
    SiweMessage: jest.fn().mockImplementation(() => {
      return {
        nonce: mockNonce,
        verify: mockVerify,
      };
    }),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockUsersService = {
    findOrCreateUser: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNonce', () => {
    it('should generate a nonce string', async () => {
      const nonce = await service.getNonce();
      expect(nonce).toBe('mock-nonce-123');
    });
  });

  describe('verifySignature', () => {
    it('should successfully verify signature, retrieve user, and issue JWT', async () => {
      mockVerify.mockResolvedValue({
        data: {
          nonce: mockNonce,
          address: mockAddress,
        },
      });

      const token = await service.verifySignature('dummy-message', 'dummy-signature');

      expect(mockVerify).toHaveBeenCalledWith({ signature: 'dummy-signature' });
      expect(usersService.findOrCreateUser).toHaveBeenCalledWith(mockAddress);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        walletAddress: mockUser.walletAddress,
      });
      expect(token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException if nonce mismatch occurs', async () => {
      mockVerify.mockResolvedValue({
        data: {
          nonce: 'different-nonce',
          address: mockAddress,
        },
      });

      await expect(
        service.verifySignature('dummy-message', 'dummy-signature'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if SIWE verification fails', async () => {
      mockVerify.mockRejectedValue(new Error('Invalid signature'));

      await expect(
        service.verifySignature('dummy-message', 'dummy-signature'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
