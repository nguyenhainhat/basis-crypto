'use client';

import * as React from 'react';
import { useConnection, useChainId, useSignMessage, useDisconnect } from 'wagmi';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../config/api';
import { API_ENDPOINTS } from '../config/endpoints';
import { useUserProfile } from '../hooks/useUsers';
import { useUserKudos } from '../hooks/useKudos';

// Components
import { Navbar } from '../components/Navbar';
import { LandingHero } from '../components/LandingHero';
import { SiweLoginCard } from '../components/SiweLoginCard';
import { ProfileSummary } from '../components/ProfileSummary';
import { KudosForm } from '../components/KudosForm';
import { KudosTimeline } from '../components/KudosTimeline';
import { Footer } from '../components/Footer';

export default function Home() {
  const { isConnected, address } = useConnection();
  const chainId = useChainId();
  const { mutateAsync: signMessageAsync } = useSignMessage();
  const { mutate: disconnect } = useDisconnect();

  // Zustand Store
  const { isAuthenticated, setSession, clearSession } = useAuthStore();

  // Component States
  const [isSigning, setIsSigning] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  
  // Profile and Kudos States (Migrated to React Query)
  const { 
    data: profile, 
    isError: isProfileError,
    error: profileError
  } = useUserProfile(isAuthenticated ? address : undefined);

  const { 
    data: receivedKudos = [], 
    isLoading: isLoadingData,
    isError: isKudosError,
    error: kudosError
  } = useUserKudos(isAuthenticated ? address : undefined);

  // Sync session on wallet change/disconnect
  React.useEffect(() => {
    if (!isConnected) {
      clearSession();
    }
  }, [isConnected, clearSession]);

  // Handle JWT Expiry automatically
  React.useEffect(() => {
    if (isProfileError && profileError?.message?.includes('Unauthorized')) {
      clearSession();
    }
    if (isKudosError && kudosError?.message?.includes('Unauthorized')) {
      clearSession();
    }
  }, [isProfileError, profileError, isKudosError, kudosError, clearSession]);

  // EIP-4361 SIWE cryptographically secure sign-in
  const handleSignIn = async () => {
    if (!address) return;
    setIsSigning(true);
    setAuthError(null);

    try {
      const { nonce } = await apiFetch(API_ENDPOINTS.AUTH.NONCE);

      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = 'Sign in to dWorkspace with your Ethereum account.';
      const issuedAt = new Date().toISOString();

      const siweMessage = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId || 31337}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

      const signature = await signMessageAsync({ message: siweMessage });

      const result = await apiFetch(API_ENDPOINTS.AUTH.VERIFY, {
        method: 'POST',
        body: JSON.stringify({
          message: siweMessage,
          signature,
        }),
      });

      setSession(result.access_token, address);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('SIWE signature verification failed:', error);
      setAuthError(error.message || 'Signature verification rejected.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleManualLogout = () => {
    clearSession();
    disconnect();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleManualLogout} />

      {/* Main Grid */}
      <main className="container mx-auto flex-1 px-6 py-10">
        {!isConnected ? (
          <LandingHero />
        ) : !isAuthenticated ? (
          <SiweLoginCard 
            onSignIn={handleSignIn} 
            isSigning={isSigning} 
            authError={authError} 
          />
        ) : (
          /* Dashboard Content */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <ProfileSummary 
              profile={profile} 
              address={address} 
              receivedKudos={receivedKudos} 
            />

            <div className="space-y-6 lg:col-span-8">
              <KudosForm />
              <KudosTimeline 
                receivedKudos={receivedKudos} 
                isLoadingData={isLoadingData} 
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
