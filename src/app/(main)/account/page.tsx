'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, ArrowRight, Camera, Check, CheckCircle2, Eye, ExternalLink, Link2, Loader2, Lock, ShieldCheck, Sparkles, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useRequireAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { GoogleIcon, SpotifyIcon } from '@/components/common/provider-icons';
import type { SpotifyConnectionStatus, User as UserType } from '@/types';

const profileSchema = z.object({
  username: z.string().min(3, 'Use pelo menos 3 caracteres').max(50, 'Use no máximo 50 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore'),
  bio: z.string().max(500, 'A bio pode ter no máximo 500 caracteres').optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Digite sua senha atual'),
  newPassword: z.string().min(8, 'Use pelo menos 8 caracteres').regex(/[A-Z]/, 'Inclua uma letra maiúscula').regex(/[a-z]/, 'Inclua uma letra minúscula').regex(/[0-9]/, 'Inclua um número').regex(/[^A-Za-z0-9]/, 'Inclua um caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, { message: 'As senhas não são iguais', path: ['confirmPassword'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type Section = 'profile' | 'password' | 'privacy' | 'connections' | 'danger';

const sections: { id: Section; label: string; icon: typeof User; danger?: boolean }[] = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'password', label: 'Segurança', icon: Lock },
  { id: 'privacy', label: 'Privacidade', icon: Eye },
  { id: 'connections', label: 'Conexões', icon: Link2 },
  { id: 'danger', label: 'Excluir conta', icon: AlertTriangle, danger: true },
];

const fieldClassName = 'h-12 rounded-xl border-[#ded6cc] bg-[#faf8f4] px-4 shadow-none focus-visible:border-wine-700/45 focus-visible:ring-wine-700/15 dark:border-border dark:bg-muted/35';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { setUser, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [libraryPublic, setLibraryPublic] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyConnectionStatus | null>(null);
  const [spotifyLoading, setSpotifyLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { username: '', bio: '' } });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const newPassword = passwordForm.watch('newPassword', '');
  const passwordChecks = [
    { label: '8+ caracteres', valid: newPassword.length >= 8 },
    { label: 'Maiúscula', valid: /[A-Z]/.test(newPassword) },
    { label: 'Minúscula', valid: /[a-z]/.test(newPassword) },
    { label: 'Número', valid: /[0-9]/.test(newPassword) },
    { label: 'Símbolo', valid: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const passwordStrength = passwordChecks.filter((check) => check.valid).length;
  const strengthLabel = passwordStrength <= 2 ? 'Fraca' : passwordStrength <= 4 ? 'Boa' : 'Forte';

  useEffect(() => {
    if (!user) return;
    profileForm.reset({ username: user.username, bio: user.bio || '' });
    setLibraryPublic(user.library_public);
  }, [profileForm, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSpotifyLoading(true);
    api.get<SpotifyConnectionStatus>(`/library/spotify-status/${user.username}`)
      .then((status) => { if (!cancelled) setSpotifyStatus(status); })
      .catch(() => { if (!cancelled) setSpotifyStatus({ connected: false, username: null }); })
      .finally(() => { if (!cancelled) setSpotifyLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Use uma imagem JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem pode ter no máximo 5 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const previousPicture = user.profile_picture;
    setUser({ ...user, profile_picture: previewUrl });
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const updatedUser = await api.postForm<UserType>('/users/profile/picture', formData);
      URL.revokeObjectURL(previewUrl);
      setUser(updatedUser);
      toast.success('Foto atualizada.');
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      setUser({ ...user, profile_picture: previousPicture });
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a foto.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user) return;
    const previousUser = { ...user };
    setUser({ ...user, username: data.username, bio: data.bio ?? user.bio });
    setIsUpdating(true);
    try {
      const updatedUser = await api.patch<UserType>('/users/profile', { username: data.username, bio: data.bio });
      setUser(updatedUser);
      toast.success('Perfil atualizado.');
    } catch (error) {
      setUser(previousUser);
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', { current_password: data.currentPassword, new_password: data.newPassword });
      toast.success('Senha alterada com sucesso.');
      passwordForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    if (!user) return;
    const previousValue = libraryPublic;
    setLibraryPublic(checked);
    setIsUpdatingPrivacy(true);
    try {
      const updatedUser = await api.patch<UserType>('/users/profile', { library_public: checked });
      setUser(updatedUser);
      toast.success(checked ? 'Sua biblioteca agora é pública.' : 'Sua biblioteca agora é privada.');
    } catch (error) {
      setLibraryPublic(previousValue);
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a privacidade.');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== user.username) return;
    setIsDeleting(true);
    try {
      await api.delete('/users/account');
      logout();
      toast.success('Sua conta foi excluída.');
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir a conta.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmation('');
    }
  };

  if (authLoading || !user) return <AccountSkeleton />;

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-6xl px-4 pb-20 pt-7 md:px-8 md:pb-24 md:pt-11">
        <header className="mb-7 md:mb-10">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-wine-700 sm:text-[11px]"><Sparkles className="h-3.5 w-3.5 text-[#d98524]" />Seu espaço no SoundScore</p>
          <h1 className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">Configurações</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Cuide do seu perfil, da sua privacidade e de como sua conta se conecta à música.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-7">
          <aside className="min-w-0">
            <div className="overflow-hidden rounded-[1.5rem] border border-[#dcd4ca] bg-white shadow-[0_14px_45px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card lg:sticky lg:top-24">
              <div className="hidden border-b border-[#e8e0d7] p-5 dark:border-border lg:flex lg:items-center lg:gap-3">
                <Image src={user.profile_picture || '/images/default.jpg'} alt={user.username} width={52} height={52} className="h-13 w-13 rounded-full object-cover ring-2 ring-wine-700/15" />
                <div className="min-w-0"><p className="truncate font-black">{user.username}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
              </div>
              <nav aria-label="Seções das configurações" className="flex gap-1 overflow-x-auto p-2 lg:block">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;
                  return <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={cn('flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors lg:mb-1 lg:w-full lg:px-4', active ? section.danger ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-wine-700 text-white' : section.danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/25' : 'text-foreground/72 hover:bg-[#f7f3ed] dark:hover:bg-muted/40')}><Icon className="h-4 w-4 shrink-0" />{section.label}</button>;
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            {activeSection === 'profile' && (
              <SettingsCard icon={User} title="Seu perfil" description="As informações que ajudam outras pessoas a reconhecer você.">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="flex items-center gap-4 rounded-2xl bg-[#f8f5f0] p-4 dark:bg-muted/30 sm:gap-5 sm:p-5">
                    <div className="relative shrink-0">
                      <Image src={user.profile_picture || '/images/default.jpg'} alt={user.username} width={88} height={88} className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-sm dark:ring-card sm:h-22 sm:w-22" />
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handlePhotoUpload} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto} aria-label="Trocar foto de perfil" className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#f8f5f0] bg-wine-700 text-white transition-colors hover:bg-wine-800 disabled:opacity-60 dark:border-muted"><>{isUploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</></button>
                    </div>
                    <div className="min-w-0"><p className="font-black">Foto de perfil</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">JPG, PNG, WebP ou GIF de até 5 MB.</p><button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs font-bold text-wine-700 hover:underline">Escolher nova foto</button></div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Nome de usuário" error={profileForm.formState.errors.username?.message}><Input autoComplete="username" {...profileForm.register('username')} className={fieldClassName} /></Field>
                    <Field label="E-mail"><Input value={user.email} readOnly aria-readonly="true" className={cn(fieldClassName, 'cursor-not-allowed text-muted-foreground')} /><p className="mt-1.5 text-xs text-muted-foreground">O e-mail da conta não pode ser alterado por aqui.</p></Field>
                  </div>
                  <Field label="Bio" error={profileForm.formState.errors.bio?.message}><Textarea placeholder="Conte um pouco sobre você e seu gosto musical..." {...profileForm.register('bio')} rows={5} className="resize-none rounded-xl border-[#ded6cc] bg-[#faf8f4] p-4 shadow-none focus-visible:border-wine-700/45 focus-visible:ring-wine-700/15 dark:border-border dark:bg-muted/35" /><p className="mt-1.5 text-right text-xs text-muted-foreground">Até 500 caracteres</p></Field>
                  <div className="flex justify-end"><Button type="submit" disabled={isUpdating} className="h-12 w-full rounded-full bg-wine-700 px-6 font-bold text-white hover:bg-wine-800 sm:w-auto">{isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar alterações</Button></div>
                </form>
              </SettingsCard>
            )}

            {activeSection === 'password' && (
              <SettingsCard icon={ShieldCheck} title="Segurança" description="Use uma senha única e difícil de adivinhar.">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                  <Field label="Senha atual" error={passwordForm.formState.errors.currentPassword?.message}><Input type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} className={fieldClassName} /></Field>
                  <Field label="Nova senha" error={passwordForm.formState.errors.newPassword?.message}>
                    <Input type="password" autoComplete="new-password" placeholder="Crie uma senha forte" {...passwordForm.register('newPassword')} className={fieldClassName} />
                    <PasswordStrength checks={passwordChecks} strength={passwordStrength} label={strengthLabel} hasPassword={Boolean(newPassword)} />
                  </Field>
                  <Field label="Confirmar nova senha" error={passwordForm.formState.errors.confirmPassword?.message}><Input type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} className={fieldClassName} /></Field>
                  <div className="flex justify-end pt-1"><Button type="submit" disabled={isChangingPassword} className="h-12 w-full rounded-full bg-wine-700 px-6 font-bold text-white hover:bg-wine-800 sm:w-auto">{isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Alterar senha</Button></div>
                </form>
              </SettingsCard>
            )}

            {activeSection === 'privacy' && (
              <SettingsCard icon={Eye} title="Privacidade" description="Escolha quanto da sua atividade musical aparece no perfil.">
                <div className="rounded-2xl border border-[#e3dbd1] bg-[#faf8f4] p-5 dark:border-border dark:bg-muted/25 sm:p-6">
                  <div className="flex items-start justify-between gap-5"><div><Label htmlFor="library-public" className="text-base font-black">Biblioteca pública</Label><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Permite que visitantes vejam seus artistas, álbuns e faixas mais ouvidos. Suas credenciais do Spotify nunca são exibidas.</p></div><Switch id="library-public" checked={libraryPublic} onCheckedChange={handlePrivacyToggle} disabled={isUpdatingPrivacy} className="mt-0.5 shrink-0 data-[state=checked]:bg-wine-700" /></div>
                  <div className="mt-5 flex items-start gap-2.5 border-t border-[#e6ded4] pt-4 text-xs leading-relaxed text-muted-foreground dark:border-border"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-wine-700" /><p>{libraryPublic ? 'Seu perfil exibe um resumo da sua atividade. Você pode tornar a biblioteca privada a qualquer momento.' : 'Somente você pode acessar os dados completos da sua biblioteca.'}</p></div>
                </div>
                <Button asChild variant="outline" className="mt-5 h-11 rounded-full border-[#d5ccc1] px-5 font-bold dark:border-border"><Link href="/privacy">Ler a Política de Privacidade <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </SettingsCard>
            )}

            {activeSection === 'connections' && (
              <SettingsCard icon={Link2} title="Conexões" description="Integre seus hábitos de escuta à sua biblioteca.">
                <div className="overflow-hidden rounded-2xl border border-[#e3dbd1] dark:border-border">
                  <div className="flex flex-col gap-5 bg-[#faf8f4] p-5 dark:bg-muted/25 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1ed760] text-black"><SpotifyIcon className="h-7 w-7" /></span><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-black">Spotify</h3>{!spotifyLoading && spotifyStatus?.connected && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800"><CheckCircle2 className="h-3 w-3" />Conectado</span>}</div><p className="mt-1 text-sm text-muted-foreground">{spotifyLoading ? 'Verificando conexão…' : spotifyStatus?.connected ? `Conectado como ${spotifyStatus.username || user.username}` : 'Conecte para acompanhar seu histórico e descobrir seus favoritos.'}</p></div></div>
                    {spotifyLoading ? <Loader2 className="h-5 w-5 animate-spin text-wine-700" /> : spotifyStatus?.connected ? <Button asChild variant="outline" className="h-11 shrink-0 rounded-full border-[#d5ccc1] px-5 font-bold dark:border-border"><Link href="/library">Ver atividade <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <Button type="button" onClick={() => { window.location.href = `${API_BASE_URL}/oauth/spotify/login`; }} className="h-11 shrink-0 rounded-full bg-[#1ed760] px-5 font-black text-black hover:bg-[#1fca5c]">Conectar Spotify <ExternalLink className="ml-2 h-4 w-4" /></Button>}
                  </div>
                  <div className="flex flex-col gap-5 border-t border-[#e3dbd1] bg-white p-5 dark:border-border dark:bg-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#e3dbd1] bg-white shadow-sm dark:border-border"><GoogleIcon className="h-7 w-7" /></span><div className="min-w-0"><h3 className="font-black">Google</h3><p className="mt-1 text-sm text-muted-foreground">Uma opção rápida e segura para acessar sua conta.</p></div></div>
                    <Button type="button" variant="outline" onClick={() => { window.location.href = `${API_BASE_URL}/oauth/google/login`; }} className="h-11 shrink-0 rounded-full border-[#d5ccc1] px-5 font-bold dark:border-border">Usar Google <ExternalLink className="ml-2 h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">O SoundScore usa apenas os dados autorizados por você. O status de vínculo é exibido quando o provedor disponibiliza essa informação.</p>
              </SettingsCard>
            )}

            {activeSection === 'danger' && (
              <SettingsCard icon={AlertTriangle} title="Excluir conta" description="Uma ação permanente para quando você realmente quiser sair." danger>
                <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/20 sm:p-6"><h3 className="font-black text-red-800 dark:text-red-300">Isso não pode ser desfeito</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-red-700/85 dark:text-red-300/75">Seu perfil, reviews, comentários, mensagens e dados da biblioteca serão excluídos permanentemente.</p><Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmation(''); }}><DialogTrigger asChild><Button variant="destructive" className="mt-5 h-11 rounded-full px-5 font-bold"><Trash2 className="mr-2 h-4 w-4" />Excluir minha conta</Button></DialogTrigger><DialogContent className="max-w-[calc(100%-2rem)] rounded-[1.5rem] sm:max-w-md"><DialogHeader><span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40"><Trash2 className="h-6 w-6" /></span><DialogTitle className="text-center text-xl font-black">Excluir sua conta?</DialogTitle><DialogDescription className="text-center leading-relaxed">Digite <strong className="text-foreground">{user.username}</strong> para confirmar. Todos os seus dados serão removidos.</DialogDescription></DialogHeader><div className="py-2"><Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={user.username} className={fieldClassName} /></div><DialogFooter className="gap-2 sm:gap-2"><Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-11 flex-1 rounded-full">Cancelar</Button><Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirmation !== user.username} className="h-11 flex-1 rounded-full">{isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Excluir conta</Button></DialogFooter></DialogContent></Dialog></div>
              </SettingsCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, danger = false, children }: { icon: typeof User; title: string; description: string; danger?: boolean; children: React.ReactNode }) {
  return <section className={cn('overflow-hidden rounded-[1.75rem] border bg-white shadow-[0_18px_55px_rgba(50,38,30,0.07)] dark:bg-card', danger ? 'border-red-200 dark:border-red-900' : 'border-[#dcd4ca] dark:border-border')}><header className={cn('flex items-start gap-3 border-b px-5 py-5 sm:px-7 sm:py-6', danger ? 'border-red-100 bg-red-50/50 dark:border-red-900 dark:bg-red-950/15' : 'border-[#e8e0d7] dark:border-border')}><span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', danger ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-wine-700/10 text-wine-700')}><Icon className="h-4.5 w-4.5" /></span><div><h2 className="text-xl font-black tracking-[-0.025em] sm:text-2xl">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div></header><div className="p-5 sm:p-7">{children}</div></section>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm font-bold text-foreground">{label}</Label>{children}{error && <p className="text-xs font-semibold text-destructive">{error}</p>}</div>;
}

function PasswordStrength({ checks, strength, label, hasPassword }: { checks: { label: string; valid: boolean }[]; strength: number; label: string; hasPassword: boolean }) {
  return <div className="mt-3 space-y-2.5 rounded-xl border border-[#e5ddd3] bg-[#faf8f4] p-3.5 dark:border-border dark:bg-muted/25"><div className="flex items-center justify-between text-[11px] font-bold"><span className="text-muted-foreground">Força da senha</span><span className={strength === 5 ? 'text-emerald-700' : strength >= 3 ? 'text-[#b56534]' : 'text-wine-700'}>{hasPassword ? label : '—'}</span></div><div className="grid grid-cols-5 gap-1" aria-label={`Força da senha: ${hasPassword ? label : 'não informada'}`}>{[1, 2, 3, 4, 5].map((level) => <span key={level} className={cn('h-1.5 rounded-full transition-colors', strength >= level ? strength === 5 ? 'bg-emerald-600' : strength >= 3 ? 'bg-[#f0a36b]' : 'bg-wine-700' : 'bg-[#1b1919]/10 dark:bg-white/10')} />)}</div><div className="flex flex-wrap gap-x-3 gap-y-1.5">{checks.map((check) => <span key={check.label} className={cn('flex items-center gap-1 text-[10px] font-semibold transition-colors', check.valid ? 'text-emerald-700' : 'text-muted-foreground')}><span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full', check.valid ? 'bg-emerald-100' : 'border border-[#1b1919]/15 dark:border-white/20')}>{check.valid && <Check className="h-2.5 w-2.5" />}</span>{check.label}</span>)}</div></div>;
}

function AccountSkeleton() {
  return <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background"><main className="container mx-auto max-w-6xl px-4 py-10 md:px-8"><div className="mb-10 space-y-3"><div className="h-3 w-40 animate-pulse rounded bg-muted" /><div className="h-12 w-72 animate-pulse rounded bg-muted" /><div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" /></div><div className="grid gap-7 lg:grid-cols-[17rem_minmax(0,1fr)]"><div className="h-80 animate-pulse rounded-[1.5rem] bg-muted" /><div className="h-[34rem] animate-pulse rounded-[1.75rem] bg-muted" /></div></main></div>;
}
