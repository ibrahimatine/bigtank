'use client';

import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

const MAX_FILES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
}

export function ImagePicker({ files, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => ACCEPTED_TYPES.includes(f.type));
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    onChange(combined);
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="relative group w-24 h-24">
            <img
              src={URL.createObjectURL(file)}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover rounded-lg border border-[var(--color-border)]"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {files.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-1 text-[var(--color-muted-foreground)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Ajouter</span>
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        {files.length}/{MAX_FILES} photos — JPEG, PNG ou WebP
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
  );
}
