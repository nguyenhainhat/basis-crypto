import { User as UserIcon, ExternalLink, Award } from 'lucide-react';
import { UserProfile, KudosLog } from '../types';

export function ProfileSummary({ 
  profile, 
  address, 
  receivedKudos 
}: { 
  profile: UserProfile | undefined | null;
  address: string | undefined;
  receivedKudos: KudosLog[];
}) {
  return (
    <div className="space-y-6 lg:col-span-4">
      <div className="glass p-6 rounded-2xl border border-white/[0.06] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="flex flex-col items-center text-center">
          <div className="bg-indigo-500/10 flex h-16 w-16 items-center justify-center rounded-2xl text-indigo-400">
            <UserIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">
            {profile?.username || 'Reputation Member'}
          </h2>
          <span className="mt-1 select-all font-mono text-xs text-zinc-400 hover:text-indigo-400 cursor-pointer flex items-center space-x-1">
            <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}</span>
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>

        <div className="mt-8 border-t border-white/[0.05] pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl text-center">
              <span className="text-xs text-zinc-400 block font-medium">Received Kudos</span>
              <span className="mt-1 text-2xl font-bold text-white block">
                {receivedKudos.length}
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl text-center">
              <span className="text-xs text-zinc-400 block font-medium">Points</span>
              <span className="mt-1 text-2xl font-bold text-indigo-400 block">
                {receivedKudos.reduce((sum, k) => sum + k.points, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/[0.06] shadow-xl">
        <h3 className="text-sm font-semibold text-white">Soulbound Tokens (SBT)</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-3 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
            <Award className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-medium text-white block">First Workspace Contributor</span>
              <span className="text-[10px] text-zinc-400">Minted automatically above 100 points</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
