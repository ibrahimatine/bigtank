import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Connexion',
};

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center mb-8">
        Connexion
      </h1>
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
