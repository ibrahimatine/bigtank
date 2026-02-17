'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
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

function FilterForm({ onApply }: { onApply?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) || '';

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

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Marque</label>
        <Select
          value={get('brand') || '__all__'}
          onValueChange={(v) => handleSelect('brand', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les marques" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les marques</SelectItem>
            {POPULAR_BRANDS.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Taille EU</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={get('sizeEuMin')}
            onBlur={(e) => updateParams({ sizeEuMin: e.target.value })}
            min={36}
            max={60}
          />
          <Input
            type="number"
            placeholder="Max"
            defaultValue={get('sizeEuMax')}
            onBlur={(e) => updateParams({ sizeEuMax: e.target.value })}
            min={36}
            max={60}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Prix (FCFA)</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={get('priceMin')}
            onBlur={(e) => updateParams({ priceMin: e.target.value })}
            min={0}
          />
          <Input
            type="number"
            placeholder="Max"
            defaultValue={get('priceMax')}
            onBlur={(e) => updateParams({ priceMax: e.target.value })}
            min={0}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Etat</label>
        <Select
          value={get('condition') || '__all__'}
          onValueChange={(v) => handleSelect('condition', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tous les etats" />
          </SelectTrigger>
          <SelectContent>
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
        <label className="text-sm font-medium mb-1 block">Trier par</label>
        <Select
          value={get('sortBy') || 'date'}
          onValueChange={(v) => handleSelect('sortBy', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        Reinitialiser les filtres
      </Button>
    </div>
  );
}

export function SearchFilters() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <h3 className="font-semibold mb-4">Filtres</h3>
        <FilterForm />
      </aside>

      {/* Mobile sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
