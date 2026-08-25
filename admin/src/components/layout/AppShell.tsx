import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useWorkspace } from '@/store/workspace';
import { WorkspaceMenu } from './WorkspaceMenu';
import { CommandPalette } from './CommandPalette';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

export const navigation = [
  { to: '/', label: 'Обзор', icon: BarChart3, end: true },
  { to: '/orders', label: 'Заказы', icon: ShoppingBag },
  { to: '/products', label: 'Товары', icon: Boxes },
  { to: '/media', label: 'Медиатека', icon: ImageIcon },
  { to: '/home', label: 'Главная', icon: LayoutTemplate },
  { to: '/settings', label: 'Настройки', icon: SettingsIcon },
  { to: '/users', label: 'Команда', icon: Users },
  { to: '/audit', label: 'Журнал', icon: ClipboardList },
] as const;

export const AppShell = () => {
  const navigate = useNavigate();
  const user = useWorkspace((state) => state.user);
  const logout = useWorkspace((state) => state.logout);
  const collapsed = useWorkspace((state) => state.workspace.sidebarCollapsed);
  const patch = useWorkspace((state) => state.patchWorkspace);

  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl+K — командная палитра, привычный жест для рабочего инструмента
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          'sticky top-0 flex h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-control bg-accent text-2xs font-bold text-accent-ink"
            aria-hidden
          >
            Z
          </span>
          {!collapsed && (
            <span className="truncate font-semibold tracking-tight">ZAGATOVKY</span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-accent-soft font-semibold text-ink'
                    : 'text-muted hover:bg-raised hover:text-ink',
                )
              }
            >
              <item.icon size={17} strokeWidth={1.6} className="shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-2">
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'md'}
            onClick={() => patch({ sidebarCollapsed: !collapsed })}
            className={cn('w-full', !collapsed && 'justify-start')}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            {!collapsed && 'Свернуть'}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/95 px-5 backdrop-blur">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-control border border-line px-3 text-left text-sm text-faint transition-colors hover:border-line-strong sm:max-w-sm"
          >
            <Search size={15} strokeWidth={1.6} />
            <span className="flex-1 truncate">Поиск и команды</span>
            <kbd className="rounded border border-line px-1.5 py-0.5 text-2xs text-muted">
              Ctrl K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <WorkspaceMenu />

            <div className="hidden text-right sm:block">
              <p className="text-2xs font-semibold leading-tight">{user?.name}</p>
              <p className="text-2xs leading-tight text-faint">
                {user?.role === 'OWNER'
                  ? 'Владелец'
                  : user?.role === 'MANAGER'
                    ? 'Менеджер'
                    : 'Просмотр'}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              title="Выйти"
              onClick={() => {
                void logout().then(() => navigate('/login', { replace: true }));
              }}
            >
              <LogOut size={17} strokeWidth={1.6} />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};
