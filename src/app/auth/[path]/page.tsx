import { AuthView } from '@neondatabase/auth/react';

export const dynamicParams = false;

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="flex items-center justify-center min-h-screen">
      <AuthView path={path} redirectTo="/dashboard" />
    </main>
  );
}