'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

const MAX_DIMENSION = 1200;

function compressImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

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
    img.onerror = () => reject(new Error('Image invalide'));
    img.src = URL.createObjectURL(file);
  });
}

interface ImageUploadProps {
  listingId: string;
  existingImages: { id: string; url: string; key: string; order: number }[];
  onImagesChange: () => void;
}

export function ImageUpload({ listingId, existingImages, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Format accepte : JPEG, PNG, WebP');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Taille max : 5 Mo par image');
        continue;
      }

      try {
        // 0. Compress & resize image
        const { blob, width, height } = await compressImage(file);

        // 1. Get presigned URL via route handler
        const presignRes = await fetch(`/api/listings/${listingId}/images/presign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: 'image/jpeg',
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          setError(data.error || data.message || 'Erreur upload');
          continue;
        }

        const presignData = await presignRes.json();
        const { uploadUrl, key } = presignData.data || presignData;

        // 2. Upload compressed image to S3
        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: blob,
        });

        // 3. Confirm upload with real dimensions
        await fetch(`/api/listings/${listingId}/images/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            order: existingImages.length + i,
            width,
            height,
          }),
        });
      } catch {
        setError('Erreur lors de l\'upload');
      }
    }

    setUploading(false);
    onImagesChange();

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleDelete(imageId: string) {
    try {
      await fetch(`/api/listings/${listingId}/images/${imageId}`, {
        method: 'DELETE',
      });
      onImagesChange();
    } catch {
      setError('Erreur suppression');
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Photos</h3>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Existing images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {existingImages.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-muted)]">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {existingImages.length < 5 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-[var(--color-muted-foreground)]" />
          )}
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
            {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter des photos'}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            JPEG, PNG, WebP — Max 5 photos, 5 Mo/photo
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}
