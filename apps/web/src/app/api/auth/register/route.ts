import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';
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
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { confirmPassword, ...registerData } = parsed.data;

    // Normalize phone to +221XXXXXXXXX before sending to backend
    if (registerData.phone) {
      registerData.phone = normalizePhone(registerData.phone);
    }

    // Remove empty optional fields
    const cleanData = Object.fromEntries(
      Object.entries(registerData).filter(([, v]) => v !== '' && v !== undefined),
    );

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Erreur inscription' },
        { status: res.status },
      );
    }

    // Auth service register returns { message, user } — login to get tokens
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: cleanData.email || cleanData.phone,
        password: parsed.data.password,
      }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      // Registration succeeded but auto-login failed — still return user
      const user = data.data?.user || data.user;
      return NextResponse.json({ user });
    }

    const { accessToken, refreshToken, user } = loginData.data || loginData;
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    );
  }
}
