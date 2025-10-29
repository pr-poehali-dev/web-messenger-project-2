import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/pages/Index';

const AUTH_URL = 'https://functions.poehali.dev/4cddaa2a-d61f-4ff9-ae6e-25841180c5b8';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username,
          password
        })
      });

      const data = await response.json();

      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Ошибка авторизации');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/30 to-primary/10">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-card/95 backdrop-blur">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4 shadow-lg">
            <Icon name="MessageCircle" size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Мессенджер</h1>
          <p className="text-muted-foreground mt-2">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Input
              type="text"
              placeholder="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 rounded-xl border-border focus:border-primary focus:ring-primary"
              disabled={loading}
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border-border focus:border-primary focus:ring-primary"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-xl">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            disabled={loading || !username || !password}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </Card>
    </div>
  );
}