import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';

// Expose le token JWT au client pour l'auth Socket.io
// Sécurisé car accessible uniquement depuis la même origine (Next.js SSR)
export async function GET() {
  const token = await getAccessToken();

  if (!token) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
