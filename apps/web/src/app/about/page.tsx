import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A propos de Samadal',
  description:
    'Samadal est la marketplace de reference pour les chaussures grandes tailles (EU 46+) au Senegal.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold mb-2">
        A propos de{' '}
        <span className="text-[var(--color-accent)]">Samadal</span>
      </h1>
      <p className="text-[var(--color-muted-foreground)] text-lg mb-12">
        La marketplace pensee pour ceux qui chaussent grand.
      </p>

      <div className="space-y-10 text-[var(--color-muted-foreground)] leading-relaxed">
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-foreground)] mb-3">
            Notre histoire
          </h2>
          <p>
            Samadal est nee d&apos;un constat simple : trouver des chaussures en grande
            taille (EU 46, 47, 48, 49, 50...) au Senegal relevent du parcours du
            combattant. Les boutiques classiques s&apos;arretent rarement au-dela du 45,
            et les plateformes internationales impliquent des frais de port eleves et
            des delais incertains.
          </p>
          <p className="mt-3">
            Nous avons cree Samadal pour changer ca : un espace dedie, pensé pour la
            communaute senegalaise, ou vendeurs et acheteurs se retrouvent directement
            sans intermediaire.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-foreground)] mb-3">
            Ce que nous offrons
          </h2>
          <ul className="space-y-2">
            {[
              'Annonces exclusivement pour les tailles EU 46 et au-dessus',
              'Mise en relation directe vendeur/acheteur via le chat integre',
              'Recherche par taille, marque, etat et localisation',
              'Paiement via Wave, Orange Money, Free Money ou carte bancaire',
              'Gratuit pour les vendeurs — pas de commission sur les ventes',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[var(--color-accent)] font-bold mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-foreground)] mb-3">
            Nos valeurs
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Simplicite',
                desc: 'Une annonce en 2 minutes. Un message pour contacter le vendeur. Pas de complexite inutile.',
              },
              {
                title: 'Confiance',
                desc: 'Photos verifiees, profils vendeurs, historique des transactions pour acheter en toute sereinite.',
              },
              {
                title: 'Communaute',
                desc: 'Fait au Senegal, pour les Senegalais — et pour tous ceux qui chaussent grand en Afrique de l\'Ouest.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-5"
              >
                <h3 className="font-semibold text-[var(--color-foreground)] mb-2">{title}</h3>
                <p className="text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-foreground)] mb-3">
            Contact
          </h2>
          <p>
            Une question, un partenariat ou un retour ? Ecrivez-nous a{' '}
            <a
              href="mailto:hello@samadal.net"
              className="text-[var(--color-accent)] hover:underline"
            >
              hello@samadal.net
            </a>
            . Nous repondons dans les 48h.
          </p>
        </section>
      </div>
    </div>
  );
}
