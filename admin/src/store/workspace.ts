import { create } from 'zustand';
import { api, setAccessToken, type AdminUser } from '@/lib/api';

export type Theme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
export type Accent = 'honey' | 'teal' | 'sky' | 'rose';

/** Именованный набор фильтров и колонок таблицы товаров. */
export type SavedView = {
  id: string;
  name: string;
  filters: { search?: string; category?: string; type?: string; status?: string };
  columns: string[];
};

export type Workspace = {
  theme: Theme;
  density: Density;
  accent: Accent;
  /** Порядок и видимость виджетов дашборда */
  widgets: string[];
  hiddenWidgets: string[];
  productColumns: string[];
  savedViews: SavedView[];
  sidebarCollapsed: boolean;
};

export const defaultWorkspace: Workspace = {
  theme: 'light',
  density: 'comfortable',
  accent: 'honey',
  widgets: ['orders', 'revenue', 'attention', 'top', 'recent'],
  hiddenWidgets: [],
  productColumns: ['photo', 'name', 'category', 'price', 'cost', 'weight', 'stock', 'visible'],
  savedViews: [],
  sidebarCollapsed: false,
};

type State = {
  user: AdminUser | null;
  workspace: Workspace;
  status: 'checking' | 'authorized' | 'guest';
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  patchWorkspace: (patch: Partial<Workspace>) => void;
};

/** Настройки рабочего места живут на сервере, поэтому переезжают между устройствами. */
const persistWorkspace = (() => {
  let timer: number | undefined;
  return (workspace: Workspace) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void api.savePrefs({ workspace }).catch(() => {
        // Не критично: настройки применены локально, синхронизируются позже
      });
    }, 600);
  };
})();

const applyToDom = (workspace: Workspace) => {
  const root = document.documentElement;
  root.dataset.theme = workspace.theme;
  root.dataset.density = workspace.density;
  root.dataset.accent = workspace.accent;
};

/**
 * Список, где новые пункты должны появляться у тех, кто уже сохранял раскладку.
 * Иначе добавленная колонка или виджет остаются невидимыми для всех действующих
 * пользователей: их старый массив просто не знает о новом элементе.
 */
const withNewEntries = (stored: string[] | undefined, defaults: string[], hidden: string[] = []) => {
  if (!stored) return defaults;
  const missing = defaults.filter((item) => !stored.includes(item) && !hidden.includes(item));
  return [...stored, ...missing];
};

const readWorkspace = (user: AdminUser): Workspace => {
  const stored = (user.prefs as { workspace?: Partial<Workspace> } | undefined)?.workspace;
  const merged = { ...defaultWorkspace, ...stored };

  return {
    ...merged,
    productColumns: withNewEntries(stored?.productColumns, defaultWorkspace.productColumns),
    widgets: withNewEntries(stored?.widgets, defaultWorkspace.widgets, merged.hiddenWidgets),
  };
};

export const useWorkspace = create<State>((set, get) => ({
  user: null,
  workspace: defaultWorkspace,
  status: 'checking',

  // Тихий вход по refresh-cookie при открытии вкладки
  bootstrap: async () => {
    try {
      const session = await api.refresh();
      setAccessToken(session.accessToken);
      const workspace = readWorkspace(session.user);
      applyToDom(workspace);
      set({ user: session.user, workspace, status: 'authorized' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'guest' });
    }
  },

  login: async (email, password) => {
    const session = await api.login({ email, password });
    setAccessToken(session.accessToken);
    const workspace = readWorkspace(session.user);
    applyToDom(workspace);
    set({ user: session.user, workspace, status: 'authorized' });
  },

  logout: async () => {
    await api.logout().catch(() => undefined);
    setAccessToken(null);
    set({ user: null, status: 'guest' });
  },

  patchWorkspace: (patch) => {
    const workspace = { ...get().workspace, ...patch };
    applyToDom(workspace);
    set({ workspace });
    if (get().status === 'authorized') persistWorkspace(workspace);
  },
}));
