import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;

  const res = await fetch(`${GATEWAY}/chat/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
