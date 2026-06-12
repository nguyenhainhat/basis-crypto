import { apiFetch, apiClient } from './api';
import { useAuthStore } from '../store/authStore';

jest.mock('../store/authStore');

describe('API Fetch Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should inject Authorization header if token exists', () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ token: 'mock-jwt-token' });
    
    // Testing the Axios interceptor directly:
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = interceptor({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  it('should not inject Authorization header if token is missing', () => {
    (useAuthStore.getState as jest.Mock).mockReturnValue({ token: null });
    
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = interceptor({ headers: {} });
    expect(config.headers?.Authorization).toBeUndefined();
  });

  it('should format requests correctly through apiFetch wrapper', async () => {
    const mockRequest = jest.spyOn(apiClient, 'request').mockResolvedValueOnce({ data: { success: true } });

    await apiFetch('/test-path', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' })
    });

    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: '/test-path',
      method: 'POST',
      data: { message: 'hello' }
    }));
  });
});
