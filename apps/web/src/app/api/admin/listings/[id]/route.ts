import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const body = await req.json();
    const res = await fetch(`${GATEWAY}/admin/listings/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 502 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const res = await fetch(`${GATEWAY}/admin/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 502 });
  }
}
