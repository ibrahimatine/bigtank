'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { profileSchema } from '@/lib/validations';
import { SENEGAL_REGIONS } from '@samadal/shared-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProfileData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  city: string | null;
  region: string | null;
  avatarUrl: string | null;
  sellerStats?: {
    totalListings: number;
    activeListings: number;
    totalSales: number;
  };
}

interface Props {
  profile: ProfileData;
}

export function ProfileForm({ profile }: Props) {
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    city: profile.city || '',
    region: profile.region || '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Erreur lors de la sauvegarde');
        return;
      }

      toast.success('Profil mis a jour');
      router.refresh();
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgradeToSeller() {
    setUpgrading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/upgrade-to-seller', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || data.message || 'Erreur');
        return;
      }

      toast.success('Vous etes maintenant vendeur !');
      // Refresh JWT token to get SELLER role in claims
      await refreshUser();
      router.refresh();
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setUpgrading(false);
    }
  }

  const isSeller = user?.role === 'SELLER' || profile.role === 'SELLER';

  return (
    <div className="space-y-8">
      {/* Seller Stats */}
      {isSeller && profile.sellerStats && (
        <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
          <h2 className="font-semibold text-lg mb-4">Statistiques vendeur</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.sellerStats.totalListings}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">Annonces</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.sellerStats.activeListings}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">Actives</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.sellerStats.totalSales}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">Ventes</p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade to seller */}
      {!isSeller && (
        <div className="bg-[var(--color-accent)]/5 rounded-lg border border-[var(--color-accent)]/20 p-6 text-center">
          <h2 className="font-semibold text-lg mb-2">Devenir vendeur</h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Passez en mode vendeur pour publier vos annonces de chaussures grandes tailles.
          </p>
          <Button
            onClick={handleUpgradeToSeller}
            disabled={upgrading}
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
          >
            {upgrading ? 'Activation...' : 'Activer le mode vendeur'}
          </Button>
        </div>
      )}

      {/* Profile form */}
      <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
        <h2 className="font-semibold text-lg mb-4">Informations personnelles</h2>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="77 000 00 00"
              />
              {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={form.region} onValueChange={(v) => updateField('region', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {SENEGAL_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.region && <p className="text-xs text-red-500">{fieldErrors.region}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Dakar"
              />
              {fieldErrors.city && <p className="text-xs text-red-500">{fieldErrors.city}</p>}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : 'Enregistrer'}
          </Button>
        </form>
      </div>

      {/* Change password */}
      <ChangePasswordSection />
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');

    if (newPassword.length < 8) {
      setPwError('Le nouveau mot de passe doit faire au moins 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPwError(data.error || 'Erreur lors du changement');
        return;
      }

      toast.success('Mot de passe modifie');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwError('Erreur de connexion');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-6">
      <h2 className="font-semibold text-lg mb-4">Changer le mot de passe</h2>

      {pwError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">{pwError}</div>
      )}

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={pwLoading}
        >
          {pwLoading ? 'Modification...' : 'Changer le mot de passe'}
        </Button>
      </form>
    </div>
  );
}
