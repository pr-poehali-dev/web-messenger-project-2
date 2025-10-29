import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { User } from '@/pages/Index';

const MESSAGES_URL = 'https://functions.poehali.dev/01ddfc19-e4e5-4682-a2c0-1360af821890';

interface Chat {
  chat_id: number;
  other_user_id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
}

interface ChatWindowProps {
  user: User;
  chat: Chat;
  onBack: () => void;
}

export default function ChatWindow({ user, chat, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(chat.chat_id);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initChat();
  }, [chat.other_user_id]);

  useEffect(() => {
    if (chatId > 0) {
      fetchMessages();
      const interval = setInterval(() => {
        fetchMessages();
        checkTyping();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    if (chat.chat_id > 0) {
      setChatId(chat.chat_id);
      return;
    }

    try {
      const response = await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_chat',
          user1_id: user.id,
          user2_id: chat.other_user_id
        })
      });

      const data = await response.json();

      if (data.success && data.chat_id) {
        setChatId(data.chat_id);
      }
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const fetchMessages = async () => {
    if (chatId <= 0) return;

    try {
      const response = await fetch(`${MESSAGES_URL}?action=get_messages&chat_id=${chatId}`);
      const data = await response.json();

      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const checkTyping = async () => {
    if (chatId <= 0) return;

    try {
      const response = await fetch(`${MESSAGES_URL}?action=is_typing&chat_id=${chatId}&user_id=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setIsTyping(data.is_typing);
      }
    } catch (err) {
      console.error('Failed to check typing', err);
    }
  };

  const handleTyping = () => {
    if (chatId <= 0) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    fetch(MESSAGES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_typing',
        chat_id: chatId,
        user_id: user.id
      })
    }).catch(() => {});

    typingTimeoutRef.current = setTimeout(() => {}, 3000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || chatId <= 0 || sending) return;

    setSending(true);

    try {
      const response = await fetch(MESSAGES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: chatId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="md:hidden"
        >
          <Icon name="ArrowLeft" size={20} />
        </Button>

        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-blue-500 text-white">
            {chat.display_name[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">{chat.display_name}</h2>
          {isTyping && (
            <p className="text-sm text-blue-500">печатает...</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <Icon name="MessageCircle" size={48} className="mx-auto mb-2 opacity-50" />
            <p>Начните беседу</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === user.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isOwn && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-400 text-white text-xs">
                        {message.sender_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Написать сообщение..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
