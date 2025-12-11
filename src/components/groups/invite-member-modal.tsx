'use client';

import { useState, useEffect } from 'react';
import { Search, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/use-debounce';
import type { UserListItem, GroupInviteResponse } from '@/types';

interface InviteMemberModalProps {
  groupUuid: string;
}

interface SearchUsersResponse {
  users: UserListItem[];
  total: number;
}

export function InviteMemberModal({ groupUuid }: InviteMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingUser, setInvitingUser] = useState<number | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<Set<number>>(new Set());

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await api.get<SearchUsersResponse>(
          `/reviews/discover?q=${encodeURIComponent(debouncedSearch)}&type=users&limit=10`
        );
        setUsers(response.users || []);
      } catch {
        // Silent error
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setUsers([]);
      setInvitedUsers(new Set());
    }
  }, [open]);

  const handleInvite = async (username: string, userId: number) => {
    setInvitingUser(userId);
    try {
      await api.post<GroupInviteResponse>(`/groups/${groupUuid}/invites`, {
        invitee_username: username,
      });
      toast.success(`Invite sent to ${username}`);
      // Mark user as invited
      setInvitedUsers((prev) => new Set([...prev, userId]));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInvitingUser(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px]">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search.length < 2
                ? 'Type at least 2 characters to search'
                : 'No users found'}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_picture || undefined} />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(user.username, user.id)}
                    disabled={invitingUser === user.id || invitedUsers.has(user.id)}
                    variant={invitedUsers.has(user.id) ? 'secondary' : 'default'}
                  >
                    {invitingUser === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : invitedUsers.has(user.id) ? (
                      'Invited'
                    ) : (
                      'Invite'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
