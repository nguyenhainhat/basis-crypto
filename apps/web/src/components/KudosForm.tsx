import * as React from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { useSendKudos } from '../hooks/useKudos';

export function KudosForm() {
  const [receiver, setReceiver] = React.useState('');
  const [message, setMessage] = React.useState('');
  const { mutateAsync: sendKudos, isPending: isSending } = useSendKudos();
  const [sendSuccess, setSendSuccess] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver || !message) return;
    setSendSuccess(false);
    setSendError(null);

    try {
      await sendKudos({ receiverAddress: receiver, message });
      setSendSuccess(true);
      setReceiver('');
      setMessage('');
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      setSendError(error.message || 'Failed to dispatch Kudos points.');
    }
  };

  return (
    <div className="glass p-6 rounded-2xl border border-white/[0.06] shadow-xl">
      <div className="flex items-center space-x-2">
        <Send className="h-5 w-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Send Kudos Point</h2>
      </div>
      
      <form onSubmit={handleSendKudos} className="mt-6 space-y-4">
        <div>
          <label htmlFor="receiver" className="block text-xs font-semibold text-zinc-300">
            Receiver Wallet Address
          </label>
          <input
            id="receiver"
            type="text"
            required
            placeholder="0x..."
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-semibold text-zinc-300">
            Appreciation Message
          </label>
          <textarea
            id="message"
            required
            rows={3}
            placeholder="Great job maintaining the pipeline services today!"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {sendError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {sendError}
          </div>
        )}

        {sendSuccess && (
          <div className="flex items-center space-x-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Kudos points successfully recorded immutable on ledger!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending Kudos...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Dispatch Kudos</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
