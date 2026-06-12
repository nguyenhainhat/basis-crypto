import { Test, TestingModule } from '@nestjs/testing';
import { WalletNormalizationInterceptor } from './wallet-normalization.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('WalletNormalizationInterceptor', () => {
  let interceptor: WalletNormalizationInterceptor;

  const mockCallHandler: CallHandler = {
    handle: () => of('next-called'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletNormalizationInterceptor],
    }).compile();

    interceptor = module.get<WalletNormalizationInterceptor>(WalletNormalizationInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should convert body walletAddress, receiverAddress, and param walletAddress to lowercase', () => {
    const mockRequest = {
      body: {
        walletAddress: '0xABC123',
        receiverAddress: '0xDEF456',
      },
      params: {
        walletAddress: '0xXYZ789',
      },
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(mockExecutionContext, mockCallHandler);

    expect(mockRequest.body.walletAddress).toBe('0xabc123');
    expect(mockRequest.body.receiverAddress).toBe('0xdef456');
    expect(mockRequest.params.walletAddress).toBe('0xxyz789');
  });

  it('should run gracefully if body, params, or targets are missing', () => {
    const mockRequest = {};

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => {
      interceptor.intercept(mockExecutionContext, mockCallHandler);
    }).not.toThrow();
  });
});
