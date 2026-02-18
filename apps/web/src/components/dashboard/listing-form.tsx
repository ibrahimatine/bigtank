'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { listingSchema } from '@/lib/validations';
import { POPULAR_BRANDS, CONDITION_LABELS } from '@/types';
import { SENEGAL_REGIONS } from '@bigtank/shared-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ListingCondition } from '@bigtank/shared-types';
import type { ListingDetail } from '@/lib/api';

interface ListingFormProps {
  mode: 'create' | 'edit';
  initialData?: ListingDetail;
}

export function ListingForm({ mode, initialData }: ListingFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    sizeEu: initialData?.sizeEu?.toString() || '',
    sizeUs: initialData?.sizeUs?.toString() || '',
    sizeUk: initialData?.sizeUk?.toString() || '',
    condition: initialData?.condition || '',
    color: initialData?.color || '',
    priceXof: initialData?.priceXof?.toString() || '',
    locationCity: initialData?.locationCity || '',
    locationRegion: initialData?.locationRegion || '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const parsed = listingSchema.safeParse(form);
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
      const url =
        mode === 'create'
          ? '/api/listings'
          : `/api/listings/${initialData?.id}`;

      // Clean data — remove empty optional fields
      const body = { ...parsed.data };
      if (!body.sizeUs && body.sizeUs !== 0) delete (body as Record<string, unknown>).sizeUs;
      if (!body.sizeUk && body.sizeUk !== 0) delete (body as Record<string, unknown>).sizeUk;

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Erreur lors de la sauvegarde');
        return;
      }

      const listing = data.data || data;

      if (mode === 'create') {
        router.push(`/dashboard/${listing.id}/edit`);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Infos */}
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">Informations</legend>

        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Nike Air Max 90 - Taille 47"
          />
          {fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Decrivez votre article..."
            rows={4}
          />
          {fieldErrors.description && <p className="text-xs text-red-500">{fieldErrors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Marque *</Label>
            <Select value={form.brand} onValueChange={(v) => updateField('brand', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.brand && <p className="text-xs text-red-500">{fieldErrors.brand}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modele *</Label>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => updateField('model', e.target.value)}
              placeholder="Air Max 90"
            />
            {fieldErrors.model && <p className="text-xs text-red-500">{fieldErrors.model}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Couleur *</Label>
          <Input
            id="color"
            value={form.color}
            onChange={(e) => updateField('color', e.target.value)}
            placeholder="Noir/Blanc"
          />
          {fieldErrors.color && <p className="text-xs text-red-500">{fieldErrors.color}</p>}
        </div>
      </fieldset>

      {/* Taille */}
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">Taille</legend>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sizeEu">EU *</Label>
            <Input
              id="sizeEu"
              type="number"
              value={form.sizeEu}
              onChange={(e) => updateField('sizeEu', e.target.value)}
              min={38}
              max={55}
            />
            {fieldErrors.sizeEu && <p className="text-xs text-red-500">{fieldErrors.sizeEu}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sizeUs">US</Label>
            <Input
              id="sizeUs"
              type="number"
              value={form.sizeUs}
              onChange={(e) => updateField('sizeUs', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sizeUk">UK</Label>
            <Input
              id="sizeUk"
              type="number"
              value={form.sizeUk}
              onChange={(e) => updateField('sizeUk', e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Etat et prix */}
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">Etat et prix</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Etat *</Label>
            <Select value={form.condition} onValueChange={(v) => updateField('condition', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CONDITION_LABELS) as [ListingCondition, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            {fieldErrors.condition && <p className="text-xs text-red-500">{fieldErrors.condition}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceXof">Prix (FCFA) *</Label>
            <Input
              id="priceXof"
              type="number"
              value={form.priceXof}
              onChange={(e) => updateField('priceXof', e.target.value)}
              min={1000}
              max={500000}
            />
            {fieldErrors.priceXof && <p className="text-xs text-red-500">{fieldErrors.priceXof}</p>}
          </div>
        </div>
      </fieldset>

      {/* Localisation */}
      <fieldset className="space-y-4">
        <legend className="font-semibold text-lg">Localisation</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Region *</Label>
            <Select value={form.locationRegion} onValueChange={(v) => updateField('locationRegion', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {SENEGAL_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.locationRegion && <p className="text-xs text-red-500">{fieldErrors.locationRegion}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationCity">Ville *</Label>
            <Input
              id="locationCity"
              value={form.locationCity}
              onChange={(e) => updateField('locationCity', e.target.value)}
              placeholder="Dakar"
            />
            {fieldErrors.locationCity && <p className="text-xs text-red-500">{fieldErrors.locationCity}</p>}
          </div>
        </div>
      </fieldset>

      <Button type="submit" className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90" disabled={loading}>
        {loading
          ? 'Sauvegarde...'
          : mode === 'create'
            ? 'Publier l\'annonce'
            : 'Enregistrer les modifications'}
      </Button>
    </form>
  );
}
