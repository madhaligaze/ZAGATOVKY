import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Moon, Palette, Sun } from 'lucide-react';
import { useWorkspace, type Accent, type Density, type Theme } from '@/store/workspace';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

const accents: { value: Accent; label: string; swatch: string }[] = [
  { value: 'honey', label: 'Медовый', swatch: '#eac486' },
  { value: 'teal', label: 'Тил', swatch: '#1d414d' },
  { value: 'sky', label: 'Небо', swatch: '#2b6f9e' },
  { value: 'rose', label: 'Роза', swatch: '#a5495c' },
];

const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
];

const densities: { value: Density; label: string; hint: string }[] = [
  { value: 'comfortable', label: 'Просторная', hint: 'больше воздуха в таблицах' },
  { value: 'compact', label: 'Плотная', hint: 'больше строк на экране' },
];

const itemClass =
  'flex cursor-pointer items-center justify-between gap-3 rounded-control px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-raised';

/**
 * Настройка рабочего места: тема, плотность и акцент.
 * Всё сохраняется в профиль пользователя на сервере, а не в браузер,
 * поэтому вид кабинета одинаковый на ноутбуке и на планшете.
 */
export const WorkspaceMenu = () => {
  const workspace = useWorkspace((state) => state.workspace);
  const patch = useWorkspace((state) => state.patchWorkspace);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" title="Вид кабинета">
          {workspace.theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="panel z-50 w-64 p-2 shadow-lg"
        >
          <DropdownMenu.Label className="label-caps px-2 pb-1 pt-1.5">Тема</DropdownMenu.Label>
          {themes.map((theme) => (
            <DropdownMenu.Item
              key={theme.value}
              className={itemClass}
              onSelect={() => patch({ theme: theme.value })}
            >
              {theme.label}
              {workspace.theme === theme.value && <Check size={14} className="text-accent" />}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-2 h-px bg-line" />

          <DropdownMenu.Label className="label-caps px-2 pb-1">Плотность</DropdownMenu.Label>
          {densities.map((density) => (
            <DropdownMenu.Item
              key={density.value}
              className={itemClass}
              onSelect={() => patch({ density: density.value })}
            >
              <span className="flex flex-col">
                {density.label}
                <span className="text-2xs text-faint">{density.hint}</span>
              </span>
              {workspace.density === density.value && <Check size={14} className="text-accent" />}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-2 h-px bg-line" />

          <DropdownMenu.Label className="label-caps flex items-center gap-1.5 px-2 pb-1">
            <Palette size={12} /> Акцент
          </DropdownMenu.Label>
          <div className="flex gap-2 px-2 py-1">
            {accents.map((accent) => (
              <button
                key={accent.value}
                type="button"
                onClick={() => patch({ accent: accent.value })}
                title={accent.label}
                aria-label={accent.label}
                aria-pressed={workspace.accent === accent.value}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                  workspace.accent === accent.value ? 'border-ink' : 'border-line',
                )}
                style={{ backgroundColor: accent.swatch }}
              />
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
