'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';

const schema = z.object({ email: z.string().email('Digite um e-mail válido') });
type FormData = z.infer<typeof schema>;
const fieldClassName = 'h-12 rounded-xl border-[#1b1919]/10 bg-white px-4 shadow-none placeholder:text-[#8a817d]/70 focus-visible:border-[#963a4a]/50 focus-visible:ring-[#963a4a]/15';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmittedEmail(email);
      toast.success('Enviamos as instruções para o seu e-mail');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o link');
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedEmail) {
    return <div><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Check className="h-6 w-6" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Link enviado</p><h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#1b1919] sm:text-5xl">Confira seu e-mail.</h1><p className="mt-4 text-base leading-7 text-[#6c6562]">Se existir uma conta para <strong className="break-all text-[#373130]">{submittedEmail}</strong>, você receberá um link válido por 15 minutos.</p><div className="mt-8 space-y-3"><Button variant="outline" onClick={() => setSubmittedEmail(null)} className="h-12 w-full rounded-full border-[#1b1919]/15 bg-white font-bold">Usar outro e-mail</Button><Button asChild variant="ghost" className="h-11 w-full rounded-full font-bold text-[#963a4a]"><Link href="/login"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para o login</Link></Button></div></div>;
  }

  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#963a4a]/10 text-[#963a4a]"><Mail className="h-6 w-6" /></span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Recupere seu acesso</p>
      <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#1b1919] sm:text-5xl">Esqueceu a senha?</h1>
      <p className="mt-4 text-base leading-7 text-[#6c6562]">Digite o e-mail da sua conta. A gente envia um link seguro para você criar uma nova senha.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2"><Label htmlFor="email" className="text-sm font-bold text-[#373130]">E-mail</Label><Input id="email" type="email" autoComplete="email" placeholder="voce@email.com" {...register('email')} disabled={isLoading} className={fieldClassName} />{errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}</div>
        <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-[#963a4a] font-bold text-white shadow-[0_8px_24px_rgba(114,47,55,0.18)] hover:bg-[#722f37]">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enviar link{!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-[#6c6562]">Lembrou sua senha? <Link href="/login" className="font-bold text-[#963a4a] hover:underline">Entrar</Link></p>
    </div>
  );
}
