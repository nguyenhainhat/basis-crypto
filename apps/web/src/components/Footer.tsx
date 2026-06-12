export function Footer() {
  return (
    <footer className="border-t border-white/[0.03] py-6 text-center text-xs text-zinc-500">
      <div className="container mx-auto px-6">
        © {new Date().getFullYear()} dWorkspace. Decentralized reputation ledger. All rights reserved.
      </div>
    </footer>
  );
}
