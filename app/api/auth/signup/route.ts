import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { genId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json() as {
      name: string; email: string; password: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = genId();
    const user = await createUser(id, name.trim(), email.toLowerCase().trim(), passwordHash);

    const token = await signToken({ sub: user.id as string, name: user.name as string, email: user.email as string, plan: (user.plan as string) || 'free' });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'free' },
      token,
    }, { status: 201 });
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
