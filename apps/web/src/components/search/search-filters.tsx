'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { POPULAR_BRANDS, SORT_OPTIONS, CONDITION_LABELS } from '@/types';
import type { ListingCondition } from '@bigtank/shared-types';

// Combobox libre : suggestions populaires + saisie libre acceptee
function BrandCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync avec URL (ex: apres reset)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = inputValue
    ? POPULAR_BRANDS.filter((b) =>
        b.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : [...POPULAR_BRANDS];

  const handleSelect = (brand: string) => {
    setInputValue(brand);
    onChange(brand);
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setOpen(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      onChange(inputValue.trim());
    }, 150);
  };

  const isCustomValue =
    inputValue.trim() &&
    !POPULAR_BRANDS.some((b) => b.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder="Toutes les marques"
          className="pr-8 bg-white"
        />
        {inputValue && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Effacer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (filtered.length > 0 || isCustomValue) && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {filtered.map((brand) => (
            <button
              key={brand}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(brand); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-muted)] transition-colors"
            >
              {brand}
            </button>
          ))}
          {isCustomValue && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(inputValue.trim()); }}
              className="w-full text-left px-3 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-muted)] transition-colors border-t border-[var(--color-border)]"
            >
              Rechercher &ldquo;{inputValue.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterForm({ onApply }: { onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) || '';

  // Inputs controles pour que le reset vide aussi les champs
  const [sizeEuMin, setSizeEuMin] = useState(get('sizeEuMin'));
  const [sizeEuMax, setSizeEuMax] = useState(get('sizeEuMax'));
  const [priceMin, setPriceMin] = useState(get('priceMin'));
  const [priceMax, setPriceMax] = useState(get('priceMax'));

  // Synchronise les inputs locaux avec les params URL (apres reset ou navigation)
  useEffect(() => {
    setSizeEuMin(get('sizeEuMin'));
    setSizeEuMax(get('sizeEuMax'));
    setPriceMin(get('priceMin'));
    setPriceMax(get('priceMax'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.push(`/search?${params.toString()}`);
      onApply?.();
    },
    [router, searchParams, onApply],
  );

  const handleSelect = (key: string, value: string) => {
    updateParams({ [key]: value === '__all__' ? '' : value });
  };

  const handleReset = () => {
    const q = searchParams.get('query') || '';
    router.push(q ? `/search?query=${encodeURIComponent(q)}` : '/search');
    onApply?.();
  };

  // Applique un filtre numerique sur blur ou Enter
  function numericInputProps(
    value: string,
    setValue: (v: string) => void,
    paramKey: string,
    min?: number,
    max?: number,
  ) {
    return {
      type: 'number' as const,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => updateParams({ [paramKey]: e.target.value }),
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      },
      min,
      max,
      className: 'bg-white',
    };
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Marque</label>
        <BrandCombobox
          value={get('brand')}
          onChange={(v) => updateParams({ brand: v })}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Taille EU</label>
        <div className="flex gap-2">
          <Input
            placeholder="Min (46)"
            {...numericInputProps(sizeEuMin, setSizeEuMin, 'sizeEuMin', 38, 60)}
          />
          <Input
            placeholder="Max (52)"
            {...numericInputProps(sizeEuMax, setSizeEuMax, 'sizeEuMax', 38, 60)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Prix (FCFA)</label>
        <div className="flex gap-2">
          <Input
            placeholder="Min"
            {...numericInputProps(priceMin, setPriceMin, 'priceMin', 0)}
          />
          <Input
            placeholder="Max"
            {...numericInputProps(priceMax, setPriceMax, 'priceMax', 0)}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Etat</label>
        <Select
          value={get('condition') || '__all__'}
          onValueChange={(v) => handleSelect('condition', v)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Tous les etats" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[var(--color-border)] shadow-lg">
            <SelectItem value="__all__">Tous les etats</SelectItem>
            {(Object.entries(CONDITION_LABELS) as [ListingCondition, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Trier par</label>
        <Select
          value={get('sortBy') || 'date'}
          onValueChange={(v) => handleSelect('sortBy', v)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[var(--color-border)] shadow-lg">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Button variant="outline" className="w-full" onClick={handleReset}>
        Reinitialiser
      </Button>
    </div>
  );
}

export function SearchFilters() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <h3 className="font-semibold mb-5">Filtres</h3>
        <FilterForm />
      </aside>

      {/* Mobile sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-white">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-white w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="mt-6 px-1">
              <FilterForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
