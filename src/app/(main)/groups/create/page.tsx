'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Check, Globe, ImagePlus, Loader2, Lock, Music2, Sparkles, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { Group, GroupCreate } from '@/types';

const CATEGORIES = [
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Eletrônica' },
  { value: 'classical', label: 'Clássica' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'metal', label: 'Metal' },
  { value: 'r&b', label: 'R&B' },
  { value: 'country', label: 'Country' },
  { value: 'other', label: 'Outro' },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<GroupCreate>({
    name: '',
    description: '',
    privacy: 'public',
    category: '',
  });

  const handleCoverSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Escolha uma imagem JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Dê um nome ao grupo para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: GroupCreate = {
        name: formData.name.trim(),
        privacy: formData.privacy,
      };
      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.category) payload.category = formData.category;

      let group = await api.post<Group>('/groups', payload);

      if (coverImage && group.uuid) {
        const upload = new FormData();
        upload.append('file', coverImage);
        try {
          group = await api.postForm<Group>(`/groups/${group.uuid}/cover`, upload);
        } catch {
          toast.error('O grupo foi criado, mas a capa não foi enviada. Você poderá adicioná-la depois.');
        }
      }

      toast.success('Grupo criado!');
      router.push(`/groups/${group.uuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o grupo. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <CreateGroupSkeleton />;

  const selectedCategory = CATEGORIES.find((category) => category.value === formData.category);

  return (
    <div className="app-usable-viewport bg-[#f4f0e8] text-[#1b1919] dark:bg-background dark:text-foreground">
      <main className="container mx-auto max-w-3xl px-4 pb-16 pt-4 md:pb-24 md:pt-8">
        <Button variant="ghost" className="mb-3 h-11 gap-2 px-2 md:mb-5" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" />Voltar</Button>

        <header className="mb-6 md:mb-8">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em] text-wine-700 sm:text-[11px]"><Sparkles className="h-3.5 w-3.5 text-[#d98524]" />Uma nova comunidade</p>
          <h1 className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">Crie o lugar da conversa.</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Dê uma identidade ao grupo e reúna pessoas em torno do que vocês gostam de ouvir.</p>
        </header>

        <section className="relative mb-5 h-52 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#4d2028] via-[#722f37] to-[#d98524] shadow-[0_18px_50px_rgba(69,30,37,0.18)] sm:h-64">
          {coverPreview ? <Image src={coverPreview} alt="Prévia da capa" fill className="object-cover" /> : <div className="absolute inset-0"><div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[28px] border-white/10" /><div className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-[#f2ad52]/20 blur-2xl" /><Music2 className="absolute right-8 top-1/2 h-14 w-14 -translate-y-1/2 text-white/35 sm:right-14 sm:h-20 sm:w-20" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/15" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70"><Users className="h-3.5 w-3.5" />1 membro{selectedCategory && <><span>·</span><span className="text-[#f2ad52]">{selectedCategory.label}</span></>}</div>
            <h2 className="truncate text-2xl font-black tracking-[-0.035em] sm:text-3xl">{formData.name.trim() || 'Nome do seu grupo'}</h2>
            <p className="mt-1 line-clamp-1 max-w-lg text-sm text-white/70">{formData.description?.trim() || 'A descrição aparecerá aqui.'}</p>
          </div>
          <div className="absolute right-3 top-3 flex gap-2 sm:right-4 sm:top-4">
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting} className="h-10 rounded-full border border-white/15 bg-black/35 px-4 text-xs text-white backdrop-blur-md hover:bg-black/55 hover:text-white"><ImagePlus className="mr-2 h-4 w-4" />{coverPreview ? 'Trocar capa' : 'Adicionar capa'}</Button>
            {coverPreview && <Button type="button" size="icon" variant="secondary" onClick={removeCover} disabled={isSubmitting} className="h-10 w-10 rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md hover:bg-black/55 hover:text-white" aria-label="Remover capa"><X className="h-4 w-4" /></Button>}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverSelect} className="hidden" />
        </section>

        <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-[#dcd4ca] bg-white p-5 shadow-[0_16px_48px_rgba(50,38,30,0.06)] dark:border-border dark:bg-card sm:p-7">
          {error && <div className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label htmlFor="name" className="font-bold">Nome do grupo</Label><span className="text-xs text-muted-foreground">{formData.name.length}/100</span></div>
            <Input id="name" placeholder="Ex.: Clube dos discos tristes" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} maxLength={100} disabled={isSubmitting} className="h-12 rounded-xl border-[#d8d0c6] bg-[#faf8f4] px-4 shadow-none dark:border-border dark:bg-muted/40" />
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between"><Label htmlFor="description" className="font-bold">Sobre o que vocês vão conversar?</Label><span className="text-xs text-muted-foreground">{formData.description?.length || 0}/1000</span></div>
            <Textarea id="description" placeholder="Conte o que une este grupo e que tipo de conversa você quer criar..." value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} maxLength={1000} rows={4} disabled={isSubmitting} className="resize-none rounded-xl border-[#d8d0c6] bg-[#faf8f4] px-4 py-3 shadow-none dark:border-border dark:bg-muted/40" />
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-bold">Qual é a vibe?</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => <button key={category.value} type="button" onClick={() => setFormData((current) => ({ ...current, category: current.category === category.value ? '' : category.value }))} disabled={isSubmitting} className={cn('h-9 rounded-full px-4 text-xs font-bold transition-colors', formData.category === category.value ? 'bg-wine-700 text-white' : 'bg-[#eee8df] text-foreground/70 hover:bg-[#e6ddd2] dark:bg-muted')}>{category.label}</button>)}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-bold">Quem pode entrar?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <PrivacyOption active={formData.privacy === 'public'} icon={<Globe className="h-5 w-5" />} title="Público" description="Qualquer pessoa pode encontrar e participar." onClick={() => setFormData((current) => ({ ...current, privacy: 'public' }))} disabled={isSubmitting} />
              <PrivacyOption active={formData.privacy === 'private'} icon={<Lock className="h-5 w-5" />} title="Privado" description="A entrada acontece somente por convite." onClick={() => setFormData((current) => ({ ...current, privacy: 'private' }))} disabled={isSubmitting} />
            </div>
          </fieldset>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#eee8e0] pt-5 dark:border-border sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting} className="h-12 rounded-full px-6">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()} className="h-12 rounded-full bg-wine-700 px-7 text-white hover:bg-wine-800">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando grupo…</> : 'Criar grupo'}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function PrivacyOption({ active, icon, title, description, onClick, disabled }: { active: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn('relative flex min-h-24 items-start gap-3 rounded-[1.2rem] border p-4 text-left transition-all', active ? 'border-wine-700 bg-wine-700/[0.055] ring-1 ring-wine-700' : 'border-[#d8d0c6] hover:bg-[#faf8f4] dark:border-border dark:hover:bg-muted/40')}>
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', active ? 'bg-wine-700 text-white' : 'bg-[#eee8df] text-muted-foreground dark:bg-muted')}>{icon}</span>
      <span><span className="block font-black">{title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span></span>
      {active && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-wine-700 text-white"><Check className="h-3 w-3" /></span>}
    </button>
  );
}

function CreateGroupSkeleton() {
  return (
    <div className="app-usable-viewport bg-[#f4f0e8] dark:bg-background"><div className="container mx-auto max-w-3xl px-4 py-8"><Skeleton className="mb-6 h-11 w-24" /><Skeleton className="mb-3 h-12 w-3/4" /><Skeleton className="mb-8 h-4 w-2/3" /><Skeleton className="mb-5 h-64 w-full rounded-[1.75rem]" /><Skeleton className="h-[34rem] w-full rounded-[1.75rem]" /></div></div>
  );
}
