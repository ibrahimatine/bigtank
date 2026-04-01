'use client';

import { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, Camera, AlertCircle } from 'lucide-react';

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function ImagePicker({ files, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const addFiles = useCallback(
    (selected: File[]) => {
      setError('');

      // Filtrer les formats invalides
      const validType = selected.filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (validType.length < selected.length) {
        setError('Certains fichiers ont ete ignores (formats acceptes : JPEG, PNG, WebP)');
      }

      // Filtrer les fichiers trop gros
      const validSize = validType.filter((f) => f.size <= MAX_SIZE);
      if (validSize.length < validType.length) {
        setError('Certaines images depassent 5 Mo et ont ete ignorees');
      }

      // Detecter les doublons (meme nom + meme taille)
      const unique = validSize.filter(
        (f) => !files.some((existing) => existing.name === f.name && existing.size === f.size),
      );
      if (unique.length < validSize.length) {
        setError('Les images en double ont ete ignorees');
      }

      const combined = [...files, ...unique].slice(0, MAX_FILES);
      if (files.length + unique.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} photos. Certaines ont ete ignorees.`);
      }

      onChange(combined);
    },
    [files, onChange],
  );

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleRemove(index: number) {
    setError('');
    onChange(files.filter((_, i) => i !== index));
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }

  const remaining = MAX_FILES - files.length;

  return (
    <div className="space-y-3">
      {/* Message incitatif */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-accent)]">
        <Camera className="h-4 w-4 shrink-0" />
        <span>Les annonces avec photos se vendent beaucoup plus vite</span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-600 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {files.map((file, i) => (
            <div key={`${file.name}-${file.size}-${i}`} className="relative group aspect-square">
              <img
                src={URL.createObjectURL(file)}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover rounded-lg border border-[var(--color-border)]"
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-[var(--color-accent)] text-white px-1.5 py-0.5 rounded font-medium">
                  Principale
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
          }`}
        >
          <ImagePlus
            className={`h-8 w-8 mx-auto ${
              dragActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted-foreground)]'
            }`}
          />
          <p className="text-sm text-[var(--color-muted-foreground)] mt-2">
            {dragActive
              ? 'Deposez vos photos ici'
              : 'Glissez vos photos ici ou cliquez pour en ajouter'}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            JPEG, PNG, WebP — Max 5 Mo par photo
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            onChange={handleSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Compteur + indicateur qualite */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          <span className={files.length === 0 ? 'text-red-500 font-medium' : ''}>
            {files.length}/{MAX_FILES} photos
          </span>
          {files.length === 0 && ' — Minimum 1 photo requise'}
        </p>
        {files.length >= 1 && files.length < 3 && (
          <p className="text-xs text-amber-500">
            Ajoute {3 - files.length} photo{3 - files.length > 1 ? 's' : ''} de plus pour un meilleur resultat
          </p>
        )}
        {files.length >= 3 && (
          <p className="text-xs text-green-600">
            Excellent ! {files.length >= 5 ? 'Maximum atteint' : `${files.length} photos`}
          </p>
        )}
      </div>
    </div>
  );
}
