import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { User } from '@/pages/Index';

const AUTH_URL = 'https://functions.poehali.dev/4cddaa2a-d61f-4ff9-ae6e-25841180c5b8';

interface ProfileSetupProps {
  user: User;
  onComplete: (user: User) => void;
}

export default function ProfileSetup({ user, onComplete }: ProfileSetupProps) {
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName || !lastName || !displayName) return;

    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          display_name: displayName,
          avatar_url: null
        })
      });

      const data = await response.json();

      if (data.success && data.user) {
        onComplete({ ...user, ...data.user });
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return displayName ? displayName[0].toUpperCase() : user.username[0].toUpperCase();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarFallback className="bg-blue-500 text-white text-2xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-gray-900">Настройка профиля</h1>
          <p className="text-gray-500 mt-2">@{user.username}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Имя
            </label>
            <Input
              type="text"
              placeholder="Иван"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Фамилия
            </label>
            <Input
              type="text"
              placeholder="Иванов"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Отображаемое имя
            </label>
            <Input
              type="text"
              placeholder="Иван Иванов"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-blue-500 hover:bg-blue-600 mt-6"
            disabled={loading || !firstName || !lastName || !displayName}
          >
            {loading ? 'Сохранение...' : 'Продолжить'}
            <Icon name="ArrowRight" size={20} className="ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
