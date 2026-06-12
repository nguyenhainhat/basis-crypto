import { MessageSquare, Loader2, Award, Clock } from 'lucide-react';
import { KudosLog } from '../types';

export function KudosTimeline({ 
  receivedKudos, 
  isLoadingData 
}: { 
  receivedKudos: KudosLog[];
  isLoadingData: boolean;
}) {
  return (
    <div className="glass p-6 rounded-2xl border border-white/[0.06] shadow-xl">
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="h-5 w-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Received Kudos Timeline</h2>
      </div>

      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs text-zinc-400">Loading received logs...</span>
        </div>
      ) : receivedKudos.length === 0 ? (
        <div className="border border-dashed border-white/[0.08] p-10 rounded-2xl text-center">
          <Award className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white">No Kudos Received Yet</h4>
          <p className="mt-1 text-xs text-zinc-400">Share your wallet address with colleagues to receive recognition points.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {receivedKudos.map((kudos) => (
            <div 
              key={kudos.id} 
              className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl glass-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium block">
                    From: <span className="font-mono text-zinc-300">{kudos.sender.walletAddress}</span>
                  </span>
                  <p className="mt-2 text-sm text-white leading-relaxed">{kudos.message}</p>
                </div>
                <span className="flex-shrink-0 bg-indigo-500/10 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                  +{kudos.points} Kudos
                </span>
              </div>
              <div className="mt-4 flex items-center space-x-1.5 text-[10px] text-zinc-500">
                <Clock className="h-3 w-3" />
                <span>{new Date(kudos.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
