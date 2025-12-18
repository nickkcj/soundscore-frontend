'use client';

import { History, Star, Disc, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LibrarySubTab = 'scrobbles' | 'artists' | 'albums' | 'tracks';

interface LibraryTabsProps {
  activeTab: LibrarySubTab;
  onTabChange: (tab: LibrarySubTab) => void;
}

const TABS = [
  { id: 'scrobbles', label: 'Scrobbles', icon: History },
  { id: 'artists', label: 'Artists', icon: Star },
  { id: 'albums', label: 'Albums', icon: Disc },
  { id: 'tracks', label: 'Tracks', icon: Music },
] as const;

export function LibraryTabs({ activeTab, onTabChange }: LibraryTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as LibrarySubTab)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
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
