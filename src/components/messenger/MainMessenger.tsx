import { useState, useEffect } from 'react';
import { User } from '@/pages/Index';
import ChatsList from './ChatsList';
import ChatWindow from './ChatWindow';
import ContactsList from './ContactsList';
import Settings from './Settings';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface MainMessengerProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'chats' | 'contacts' | 'settings';

interface Chat {
  chat_id: number;
  other_user_id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
}

export default function MainMessenger({ user, onLogout }: MainMessengerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showSidebar = !isMobile || (isMobile && !selectedChat);
  const showChat = !isMobile || (isMobile && selectedChat);

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <div className="w-full md:w-80 bg-card border-r border-border flex flex-col">
            <div className="bg-primary text-primary-foreground p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">Мессенджер</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-primary-foreground hover:bg-primary/90"
                >
                  <Icon name="LogOut" size={20} />
                </Button>
              </div>

              <div className="flex gap-1 bg-background/10 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all font-medium ${
                    activeTab === 'chats'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-primary-foreground/80 hover:bg-background/5'
                  }`}
                >
                  <Icon name="MessageSquare" size={18} className="inline mr-2" />
                  Чаты
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all font-medium ${
                    activeTab === 'contacts'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-primary-foreground/80 hover:bg-background/5'
                  }`}
                >
                  <Icon name="Users" size={18} className="inline mr-2" />
                  Контакты
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all font-medium ${
                    activeTab === 'settings'
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-primary-foreground/80 hover:bg-background/5'
                  }`}
                >
                  <Icon name="Settings" size={18} className="inline mr-2" />
                  Настройки
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'chats' && (
                <ChatsList
                  user={user}
                  onSelectChat={(chat) => setSelectedChat(chat)}
                  selectedChatId={selectedChat?.chat_id}
                />
              )}
              {activeTab === 'contacts' && (
                <ContactsList
                  user={user}
                  onSelectContact={(contact) => {
                    setSelectedChat({
                      chat_id: 0,
                      other_user_id: contact.user_id,
                      username: contact.username,
                      display_name: contact.display_name || contact.username,
                      avatar_url: contact.avatar_url
                    });
                    setActiveTab('chats');
                  }}
                />
              )}
              {activeTab === 'settings' && (
                <Settings user={user} onLogout={onLogout} />
              )}
            </div>
          </div>
        )}

        {showChat && (
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <ChatWindow
                user={user}
                chat={selectedChat}
                onBack={() => setSelectedChat(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Icon name="MessageCircle" size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Выберите чат для начала общения</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}