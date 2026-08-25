import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Moon, Plus, ShoppingBag, Sun, Zap } from 'lucide-react';
import { api, keys } from '@/lib/api';
import { useWorkspace } from '@/store/workspace';
import { money } from '@/lib/format';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const groupClass =
  '[&_[cmdk-group-heading]]:label-caps [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5';

const itemClass =
  'flex cursor-pointer items-center gap-2.5 rounded-control px-2 py-2 text-sm outline-none data-[selected=true]:bg-raised';

/**
 * Ctrl+K: быстрый переход к товару или заказу и частые действия.
 * Товары подгружаются один раз и ищутся локально — так палитра отвечает мгновенно.
 */
export const CommandPalette = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const workspace = useWorkspace((state) => state.workspace);
  const patch = useWorkspace((state) => state.patchWorkspace);

  const { data: products } = useQuery({
    queryKey: keys.products({ palette: true }),
    queryFn: () => api.products({ limit: 200 }),
    enabled: open,
    staleTime: 60_000,
  });

  const { data: orders } = useQuery({
    queryKey: keys.orders({ palette: true }),
    queryFn: () => api.orders({ limit: 20 }),
    enabled: open,
    staleTime: 30_000,
  });

  const run = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Команды"
      className="fixed left-1/2 top-24 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2"
      overlayClassName="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
      contentClassName="panel overflow-hidden shadow-2xl"
    >
      <Command.Input
        placeholder="Товар, заказ или действие…"
        className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-faint"
      />

      <Command.List className="max-h-96 overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-2xs text-muted">
          Ничего не нашлось
        </Command.Empty>

        <Command.Group heading="Действия" className={groupClass}>
          <Command.Item className={itemClass} onSelect={() => run(() => navigate('/products/new'))}>
            <Plus size={15} className="text-accent" /> Новый товар
          </Command.Item>
          <Command.Item
            className={itemClass}
            onSelect={() => run(() => navigate('/products/new?type=BUNDLE'))}
          >
            <Zap size={15} className="text-accent" /> Новый набор
          </Command.Item>
          <Command.Item
            className={itemClass}
            onSelect={() =>
              run(() => patch({ theme: workspace.theme === 'dark' ? 'light' : 'dark' }))
            }
          >
            {workspace.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {workspace.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </Command.Item>
        </Command.Group>

        {orders?.items.length ? (
          <Command.Group heading="Последние заказы" className={groupClass}>
            {orders.items.slice(0, 6).map((order) => (
              <Command.Item
                key={order.id}
                value={`${order.number} ${order.customerName} ${order.phone}`}
                className={itemClass}
                onSelect={() => run(() => navigate(`/orders?focus=${order.id}`))}
              >
                <ShoppingBag size={15} className="text-muted" />
                <span className="flex-1 truncate">
                  {order.number} · {order.customerName}
                </span>
                <span className="text-2xs text-faint">{money(order.total)}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}

        {products?.items.length ? (
          <Command.Group heading="Товары" className={groupClass}>
            {products.items.map((product) => (
              <Command.Item
                key={product.id}
                value={`${product.name.ru} ${product.name.kk} ${product.slug}`}
                className={itemClass}
                onSelect={() => run(() => navigate(`/products/${product.id}`))}
              >
                <Boxes size={15} className="text-muted" />
                <span className="flex-1 truncate">{product.name.ru}</span>
                <span className="text-2xs text-faint">{money(product.price)}</span>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
    </Command.Dialog>
  );
};
