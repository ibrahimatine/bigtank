import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Inscription',
};

export default function RegisterPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center mb-8">
        Creer un compte
      </h1>
      <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
