import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const res = await fetch(`${GATEWAY}/admin/users/${id}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 502 });
  }
}
