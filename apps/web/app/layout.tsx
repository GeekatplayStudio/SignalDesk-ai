import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Providers } from './providers';
import { Sidebar } from './ui/sidebar';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/conversations', label: 'Conversations' },
  { href: '/agent-runs', label: 'Agent Runs' },
  { href: '/evals', label: 'Evals' },
  { href: '/metrics', label: 'Metrics' },
  { href: '/incidents', label: 'Incidents' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>
          <div className="flex h-screen">
            <aside className="w-64 border-r border-slate-900 bg-slate-950/70">
              <div className="px-4 py-5">
                <Link href="/" className="text-xl font-semibold text-white">
                  AgentOps Studio
                </Link>
              </div>
              <Sidebar items={navItems} />
            </aside>
            <main className="flex-1 overflow-y-auto px-8 py-8 bg-slate-950">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
