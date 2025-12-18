'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Users, Lock, Globe, TrendingUp, Music, Loader2, MoreVertical, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupSettingsModal } from '@/components/groups/group-settings-modal';
import { useRequireAuth } from '@/hooks/use-auth';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { Group, GroupListResponse, GroupMember } from '@/types';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'classical', label: 'Classical' },
  { value: 'jazz', label: 'Jazz' },
];

export default function GroupsPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [trendingGroups, setTrendingGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const initialLoadDone = useRef(false);

  // Handle join success - atualiza estado e redireciona para o grupo
  const handleJoinSuccess = useCallback((groupUuid: string) => {
    // Atualiza a lista principal
    setGroups(prev => prev.map(g =>
      g.uuid === groupUuid ? { ...g, is_member: true, member_count: g.member_count + 1 } : g
    ));
    // Atualiza trending groups
    setTrendingGroups(prev => prev.map(g =>
      g.uuid === groupUuid ? { ...g, is_member: true, member_count: g.member_count + 1 } : g
    ));

    toast.success('Joined group!');
    router.push(`/groups/${groupUuid}`);
  }, [router]);

  // Handle group update
  const handleGroupUpdate = useCallback((updatedGroup: Group) => {
    setGroups(prev => prev.map(g =>
      g.uuid === updatedGroup.uuid ? { ...g, ...updatedGroup } : g
    ));
    setTrendingGroups(prev => prev.map(g =>
      g.uuid === updatedGroup.uuid ? { ...g, ...updatedGroup } : g
    ));
  }, []);

  // Handle group delete
  const handleGroupDelete = useCallback((groupUuid: string) => {
    setGroups(prev => prev.filter(g => g.uuid !== groupUuid));
    setTrendingGroups(prev => prev.filter(g => g.uuid !== groupUuid));
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial load
  useEffect(() => {
    if (!authLoading && !initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchGroups();
      fetchTrendingGroups();
    }
  }, [authLoading]);

  // Search/filter changes (after initial load)
  useEffect(() => {
    if (initialLoadDone.current) {
      fetchGroups();
    }
  }, [debouncedSearch, category]);

  const fetchGroups = async () => {
    // Only show full skeleton on initial load
    if (!initialLoadDone.current) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (category !== 'all') params.append('category', category);

      const response = await api.get<GroupListResponse>(`/groups?${params}`);
      setGroups(response.groups);
    } catch {
      setGroups([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const fetchTrendingGroups = async () => {
    try {
      const response = await api.get<GroupListResponse>('/groups?per_page=4&sort=members');
      setTrendingGroups(response.groups);
    } catch {
      setTrendingGroups([]);
    }
  };

  if (authLoading) {
    return <GroupsPageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-muted-foreground">
            Join communities of music lovers
          </p>
        </div>
        <Link href="/groups/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </Link>
      </div>

      {/* Trending Groups */}
      {trendingGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Groups
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trendingGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onJoinSuccess={handleJoinSuccess}
                onUpdate={handleGroupUpdate}
                onDelete={handleGroupDelete}
                currentUserId={user?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Groups List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No groups found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onJoinSuccess={handleJoinSuccess}
              onUpdate={handleGroupUpdate}
              onDelete={handleGroupDelete}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  onJoinSuccess?: (groupUuid: string) => void;
  onUpdate?: (updatedGroup: Group) => void;
  onDelete?: (groupUuid: string) => void;
  currentUserId?: number;
}

function GroupCard({ group, onJoinSuccess, onUpdate, onDelete, currentUserId }: GroupCardProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const router = useRouter();

  const isAdmin = group.role === 'admin';
  const isCreator = currentUserId === group.created_by_id;

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isJoining) return;

    setIsJoining(true);
    try {
      await api.post(`/groups/${group.uuid}/join`);
      onJoinSuccess?.(group.uuid);
    } catch {
      // Error handled silently, button returns to normal state
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/groups/${group.uuid}`);
  };

  const handleOpenSettings = async () => {
    // Fetch members when opening settings
    try {
      const response = await api.get<{ members: GroupMember[] }>(`/groups/${group.uuid}/members`);
      setMembers(response.members);
    } catch {
      setMembers([]);
    }
    setShowSettings(true);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full p-0">
        {/* Cover Image - fills to top with rounded corners */}
        <div className="relative h-28 bg-gradient-to-br from-primary/20 to-accent/20">
          {group.cover_image ? (
            <Image
              src={group.cover_image}
              alt={group.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {group.privacy === 'private' ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 bg-background/80 text-xs">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            )}
            {/* Admin Menu */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-background/80 hover:bg-background"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpenSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  {isCreator && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={handleOpenSettings}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="p-4 flex flex-col h-[calc(100%-7rem)]">
          <div className="flex-1 min-h-0">
            <h3 className="font-semibold truncate">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {group.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.member_count} members
              </span>
              {group.category && (
                <Badge variant="secondary" className="text-xs">
                  {group.category}
                </Badge>
              )}
            </div>
            {group.is_member ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpen}
                className="ml-2 cursor-pointer"
              >
                Open
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleJoin}
                disabled={isJoining}
                className="ml-2 cursor-pointer"
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Join'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Settings Modal */}
      {showSettings && currentUserId && (
        <GroupSettingsModal
          group={group}
          members={members}
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onUpdate={onUpdate}
          onDelete={() => onDelete?.(group.uuid)}
          isCreator={isCreator}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

function GroupCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-32" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function GroupsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GroupCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
