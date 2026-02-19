import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Messages',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {children}
    </div>
  );
}
