import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { useWorkspace } from '@/store/workspace';
import { Button, Field, Input } from '@/components/ui';

export const LoginPage = () => {
  const status = useWorkspace((state) => state.status);
  const login = useWorkspace((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (status === 'authorized') return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Не удалось войти');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-panel bg-accent text-sm font-bold text-accent-ink"
            aria-hidden
          >
            Z
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Кабинет ZAGATOVKY</h1>
          <p className="mt-1 text-2xs text-muted">Управление каталогом, заказами и витриной</p>
        </div>

        <form onSubmit={submit} className="panel flex flex-col gap-4 p-6">
          <Field label="Почта">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoFocus
              required
              data-testid="login-email"
            />
          </Field>

          <Field label="Пароль">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              data-testid="login-password"
            />
          </Field>

          {error && (
            <p className="rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-2xs text-danger">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={pending}
            data-testid="login-submit"
          >
            {pending ? 'Входим…' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  );
};
