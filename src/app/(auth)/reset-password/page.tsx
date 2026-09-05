'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, CheckCircle2, Loader2, LockKeyhole, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const schema = z.object({
  password: z.string().min(8, 'Use pelo menos 8 caracteres').regex(/[A-Z]/, 'Inclua uma letra maiúscula').regex(/[a-z]/, 'Inclua uma letra minúscula').regex(/[0-9]/, 'Inclua um número').regex(/[^A-Za-z0-9]/, 'Inclua um caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, { message: 'As senhas não são iguais', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;
const fieldClassName = 'h-12 rounded-xl border-[#1b1919]/10 bg-white px-4 shadow-none placeholder:text-[#8a817d]/70 focus-visible:border-[#963a4a]/50 focus-visible:ring-[#963a4a]/15';

function ResetPasswordContent() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const password = watch('password', '');
  const checks = [
    { label: '8+ caracteres', valid: password.length >= 8 },
    { label: 'Maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Minúscula', valid: /[a-z]/.test(password) },
    { label: 'Número', valid: /[0-9]/.test(password) },
    { label: 'Símbolo', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter((check) => check.valid).length;
  const strengthLabel = strength <= 2 ? 'Fraca' : strength <= 4 ? 'Boa' : 'Forte';

  useEffect(() => {
    if (!isSuccess) return;
    const timer = window.setTimeout(() => router.push('/login'), 3000);
    return () => window.clearTimeout(timer);
  }, [isSuccess, router]);

  const onSubmit = async ({ password: nextPassword }: FormData) => {
    if (!token) return;
    setIsLoading(true);
    setSubmitError(null);
    try {
      await authApi.resetPassword(token, nextPassword);
      setIsSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível redefinir sua senha';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return <StateMessage icon={XCircle} tone="error" eyebrow="Link inválido" title="Este link não funciona mais." description="Ele pode ter expirado ou já ter sido utilizado. Solicite um novo link para continuar."><Button asChild className="h-12 w-full rounded-full bg-[#963a4a] font-bold text-white hover:bg-[#722f37]"><Link href="/forgot-password">Solicitar novo link</Link></Button><Button asChild variant="ghost" className="h-11 w-full rounded-full font-bold text-[#963a4a]"><Link href="/login">Voltar para o login</Link></Button></StateMessage>;
  }

  if (isSuccess) {
    return <StateMessage icon={CheckCircle2} tone="success" eyebrow="Tudo certo" title="Sua senha foi redefinida." description="Agora você já pode entrar novamente. Estamos levando você para o login."><Button asChild className="h-12 w-full rounded-full bg-[#963a4a] font-bold text-white hover:bg-[#722f37]"><Link href="/login">Ir para o login <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></StateMessage>;
  }

  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#963a4a]/10 text-[#963a4a]"><LockKeyhole className="h-6 w-6" /></span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Novo começo</p>
      <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#1b1919] sm:text-5xl">Crie uma nova senha.</h1>
      <p className="mt-4 text-base leading-7 text-[#6c6562]">Escolha uma senha forte e diferente das anteriores.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-[#373130]">Nova senha</Label>
          <Input id="password" type="password" autoComplete="new-password" placeholder="Crie uma senha forte" {...register('password')} disabled={isLoading} className={fieldClassName} />
          <PasswordStrength checks={checks} strength={strength} label={strengthLabel} hasPassword={Boolean(password)} />
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2"><Label htmlFor="confirmPassword" className="text-sm font-bold text-[#373130]">Confirmar nova senha</Label><Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repita sua nova senha" {...register('confirmPassword')} disabled={isLoading} className={fieldClassName} />{errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>}</div>
        {submitError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{submitError}</p>}
        <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-[#963a4a] font-bold text-white shadow-[0_8px_24px_rgba(114,47,55,0.18)] hover:bg-[#722f37]">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Redefinir senha{!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}</Button>
      </form>
    </div>
  );
}

function PasswordStrength({ checks, strength, label, hasPassword }: { checks: { label: string; valid: boolean }[]; strength: number; label: string; hasPassword: boolean }) {
  return <div className="space-y-2 rounded-xl border border-[#1b1919]/8 bg-white/45 p-3"><div className="flex items-center justify-between text-[11px] font-bold"><span className="text-[#7a726e]">Força da senha</span><span className={strength === 5 ? 'text-emerald-700' : strength >= 3 ? 'text-[#b56534]' : 'text-[#963a4a]'}>{hasPassword ? label : '—'}</span></div><div className="grid grid-cols-5 gap-1" aria-label={`Força da senha: ${hasPassword ? label : 'não informada'}`}>{[1, 2, 3, 4, 5].map((level) => <span key={level} className={cn('h-1.5 rounded-full transition-colors', strength >= level ? strength === 5 ? 'bg-emerald-600' : strength >= 3 ? 'bg-[#f0a36b]' : 'bg-[#963a4a]' : 'bg-[#1b1919]/10')} />)}</div><div className="flex flex-wrap gap-x-3 gap-y-1.5">{checks.map((check) => <span key={check.label} className={cn('flex items-center gap-1 text-[10px] font-semibold', check.valid ? 'text-emerald-700' : 'text-[#8a817d]')}><span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full', check.valid ? 'bg-emerald-100' : 'border border-[#1b1919]/15')}>{check.valid && <Check className="h-2.5 w-2.5" />}</span>{check.label}</span>)}</div></div>;
}

function StateMessage({ icon: Icon, tone, eyebrow, title, description, children }: { icon: typeof XCircle; tone: 'error' | 'success'; eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div><span className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', tone === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}><Icon className="h-6 w-6" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">{eyebrow}</p><h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#1b1919] sm:text-5xl">{title}</h1><p className="mt-4 text-base leading-7 text-[#6c6562]">{description}</p><div className="mt-8 space-y-3">{children}</div></div>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#963a4a]" /></div>}><ResetPasswordContent /></Suspense>;
}
