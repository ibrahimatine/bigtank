import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions generales d'utilisation de la plateforme Samadal.",
};

const LAST_UPDATED = '1er janvier 2025';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-foreground)] mb-3">
        {title}
      </h2>
      <div className="space-y-2 text-[var(--color-muted-foreground)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold mb-2">
        Conditions d&apos;utilisation
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-12">
        Derniere mise a jour : {LAST_UPDATED}
      </p>

      <Section title="1. Acceptation des conditions">
        <p>
          En accedant a Samadal et en utilisant nos services, vous acceptez d&apos;etre lie
          par ces conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez
          ne pas utiliser la plateforme.
        </p>
      </Section>

      <Section title="2. Description du service">
        <p>
          Samadal est une place de marche en ligne permettant aux particuliers d&apos;acheter et
          de vendre des chaussures au Senegal.
          Samadal agit en qualite d&apos;intermediaire technique et n&apos;est pas partie aux
          transactions entre vendeurs et acheteurs.
        </p>
      </Section>

      <Section title="3. Conditions d'utilisation pour les vendeurs">
        <p>Pour publier des annonces sur Samadal, vous devez :</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Etre majeur (18 ans ou plus)</li>
          <li>Etre le proprietaire legitime des articles mis en vente</li>
          <li>Fournir des descriptions et photos fideles a l&apos;etat reel des articles</li>
          <li>Vendre uniquement des articles legaux et non contrefaits</li>
          <li>Honorer les ventes conclues avec les acheteurs</li>
        </ul>
      </Section>

      <Section title="4. Conditions pour les acheteurs">
        <p>
          Samadal facilite la mise en relation mais n&apos;est pas responsable des transactions.
          Nous recommandons de :
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Verifier l&apos;etat des articles avant paiement si possible</li>
          <li>Utiliser les moyens de paiement securises (Wave, Orange Money, etc.)</li>
          <li>Signaler tout comportement suspect via support@samadal.net</li>
        </ul>
      </Section>

      <Section title="5. Contenu interdit">
        <p>Il est interdit de publier sur Samadal :</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Des articles contrefaits ou de marque usurpee</li>
          <li>Des articles illegaux ou soumis a restriction</li>
          <li>Des photos trompeuses ou volees</li>
          <li>Des informations de contact dans les descriptions d&apos;annonces</li>
          <li>Des annonces pour des articles autres que des chaussures</li>
        </ul>
      </Section>

      <Section title="6. Responsabilite">
        <p>
          Samadal s&apos;efforce de maintenir la plateforme en fonctionnement mais ne peut
          garantir une disponibilite ininterrompue. Samadal n&apos;est pas responsable des
          litiges entre vendeurs et acheteurs, ni des pertes resultant de transactions
          conclues sur la plateforme.
        </p>
      </Section>

      <Section title="7. Propriete intellectuelle">
        <p>
          Les photos et contenus publies sur Samadal restent la propriete de leurs auteurs.
          En publiant du contenu, vous accordez a Samadal une licence non exclusive pour
          afficher ce contenu sur la plateforme.
        </p>
      </Section>

      <Section title="8. Modification des conditions">
        <p>
          Samadal se reserve le droit de modifier ces conditions a tout moment. Les
          utilisateurs seront informes des changements significatifs. L&apos;utilisation continue
          de la plateforme apres modification vaut acceptation des nouvelles conditions.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Pour toute question relative a ces conditions, contactez-nous a{' '}
          <a href="mailto:legal@samadal.net" className="text-[var(--color-accent)] hover:underline">
            legal@samadal.net
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
