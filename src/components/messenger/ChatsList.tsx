import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/pages/Index';

const MESSAGES_URL = 'https://functions.poehali.dev/01ddfc19-e4e5-4682-a2c0-1360af821890';

interface Chat {
  chat_id: number;
  other_user_id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
}

interface ChatsListProps {
  user: User;
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: number;
}

export default function ChatsList({ user, onSelectChat, selectedChatId }: ChatsListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 2000);
    return () => clearInterval(interval);
  }, [user.id]);

  const fetchChats = async () => {
    try {
      const response = await fetch(`${MESSAGES_URL}?action=get_chats&user_id=${user.id}`);
      const data = await response.json();

      if (data.success && data.chats) {
        setChats(data.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Загрузка чатов...
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Нет активных чатов</p>
        <p className="text-sm mt-2">Найдите пользователя, чтобы начать общение</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {chats.map((chat) => (
        <div
          key={chat.chat_id}
          onClick={() => onSelectChat(chat)}
          className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
            selectedChatId === chat.chat_id ? 'bg-accent' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {chat.display_name[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {chat.display_name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatTime(chat.last_message_time)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {chat.last_message || 'Начните беседу'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}