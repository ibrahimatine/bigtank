import type { Metadata } from 'next';
import { getMyProfile } from '@/lib/api';
import { ProfileForm } from '@/components/profile/profile-form';

export const metadata: Metadata = {
  title: 'Mon profil',
};

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getMyProfile();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-6">
        Mon profil
      </h1>
      <ProfileForm profile={profile as never} />
    </div>
  );
}
