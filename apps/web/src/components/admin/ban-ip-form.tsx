'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface BannedIp {
  id: string;
  ip: string;
  reason: string | null;
  createdAt: string;
}

export function BanIpForm({ initialIps }: { initialIps: BannedIp[] }) {
  const router = useRouter();
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleBan() {
    if (!ip.trim()) {
      toast.error('Entrez une adresse IP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tools/ban-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ip.trim(), reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Erreur');
      }
      toast.success(`IP ${ip} bannie`);
      setIp('');
      setReason('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnban(id: string, ipAddr: string) {
    try {
      const res = await fetch(`/api/admin/tools/ban-ip/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`IP ${ipAddr} débannie`);
      router.refresh();
    } catch {
      toast.error('Erreur');
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="Adresse IP (ex: 192.168.1.1)"
          className="flex-1 min-w-[200px] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Raison (optionnel)"
          className="flex-1 min-w-[150px] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <button
          onClick={handleBan}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Bannir'}
        </button>
      </div>

      {initialIps.length > 0 ? (
        <div className="space-y-2">
          {initialIps.map((banned) => (
            <div
              key={banned.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-muted)]"
            >
              <div>
                <code className="text-sm font-mono">{banned.ip}</code>
                {banned.reason && (
                  <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                    — {banned.reason}
                  </span>
                )}
                <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                  ({new Date(banned.createdAt).toLocaleDateString('fr-SN')})
                </span>
              </div>
              <button
                onClick={() => handleUnban(banned.id, banned.ip)}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">Aucune IP bannie</p>
      )}
    </div>
  );
}
