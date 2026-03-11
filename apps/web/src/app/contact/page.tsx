import type { Metadata } from 'next';
import { Mail, MessageCircle, Clock } from 'lucide-react';

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

      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold mb-6">
          Envoyer un message
        </h2>
        <form
          action="mailto:hello@samadal.net"
          method="get"
          encType="text/plain"
          className="space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="name">Nom</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Votre nom"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="vous@exemple.com"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="subject">Sujet</label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="Comment pouvons-nous vous aider ?"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="message">Message</label>
            <textarea
              id="message"
              name="body"
              rows={5}
              placeholder="Decrivez votre demande..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
