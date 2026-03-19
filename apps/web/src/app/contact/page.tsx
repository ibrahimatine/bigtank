import type { Metadata } from 'next';
import { Mail, MessageCircle, Clock } from 'lucide-react';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'equipe Samadal pour toute question ou signalement.',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold mb-2">
        Contactez-nous
      </h1>
      <p className="text-[var(--color-muted-foreground)] text-lg mb-12">
        Une question, un probleme ou une suggestion ? On est la.
      </p>

      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {[
          {
            icon: Mail,
            title: 'Email',
            desc: 'Pour toute question generale',
            value: 'hello@samadal.net',
            href: 'mailto:hello@samadal.net',
          },
          {
            icon: MessageCircle,
            title: 'Signalement',
            desc: 'Annonce suspecte ou litige',
            value: 'support@samadal.net',
            href: 'mailto:support@samadal.net',
          },
          {
            icon: Clock,
            title: 'Delai de reponse',
            desc: 'Nous repondons generalement',
            value: 'sous 48h',
            href: null,
          },
        ].map(({ icon: Icon, title, desc, value, href }) => (
          <div
            key={title}
            className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-2">{desc}</p>
            {href ? (
              <a href={href} className="text-sm font-medium text-[var(--color-accent)] hover:underline">
                {value}
              </a>
            ) : (
              <p className="text-sm font-medium">{value}</p>
            )}
          </div>
        ))}
      </div>

      <ContactForm />
    </div>
  );
}
