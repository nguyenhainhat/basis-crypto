import { useAuthStore } from './authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
  });

  it('should initialize with empty state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.walletAddress).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set session correctly', () => {
    useAuthStore.getState().setSession('mock-token', '0x123');
    const state = useAuthStore.getState();
    expect(state.token).toBe('mock-token');
    expect(state.walletAddress).toBe('0x123');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear session correctly', () => {
    useAuthStore.getState().setSession('mock-token', '0x123');
    useAuthStore.getState().clearSession();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.walletAddress).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
