'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { ChevronDown, X } from 'lucide-react';
import { ImageUpload } from '@/components/dashboard/image-upload';
import type { ListingCondition } from '@bigtank/shared-types';
import type { ListingDetail } from '@/lib/api';

type UploadedImage = { id: string; url: string; key: string; order: number };

function BrandCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = POPULAR_BRANDS.filter((b) =>
    b.toLowerCase().includes(input.toLowerCase()),
  );
  const showCustom =
    input.trim() !== '' &&
    !POPULAR_BRANDS.map((b) => b.toLowerCase()).includes(input.trim().toLowerCase());

  function select(v: string) {
    setInput(v);
    onChange(v);
    setOpen(false);
  }

  function handleInput(v: string) {
    setInput(v);
    onChange(v);
    setOpen(true);
  }

  function handleClear() {
    setInput('');
    onChange('');
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Nike, Adidas, autre..."
          className="pr-8"
        />
        {input ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        )}
      </div>
      {open && (filtered.length > 0 || showCustom) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[var(--color-border)] bg-white shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((b) => (
            <button
              key={b}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(b); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] transition-colors"
            >
              {b}
            </button>
          ))}
          {showCustom && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(input.trim()); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] transition-colors border-t border-[var(--color-border)]"
            >
              Utiliser &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const router = useRouter();

  // Conversions de taille (approximations standards hommes)
  function euFromUs(us: number): number { return Math.round(us + 33); }
  function euFromUk(uk: number): number { return Math.round(uk + 33); }
  function usFromEu(eu: number): number { return Math.round(eu - 33); }
  function ukFromEu(eu: number): number { return Math.round(eu - 33); }

  function updateField(key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      // Auto-fill equivalences quand EU change
      if (key === 'sizeEu' && value) {
        const eu = parseFloat(value);
        if (!isNaN(eu) && eu >= 38 && eu <= 60) {
          if (!prev.sizeUs) next.sizeUs = String(usFromEu(eu));
          if (!prev.sizeUk) next.sizeUk = String(ukFromEu(eu));
        }
      }

      // Auto-fill EU quand US saisie
      if (key === 'sizeUs' && value) {
        const us = parseFloat(value);
        if (!isNaN(us) && us >= 5 && us <= 20) {
          next.sizeEu = String(euFromUs(us));
        }
      }

      // Auto-fill EU quand UK saisie
      if (key === 'sizeUk' && value) {
        const uk = parseFloat(value);
        if (!isNaN(uk) && uk >= 4 && uk <= 18) {
          next.sizeEu = String(euFromUk(uk));
        }
      }

      return next;
    });
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

      const body = { ...parsed.data };
      if (!body.sizeUs && body.sizeUs !== 0) delete (body as Record<string, unknown>).sizeUs;
      if (!body.sizeUk && body.sizeUk !== 0) delete (body as Record<string, unknown>).sizeUk;
      if (!body.locationCity) delete (body as Record<string, unknown>).locationCity;

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
        setCreatedListingId(listing.id);
        setUploadedImages([]);
      } else {
        toast.success('Annonce mise a jour');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function refreshImages() {
    if (!createdListingId) return;
    try {
      const res = await fetch(`/api/listings/my/${createdListingId}`);
      if (res.ok) {
        const data = await res.json();
        const listing = data.data || data;
        setUploadedImages(listing.images || []);
      }
    } catch {
      // silent — photos sont quand meme uploadees
    }
  }

  // Step 2 — upload photos apres creation
  if (createdListingId) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-green-700 text-sm font-medium">
            Annonce creee ! Ajoutez des photos pour la mettre en valeur (optionnel).
          </p>
        </div>

        <ImageUpload
          listingId={createdListingId}
          existingImages={uploadedImages}
          onImagesChange={refreshImages}
        />

        <Button
          type="button"
          onClick={() => {
            router.push(`/dashboard/pay/${createdListingId}`);
          }}
          className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
        >
          Continuer vers le paiement →
        </Button>
      </div>
    );
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
            <Label>Marque *</Label>
            <BrandCombobox value={form.brand} onChange={(v) => updateField('brand', v)} />
            {fieldErrors.brand && <p className="text-xs text-red-500">{fieldErrors.brand}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modele</Label>
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
              min={5}
              max={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sizeUk">UK</Label>
            <Input
              id="sizeUk"
              type="number"
              value={form.sizeUk}
              onChange={(e) => updateField('sizeUk', e.target.value)}
              min={4}
              max={18}
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
              <SelectContent className="bg-white shadow-lg border border-[var(--color-border)]">
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
              <SelectContent className="bg-white shadow-lg border border-[var(--color-border)]">
                {SENEGAL_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.locationRegion && <p className="text-xs text-red-500">{fieldErrors.locationRegion}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationCity">Ville</Label>
            <Input
              id="locationCity"
              value={form.locationCity}
              onChange={(e) => updateField('locationCity', e.target.value)}
              placeholder="Dakar (optionnel)"
            />
            {fieldErrors.locationCity && <p className="text-xs text-red-500">{fieldErrors.locationCity}</p>}
          </div>
        </div>
      </fieldset>

      <Button
        type="submit"
        className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90"
        disabled={loading}
      >
        {loading
          ? 'Sauvegarde...'
          : mode === 'create'
            ? 'Creer l\'annonce'
            : 'Enregistrer les modifications'}
      </Button>
    </form>
  );
}
