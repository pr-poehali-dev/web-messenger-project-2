import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { User } from '@/pages/Index';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MESSAGES_URL = 'https://functions.poehali.dev/01ddfc19-e4e5-4682-a2c0-1360af821890';

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

interface ContactsListProps {
  user: User;
  onSelectContact: (contact: Contact) => void;
}

export default function ContactsList({ user, onSelectContact }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [customName, setCustomName] = useState('');
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

  const handleAddContact = async () => {
    if (!searchUsername || !customName) return;

    setAddingContact(true);

    try {
      const response = await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_contact',
          user_id: user.id,
          contact_username: searchUsername,
          custom_name: customName
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchContacts();
        setIsDialogOpen(false);
        setSearchUsername('');
        setCustomName('');
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
      <div className="p-4 text-center text-gray-500">
        Загрузка контактов...
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              <Icon name="UserPlus" size={18} className="mr-2" />
              Добавить контакт
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить контакт</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Юзернейм
                </label>
                <Input
                  placeholder="username"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Как назвать контакт
                </label>
                <Input
                  placeholder="Иван Иванов"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddContact}
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={addingContact || !searchUsername || !customName}
              >
                {addingContact ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>У вас пока нет контактов</p>
          <p className="text-sm mt-2">Добавьте контакт по юзернейму</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {(contact.custom_name || contact.display_name || contact.username)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.custom_name || contact.display_name || contact.username}
                    </h3>
                    {contact.is_verified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Icon name="BadgeCheck" size={16} className="text-blue-500" />
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
                            <Icon name="BadgeCheck" size={16} className="text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Друг Администратора
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
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
