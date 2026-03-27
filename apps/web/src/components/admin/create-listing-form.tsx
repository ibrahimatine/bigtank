'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Loader2, CheckCircle } from 'lucide-react';
import { ImagePicker } from '@/components/dashboard/image-picker';

const REGIONS = [
  'Dakar', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack', 'Kédougou', 'Kolda',
  'Louga', 'Matam', 'Saint-Louis', 'Sédhiou', 'Tambacounda', 'Thiès', 'Ziguinchor',
];

const CONDITIONS = [
  { value: 'NEW', label: 'Neuf' },
  { value: 'LIKE_NEW', label: 'Comme neuf' },
  { value: 'GOOD', label: 'Bon etat' },
  { value: 'FAIR', label: 'Etat correct' },
];

interface SellerResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

export function CreateListingForSellerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [sellers, setSellers] = useState<SellerResult[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');

  async function searchSellers() {
    if (searchQuery.trim().length < 2) {
      toast.error('Tapez au moins 2 caracteres');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery.trim())}&limit=10&role=SELLER`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSellers(data.users || []);
      if ((data.users || []).length === 0) {
        toast.info('Aucun vendeur trouve');
      }
    } catch {
      toast.error('Erreur de recherche');
    } finally {
      setSearching(false);
    }
  }

  async function uploadPhotos(listingId: string) {
    for (let i = 0; i < selectedFiles.length; i++) {
      setUploadProgress(`Upload photo ${i + 1}/${selectedFiles.length}...`);
      const { blob, width, height } = await compressImage(selectedFiles[i]);

      // 1. Get presigned URL
      const presignRes = await fetch(`/api/listings/${listingId}/images/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `photo-${i}.jpg`, contentType: 'image/jpeg' }),
      });
      if (!presignRes.ok) throw new Error(`Erreur presign photo ${i + 1}`);
      const presignData = await presignRes.json();
      const { uploadUrl, key } = presignData.data || presignData;

      // 2. Upload directly to storage
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error(`Erreur envoi photo ${i + 1}`);

      // 3. Confirm upload
      const confirmRes = await fetch(`/api/listings/${listingId}/images/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, order: i, width, height }),
      });
      if (!confirmRes.ok) throw new Error(`Erreur confirmation photo ${i + 1}`);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSeller) {
      toast.error('Selectionnez un vendeur');
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);

    const body = {
      sellerId: selectedSeller.id,
      title: form.get('title') as string,
      description: form.get('description') as string,
      brand: form.get('brand') as string,
      model: (form.get('model') as string) || undefined,
      sizeEu: Number(form.get('sizeEu')),
      sizeUs: form.get('sizeUs') ? Number(form.get('sizeUs')) : undefined,
      condition: form.get('condition') as string,
      color: form.get('color') as string,
      priceXof: Number(form.get('priceXof')),
      locationCity: (form.get('locationCity') as string) || undefined,
      locationRegion: form.get('locationRegion') as string,
    };

    try {
      const res = await fetch('/api/admin/listings/create-for-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erreur');
      }

      const listingId = data.listing?.id;

      // Upload photos if any
      if (selectedFiles.length > 0 && listingId) {
        try {
          await uploadPhotos(listingId);
        } catch (uploadErr: any) {
          toast.error(uploadErr?.message || 'Certaines photos n\'ont pas pu etre uploadees');
        }
      }

      setUploadProgress('');
      toast.success(`Annonce creee pour ${selectedSeller.name}`);
      router.push('/admin/listings');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la creation');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30';

  return (
    <div className="max-w-2xl">
      {/* Recherche vendeur */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">1. Choisir le vendeur</h2>

        {selectedSeller ? (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">{selectedSeller.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {selectedSeller.email || selectedSeller.phone}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSeller(null)}
              className="text-xs text-red-600 hover:underline"
            >
              Changer
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchSellers())}
                placeholder="Rechercher par nom, email ou telephone..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={searchSellers}
                disabled={searching}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>

            {sellers.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sellers.map((seller) => (
                  <button
                    key={seller.id}
                    type="button"
                    onClick={() => { setSelectedSeller(seller); setSellers([]); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors text-sm"
                  >
                    <span className="font-medium">{seller.name}</span>
                    <span className="text-[var(--color-muted-foreground)] ml-2">
                      {seller.email || seller.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Formulaire annonce */}
      <form onSubmit={handleSubmit} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold mb-1">2. Details de l&apos;annonce</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Titre *</label>
          <input name="title" required minLength={3} maxLength={120} placeholder="Ex: Nike Air Max 90 noires" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description *</label>
          <textarea name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Decrivez la chaussure..." className={`${inputClass} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Marque *</label>
            <input name="brand" required minLength={1} maxLength={50} placeholder="Nike, Adidas, Jordan..." className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Modele</label>
            <input name="model" maxLength={100} placeholder="Air Max 90, Yeezy..." className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Taille EU *</label>
            <input name="sizeEu" type="number" required min={20} max={55} step={0.5} placeholder="42" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Taille US</label>
            <input name="sizeUs" type="number" min={0} max={20} step={0.5} placeholder="9" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Couleur *</label>
            <input name="color" required minLength={1} maxLength={30} placeholder="Noir, Blanc..." className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Etat *</label>
            <select name="condition" required className={inputClass}>
              <option value="">Choisir...</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Prix (FCFA) *</label>
            <input name="priceXof" type="number" required min={500} max={500000} step={100} placeholder="15000" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Region *</label>
            <select name="locationRegion" required className={inputClass}>
              <option value="">Choisir...</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ville</label>
            <input name="locationCity" maxLength={100} placeholder="Dakar, Thies..." className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Photos</label>
          <ImagePicker files={selectedFiles} onChange={setSelectedFiles} />
        </div>

        {uploadProgress && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
            {uploadProgress}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedSeller}
          className="w-full py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadProgress || 'Publication en cours...'}
            </>
          ) : (
            'Publier l\'annonce'
          )}
        </button>
      </form>
    </div>
  );
}

const MAX_DIMENSION = 1200;

function compressImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: width, naturalHeight: height } = img;
      URL.revokeObjectURL(img.src);

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression echouee'));
          resolve({ blob, width, height });
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image invalide'));
    };
    img.src = URL.createObjectURL(file);
  });
}
