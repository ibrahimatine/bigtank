import type { Metadata } from 'next';
import { getAdminBannedIps } from '@/lib/api';
import { ReindexButton } from '@/components/admin/reindex-button';
import { MassEmailForm } from '@/components/admin/mass-email-form';
import { BanIpForm } from '@/components/admin/ban-ip-form';
import { CleanupInactiveButton } from '@/components/admin/cleanup-inactive-button';
import { CleanupUnverifiedButton } from '@/components/admin/cleanup-unverified-button';

export const metadata: Metadata = { title: 'Outils' };
export const dynamic = 'force-dynamic';

export default async function AdminToolsPage() {
  const bannedIps = await getAdminBannedIps();

  return (
    <div className="pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold mb-6">Outils</h1>

      <div className="space-y-6">
        {/* Reindex Meilisearch */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-2">Reindexer Meilisearch</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Reconstruit l&apos;index de recherche a partir de toutes les annonces actives.
          </p>
          <ReindexButton />
        </div>

        {/* Mass email */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-2">Email de masse</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Envoyer un email a tous les utilisateurs actifs avec un email verifie.
          </p>
          <MassEmailForm />
        </div>

        {/* Ban IP */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-2">IP bannies</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Bloquer des adresses IP specifiques.
          </p>
          <BanIpForm initialIps={bannedIps} />
        </div>

        {/* Cleanup non verifies */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-2">Nettoyage comptes non verifies</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Supprimer definitivement les comptes dont l&apos;email n&apos;est pas verifie depuis plus de 3 jours.
            Ce sont souvent des faux comptes ou des erreurs de saisie.
          </p>
          <CleanupUnverifiedButton />
        </div>

        {/* Cleanup inactifs */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold mb-2">Nettoyage comptes inactifs</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Supprimer les comptes inactifs depuis plus de 90 jours (0 annonces, 0 messages).
          </p>
          <CleanupInactiveButton />
        </div>
      </div>
    </div>
  );
}
