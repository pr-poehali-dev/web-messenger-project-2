import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { User } from '@/pages/Index';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MESSAGES_URL = 'https://functions.poehali.dev/01ddfc19-e4e5-4682-a2c0-1360af821890';
const SEARCH_URL = 'https://functions.poehali.dev/d70986d3-4f73-48f6-af81-9b1a7a4792c7';

interface Contact {
  id: number;
  user_id: number;
  custom_name?: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_friend_of_admin: boolean;
  last_seen?: string;
  status_visibility: string;
}

interface SearchResult {
  user_id: number;
  username: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_contact: boolean;
}

interface ContactsListProps {
  user: User;
  onSelectContact: (contact: Contact) => void;
}

export default function ContactsList({ user, onSelectContact }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [user.id]);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${MESSAGES_URL}?action=get_contacts&user_id=${user.id}`);
      const data = await response.json();

      if (data.success && data.contacts) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(
        `${SEARCH_URL}?q=${encodeURIComponent(searchQuery)}&user_id=${user.id}`
      );
      const data = await response.json();

      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddContact = async (targetUserId: number) => {
    setAddingContact(true);

    try {
      const response = await fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          target_user_id: targetUserId
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchContacts();
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to add contact', err);
    } finally {
      setAddingContact(false);
    }
  };

  const getOnlineStatus = (contact: Contact) => {
    if (contact.status_visibility === 'hidden') return 'недавно';
    
    if (!contact.last_seen) return 'офлайн';
    
    const lastSeen = new Date(contact.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;
    
    if (diffMinutes < 1) return 'онлайн';
    if (diffMinutes < 1440) return 'недавно';
    return 'был(а) в сети 1 день назад';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Загрузка контактов...
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-border">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-semibold">
              <Icon name="Search" size={18} className="mr-2" />
              Найти пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Найти пользователя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Введите юзернейм..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchUsers}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Icon name="Search" size={18} />
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {searching && (
                  <div className="text-center py-4 text-muted-foreground">
                    Поиск...
                  </div>
                )}

                {!searching && searchResults.length === 0 && searchQuery && (
                  <div className="text-center py-4 text-muted-foreground">
                    Пользователи не найдены
                  </div>
                )}

                {searchResults.map((result) => (
                  <div
                    key={result.user_id}
                    className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {result.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate">
                          {result.display_name}
                        </p>
                        {result.is_verified && (
                          <Icon name="BadgeCheck" size={14} className="text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{result.username}
                      </p>
                    </div>

                    {result.is_contact ? (
                      <Button size="sm" variant="secondary" disabled>
                        <Icon name="Check" size={16} className="mr-1" />
                        В контактах
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddContact(result.user_id)}
                        disabled={addingContact}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Icon name="UserPlus" size={16} className="mr-1" />
                        Добавить
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          <p>У вас пока нет контактов</p>
          <p className="text-sm mt-2">Найдите пользователей по юзернейму</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(contact.custom_name || contact.display_name || contact.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {contact.custom_name || contact.display_name || contact.username}
                    </h3>
                    {contact.is_verified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Icon name="BadgeCheck" size={16} className="text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Верифицированный пользователь
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {contact.is_friend_of_admin && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Icon name="BadgeCheck" size={16} className="text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Друг Администратора
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    @{contact.username} • {getOnlineStatus(contact)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}