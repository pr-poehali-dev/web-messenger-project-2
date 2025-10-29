import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { User } from '@/pages/Index';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AUTH_URL = 'https://functions.poehali.dev/4cddaa2a-d61f-4ff9-ae6e-25841180c5b8';

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

export default function Settings({ user, onLogout }: SettingsProps) {
  const [hideOnlineStatus, setHideOnlineStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [saving, setSaving] = useState(false);

  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isFriend, setIsFriend] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);

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
          avatar_url: user.avatar_url
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setIsEditDialogOpen(false);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterUser = async () => {
    if (!newUsername || !newPassword) return;

    setRegistering(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          admin_id: user.id,
          username: newUsername,
          password: newPassword,
          is_friend_of_admin: isFriend
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsRegisterDialogOpen(false);
        setNewUsername('');
        setNewPassword('');
        setIsFriend(false);
        alert(`Пользователь @${newUsername} успешно создан!`);
      } else {
        alert(data.error || 'Ошибка создания пользователя');
      }
    } catch (err) {
      console.error('Failed to register user', err);
      alert('Не удалось создать пользователя');
    } finally {
      setRegistering(false);
    }
  };

  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.display_name?.[0]?.toUpperCase() || user.username[0].toUpperCase();
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="bg-blue-500 text-white text-2xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{user.display_name}</h2>
              {user.is_verified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Icon name="BadgeCheck" size={20} className="text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Верифицированный пользователь
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {user.is_friend_of_admin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Icon name="BadgeCheck" size={20} className="text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Друг Администратора
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-gray-500">@{user.username}</p>
            <p className="text-sm text-gray-400">
              {user.first_name} {user.last_name}
            </p>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Icon name="Edit" size={16} className="mr-2" />
              Редактировать профиль
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать профиль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2">Имя</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Фамилия</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Отображаемое имя</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Иван Иванов"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Приватность</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Скрыть статус онлайн</p>
            <p className="text-sm text-gray-500">Показывать статус "недавно"</p>
          </div>
          <Switch
            checked={hideOnlineStatus}
            onCheckedChange={setHideOnlineStatus}
          />
        </div>
      </Card>

      {user.is_admin && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="Shield" size={20} className="text-blue-500" />
            Администрирование
          </h3>

          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                <Icon name="UserPlus" size={16} className="mr-2" />
                Создать пользователя
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать нового пользователя</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Логин</label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Пароль</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Друг Администратора</p>
                    <p className="text-sm text-gray-500">Красная галочка</p>
                  </div>
                  <Switch
                    checked={isFriend}
                    onCheckedChange={setIsFriend}
                  />
                </div>
                <Button
                  onClick={handleRegisterUser}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={registering || !newUsername || !newPassword}
                >
                  {registering ? 'Создание...' : 'Создать пользователя'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      <Separator />

      <Button
        onClick={onLogout}
        variant="destructive"
        className="w-full"
      >
        <Icon name="LogOut" size={16} className="mr-2" />
        Выйти из аккаунта
      </Button>
    </div>
  );
}
