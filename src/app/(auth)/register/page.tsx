'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { OAuthButtons } from '@/components/auth/oauth-buttons';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(50, 'Use no máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore'),
  email: z.string().email('Digite um e-mail válido'),
  password: z
    .string()
    .min(8, 'Use pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Inclua pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Inclua pelo menos um caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não são iguais',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const fieldClassName = 'h-12 rounded-xl border-[#1b1919]/10 bg-white px-4 shadow-none placeholder:text-[#8a817d]/70 focus-visible:border-[#963a4a]/50 focus-visible:ring-[#963a4a]/15';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const password = watch('password', '');
  const passwordChecks = [
    { label: '8+ caracteres', valid: password.length >= 8 },
    { label: 'Maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Minúscula', valid: /[a-z]/.test(password) },
    { label: 'Número', valid: /[0-9]/.test(password) },
    { label: 'Símbolo', valid: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordStrength = passwordChecks.filter((check) => check.valid).length;
  const strengthLabel = passwordStrength <= 2 ? 'Fraca' : passwordStrength <= 4 ? 'Boa' : 'Forte';

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data.username, data.email, data.password);
      toast.success('Conta criada com sucesso!');
      router.push('/feed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar sua conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#963a4a]">Entre para a comunidade</p>
        <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em] text-[#1b1919] sm:text-5xl">Crie seu perfil.</h1>
        <p className="mt-4 text-base leading-7 text-[#6c6562]">Comece a registrar o que você ouve e encontre sua próxima obsessão musical.</p>
      </div>

      <div className="mt-7">
        <OAuthButtons disabled={isLoading} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-bold text-[#373130]">Nome de usuário</Label>
          <Input id="username" placeholder="seu_nome" autoComplete="username" {...register('username')} disabled={isLoading} className={fieldClassName} />
          {errors.username && <p className="text-xs font-medium text-destructive">{errors.username.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-[#373130]">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@email.com" autoComplete="email" {...register('email')} disabled={isLoading} className={fieldClassName} />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-[#373130]">Senha</Label>
          <Input id="password" type="password" placeholder="Crie uma senha forte" autoComplete="new-password" {...register('password')} disabled={isLoading} className={fieldClassName} />
          <div className="space-y-2 rounded-xl border border-[#1b1919]/8 bg-white/45 p-3">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#7a726e]">Força da senha</span>
              <span className={passwordStrength === 5 ? 'text-emerald-700' : passwordStrength >= 3 ? 'text-[#b56534]' : 'text-[#963a4a]'}>{password ? strengthLabel : '—'}</span>
            </div>
            <div className="grid grid-cols-5 gap-1" aria-label={`Força da senha: ${password ? strengthLabel : 'não informada'}`}>
              {[1, 2, 3, 4, 5].map((level) => (
                <span key={level} className={`h-1.5 rounded-full transition-colors ${passwordStrength >= level ? passwordStrength === 5 ? 'bg-emerald-600' : passwordStrength >= 3 ? 'bg-[#f0a36b]' : 'bg-[#963a4a]' : 'bg-[#1b1919]/10'}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {passwordChecks.map((check) => (
                <span key={check.label} className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${check.valid ? 'text-emerald-700' : 'text-[#8a817d]'}`}>
                  <span className={`flex size-3.5 items-center justify-center rounded-full ${check.valid ? 'bg-emerald-100' : 'border border-[#1b1919]/15'}`}>
                    {check.valid ? <Check className="size-2.5" /> : null}
                  </span>
                  {check.label}
                </span>
              ))}
            </div>
          </div>
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-bold text-[#373130]">Confirmar senha</Label>
          <Input id="confirmPassword" type="password" placeholder="Repita sua senha" autoComplete="new-password" {...register('confirmPassword')} disabled={isLoading} className={fieldClassName} />
          {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-[#963a4a] font-bold text-white shadow-[0_8px_24px_rgba(114,47,55,0.18)] hover:bg-[#722f37]">
          {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Criar minha conta
          {!isLoading ? <ArrowRight className="ml-2 size-4" /> : null}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs leading-5 text-[#7a726e]">
        Ao criar sua conta, você concorda com nossa <Link href="/privacy" className="font-semibold text-[#963a4a] hover:underline">Política de Privacidade</Link>.
      </p>
      <p className="mt-5 text-center text-sm text-[#6c6562]">
        Já tem uma conta? <Link href="/login" className="font-bold text-[#963a4a] hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
