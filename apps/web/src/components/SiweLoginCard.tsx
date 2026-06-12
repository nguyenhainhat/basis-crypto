import { User as UserIcon, Loader2 } from 'lucide-react';

export function SiweLoginCard({ 
  onSignIn, 
  isSigning, 
  authError 
}: { 
  onSignIn: () => void;
  isSigning: boolean;
  authError: string | null;
}) {
  return (
    <div className="mx-auto max-w-md py-16">
      <div className="glass p-8 rounded-2xl border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col items-center text-center">
          <div className="bg-indigo-500/10 mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-indigo-400">
            <UserIcon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Verify Your Identity</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Your wallet is connected, but no session is established on our server. Cryptographically sign a message to log into your reputation profile securely.
          </p>

          {authError && (
            <div className="mt-4 w-full rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
              {authError}
            </div>
          )}

          <button
            onClick={onSignIn}
            disabled={isSigning}
            className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing Message...</span>
              </>
            ) : (
              <span>Sign Cryptographically</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
