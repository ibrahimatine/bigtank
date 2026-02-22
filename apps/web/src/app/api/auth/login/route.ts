import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { setAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function normalizePhone(v: string): string {
  const n = v.replace(/[\s\-\.]/g, '');
  if (n.startsWith('+221')) return n;
  if (n.startsWith('00221')) return '+' + n.slice(2);
  if (/^[0-9]{9}$/.test(n)) return '+221' + n;
  return v;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const emailOrPhone = parsed.data.emailOrPhone.includes('@')
      ? parsed.data.emailOrPhone
      : normalizePhone(parsed.data.emailOrPhone);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...parsed.data, emailOrPhone }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Identifiants incorrects' },
        { status: res.status },
      );
    }

    const { accessToken, refreshToken, user } = data.data || data;

    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
