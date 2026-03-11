import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialite',
  description: 'Politique de confidentialite et de protection des donnees personnelles de Samadal.',
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

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold mb-2">
        Politique de confidentialite
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)] mb-12">
        Derniere mise a jour : {LAST_UPDATED}
      </p>

      <Section title="1. Données collectées">
        <p>Lors de votre inscription et utilisation de Samadal, nous collectons :</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Informations d&apos;identification : nom, adresse email, numero de telephone</li>
          <li>Informations de localisation : ville et region (Senegal)</li>
          <li>Contenu genere : annonces publiees, photos, messages de chat</li>
          <li>Donnees techniques : adresse IP, type de navigateur, pages visitees</li>
        </ul>
      </Section>

      <Section title="2. Utilisation des données">
        <p>Vos donnees sont utilisees pour :</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Gerer votre compte et authentifier vos connexions</li>
          <li>Afficher vos annonces et faciliter les transactions</li>
          <li>Vous permettre de communiquer avec d&apos;autres utilisateurs via le chat</li>
          <li>Ameliorer les performances et la securite de la plateforme</li>
          <li>Vous contacter en cas de besoin relatif a votre compte</li>
        </ul>
        <p className="mt-2">
          Nous ne vendons jamais vos donnees personnelles a des tiers.
        </p>
      </Section>

      <Section title="3. Partage des données">
        <p>
          Certaines de vos donnees sont visibles par d&apos;autres utilisateurs : votre nom
          d&apos;affichage, votre ville, et les annonces que vous publiez. Votre adresse email
          et numero de telephone ne sont jamais affichés publiquement.
        </p>
        <p className="mt-2">
          Nous pouvons partager vos donnees avec des prestataires techniques (hebergement,
          paiement) dans la stricte limite de leurs missions.
        </p>
      </Section>

      <Section title="4. Conservation des données">
        <p>
          Vos donnees sont conservees pendant la duree de votre compte actif, plus 12 mois
          apres suppression du compte pour des raisons legales. Les messages de chat sont
          conserves 24 mois.
        </p>
      </Section>

      <Section title="5. Sécurité">
        <p>
          Vos mots de passe sont hashs (bcrypt). Les echanges avec notre API sont chiffres
          (HTTPS). Vos tokens d&apos;authentification sont stockes dans des cookies httpOnly
          non accessibles au JavaScript.
        </p>
      </Section>

      <Section title="6. Vos droits">
        <p>Conformement a la loi senegalaise sur la protection des donnees, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Acces</strong> : consulter les donnees que nous detenons sur vous</li>
          <li><strong>Rectification</strong> : corriger des donnees inexactes</li>
          <li><strong>Suppression</strong> : demander la suppression de votre compte et de vos donnees</li>
          <li><strong>Portabilite</strong> : recevoir vos donnees dans un format standard</li>
        </ul>
        <p className="mt-2">
          Pour exercer ces droits, contactez{' '}
          <a href="mailto:privacy@samadal.net" className="text-[var(--color-accent)] hover:underline">
            privacy@samadal.net
          </a>
          .
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Samadal utilise uniquement des cookies fonctionnels (authentification, session).
          Aucun cookie publicitaire ou de tracking tiers n&apos;est utilise. Vous pouvez
          desactiver les cookies dans votre navigateur mais cela vous deconnectera de la
          plateforme.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Pour toute question relative a vos donnees personnelles :{' '}
          <a href="mailto:privacy@samadal.net" className="text-[var(--color-accent)] hover:underline">
            privacy@samadal.net
          </a>
        </p>
      </Section>
    </div>
  );
}
