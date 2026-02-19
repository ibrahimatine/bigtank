'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MoreVertical, Pencil, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ListingActionsProps {
  listingId: string;
  status: string;
}

export function ListingActions({ listingId, status }: ListingActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const label = newStatus === 'SOLD' ? 'Marquee comme vendue' : 'Remise en vente';
        toast.success(label);
        router.refresh();
      } else {
        toast.error('Impossible de modifier le statut');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteOpen(false);
        toast.success('Annonce supprimee');
        router.refresh();
      } else {
        toast.error("Impossible de supprimer l'annonce");
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded hover:bg-[var(--color-muted)] transition-colors" disabled={loading}>
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/${listingId}/edit`} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </DropdownMenuItem>
          {status === 'ACTIVE' && (
            <DropdownMenuItem onClick={() => handleStatusChange('SOLD')} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Marquer vendu
            </DropdownMenuItem>
          )}
          {(status === 'SOLD' || status === 'RESERVED') && (
            <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')} className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Remettre en vente
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 text-red-500">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette annonce ?</DialogTitle>
            <DialogDescription>
              Cette action est irreversible. L&apos;annonce sera definitivement supprimee.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
