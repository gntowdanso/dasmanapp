'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { comparePasswords } from '@/lib/auth';
import { signToken } from '@/lib/auth-edge';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { message: 'Invalid email or password format.' };
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'Invalid credentials.' };
    }

    const passwordsMatch = await comparePasswords(password, user.password_hash);

    if (!passwordsMatch) {
      return { message: 'Invalid credentials.' };
    }

    // Generate Token
    const token = await signToken({ sub: user.id, email: user.email, role: user.role });

    // Set Cookie
    (await cookies()).set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

  } catch (error) {
    console.error('Login error:', error);
    return { message: 'Something went wrong.' };
  }

  // Redirect outside try-catch to avoid nextjs redirect error catching
  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete('admin_token');
  redirect('/admin/login');
}
