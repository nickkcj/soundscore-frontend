'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

const loginSchema = z.object({
  username: z.string().min(1, 'Digite seu nome de usuário'),
  password: z.string().min(1, 'Digite sua senha'),
});

type LoginForm = z.infer<typeof loginSchema>;

const fieldClassName = 'h-12 rounded-xl border-[#1b1919]/10 bg-white px-4 shadow-none placeholder:text-[#8a817d]/70 focus-visible:border-[#963a4a]/50 focus-visible:ring-[#963a4a]/15';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Que bom ter você de volta!');
      router.push('/feed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível entrar');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Bem-vindo de volta</p>
        <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#1b1919] sm:text-5xl">Entre na sua conta.</h1>
        <p className="mt-4 text-base leading-7 text-[#6c6562]">Suas reviews, rankings e próximas descobertas continuam aqui.</p>
      </div>

      <div className="mt-8">
        <OAuthButtons disabled={isLoading} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-bold text-[#373130]">Nome de usuário</Label>
          <Input id="username" placeholder="seu_nome" autoComplete="username" {...register('username')} disabled={isLoading} className={fieldClassName} />
          {errors.username && <p className="text-xs font-medium text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm font-bold text-[#373130]">Senha</Label>
            <Link href="/forgot-password" className="text-xs font-bold text-[#963a4a] hover:underline">Esqueci minha senha</Link>
          </div>
          <Input id="password" type="password" placeholder="Digite sua senha" autoComplete="current-password" {...register('password')} disabled={isLoading} className={fieldClassName} />
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-[#963a4a] font-bold text-white shadow-[0_8px_24px_rgba(114,47,55,0.18)] hover:bg-[#722f37]">
          {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Entrar
          {!isLoading ? <ArrowRight className="ml-2 size-4" /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6c6562]">
        Ainda não tem uma conta? <Link href="/register" className="font-bold text-[#963a4a] hover:underline">Criar conta</Link>
      </p>
    </div>
  );
}
