import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({
      sub: user.id as string,
      name: user.name as string,
      email: user.email as string,
      plan: (user.plan as string) || 'free',
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'free' },
      token,
    });
  } catch (err) {
    console.error('[signin]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
