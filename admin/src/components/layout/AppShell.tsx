import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Image as ImageIcon,
  LayoutTemplate,
  LogOut,
  Menu,
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
  // На телефоне меню выезжает поверх контента: постоянная колонка в 240px
  // съедала бы больше половины экрана и таблицы становились нечитаемыми.
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

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
      {/* Затемнение под выехавшим меню — только на телефоне */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 lg:transition-[width]',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-16' : 'lg:w-60',
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

        <div className="hidden border-t border-line p-2 lg:block">
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:gap-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Меню"
            onClick={() => setMenuOpen(true)}
            className="shrink-0 lg:hidden"
          >
            <Menu size={18} strokeWidth={1.6} />
          </Button>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control border border-line px-3 text-left text-sm text-faint transition-colors hover:border-line-strong sm:max-w-sm"
          >
            <Search size={15} strokeWidth={1.6} className="shrink-0" />
            <span className="hidden flex-1 truncate sm:block">Поиск и команды</span>
            <kbd className="ml-auto hidden rounded border border-line px-1.5 py-0.5 text-2xs text-muted sm:block">
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

        <main className="min-w-0 flex-1 p-3 sm:p-5">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
};
