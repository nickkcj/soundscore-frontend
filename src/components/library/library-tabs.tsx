'use client';

import { History, Star, Disc, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LibrarySubTab = 'scrobbles' | 'artists' | 'albums' | 'tracks';

interface LibraryTabsProps {
  activeTab: LibrarySubTab;
  onTabChange: (tab: LibrarySubTab) => void;
}

const TABS = [
  { id: 'scrobbles', label: 'Histórico', icon: History },
  { id: 'artists', label: 'Artistas', icon: Star },
  { id: 'albums', label: 'Álbuns', icon: Disc },
  { id: 'tracks', label: 'Faixas', icon: Music },
] as const;

export function LibraryTabs({ activeTab, onTabChange }: LibraryTabsProps) {
  return (
    <div className="-mx-1 flex gap-0 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:w-fit sm:gap-1 sm:rounded-full sm:border sm:border-[#ddd4c9] sm:bg-white sm:p-1 sm:shadow-sm dark:sm:border-border dark:sm:bg-card">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as LibrarySubTab)}
            className={cn(
              'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm',
              isActive
                ? 'bg-wine-700 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-[#f4f0e8] hover:text-foreground dark:hover:bg-muted'
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
