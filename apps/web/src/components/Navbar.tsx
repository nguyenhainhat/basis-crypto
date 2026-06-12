import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Award, LogOut } from 'lucide-react';

export function Navbar({ 
  isAuthenticated, 
  onLogout 
}: { 
  isAuthenticated: boolean; 
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20">
            <Award className="h-5 w-5 text-white animate-pulse" />
          </div>
          <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            dWorkspace
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
          {isAuthenticated && (
            <button 
              onClick={onLogout}
              className="flex items-center space-x-1.5 rounded-lg border border-white/8 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
