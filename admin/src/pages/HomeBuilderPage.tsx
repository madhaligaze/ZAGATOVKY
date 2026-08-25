import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type HomeSectionRow } from '@/lib/api';
import { Button, Field, Input, Panel, Select, Spinner, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';

const kindLabels: Record<string, string> = {
  HERO: 'Первый экран',
  CATEGORIES: 'Категории',
  BUNDLES: 'Готовые наборы',
  COLLECTION: 'Подборка товаров',
  EDITORIAL: 'Текстовый блок',
  BANNER: 'Баннер',
  STEPS: 'Как это работает',
  FAQ: 'Вопросы и ответы',
  CONTACTS: 'Контакты',
};

type Payload = Record<string, unknown>;
type L = { ru?: string; kk?: string };

const asL = (value: unknown): L => (value && typeof value === 'object' ? (value as L) : {});

/** Пара полей RU/KK для одного текстового значения секции. */
const LocalizedField = ({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: L;
  onChange: (next: L) => void;
  multiline?: boolean;
}) => {
  const Component = multiline ? Textarea : Input;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`${label} · RU`}>
        <Component
          value={value.ru ?? ''}
          onChange={(event: { target: { value: string } }) =>
            onChange({ ...value, ru: event.target.value })
          }
          rows={multiline ? 3 : undefined}
        />
      </Field>
      <Field label={`${label} · KK`}>
        <Component
          value={value.kk ?? ''}
          onChange={(event: { target: { value: string } }) =>
            onChange({ ...value, kk: event.target.value })
          }
          rows={multiline ? 3 : undefined}
        />
      </Field>
    </div>
  );
};

const SectionEditor = ({
  section,
  payload,
  onPayload,
  collections,
}: {
  section: HomeSectionRow;
  payload: Payload;
  onPayload: (next: Payload) => void;
  collections: { slug: string; titleRu: string }[];
}) => {
  const set = (key: string, value: unknown) => onPayload({ ...payload, [key]: value });

  return (
    <div className="flex flex-col gap-4 border-t border-line pt-4">
      {section.kind === 'HERO' && (
        <>
          <LocalizedField
            label="Надзаголовок"
            value={asL(payload.eyebrow)}
            onChange={(next) => set('eyebrow', next)}
          />
          <LocalizedField
            label="Заголовок"
            value={asL(payload.title)}
            onChange={(next) => set('title', next)}
            multiline
          />
          <p className="-mt-2 text-2xs text-faint">
            Перенос строки в заголовке разбивает его на строки, которые выезжают по очереди.
          </p>
          <LocalizedField
            label="Подзаголовок"
            value={asL(payload.subtitle)}
            onChange={(next) => set('subtitle', next)}
            multiline
          />
        </>
      )}

      {(section.kind === 'CATEGORIES' ||
        section.kind === 'BUNDLES' ||
        section.kind === 'COLLECTION' ||
        section.kind === 'FAQ' ||
        section.kind === 'STEPS' ||
        section.kind === 'CONTACTS') && (
        <LocalizedField
          label="Заголовок"
          value={asL(payload.title)}
          onChange={(next) => set('title', next)}
        />
      )}

      {(section.kind === 'CATEGORIES' ||
        section.kind === 'BUNDLES' ||
        section.kind === 'COLLECTION') && (
        <LocalizedField
          label="Подзаголовок"
          value={asL(payload.subtitle)}
          onChange={(next) => set('subtitle', next)}
        />
      )}

      {section.kind === 'COLLECTION' && (
        <Field label="Какая подборка" hint="Состав подборки настраивается в разделе «Товары»">
          <Select
            value={String(payload.collectionSlug ?? '')}
            onChange={(event) => set('collectionSlug', event.target.value)}
          >
            <option value="">Выберите подборку</option>
            {collections.map((collection) => (
              <option key={collection.slug} value={collection.slug}>
                {collection.titleRu}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {section.kind === 'EDITORIAL' && (
        <>
          <LocalizedField
            label="Заголовок"
            value={asL(payload.title)}
            onChange={(next) => set('title', next)}
          />
          <LocalizedField
            label="Текст"
            value={asL(payload.text)}
            onChange={(next) => set('text', next)}
            multiline
          />
        </>
      )}

      {section.kind === 'STEPS' && (
        <p className="text-2xs text-faint">
          Шаги задаются списком в данных секции. Чтобы изменить их, отредактируйте текст шага ниже.
        </p>
      )}

      {(section.kind === 'STEPS' || section.kind === 'FAQ') && (
        <Field
          label="Данные секции"
          hint="Список шагов или вопросов в формате JSON — правьте аккуратно"
        >
          <Textarea
            rows={8}
            defaultValue={JSON.stringify(
              section.kind === 'STEPS' ? (payload.steps ?? []) : (payload.items ?? []),
              null,
              2,
            )}
            onBlur={(event) => {
              try {
                const parsed = JSON.parse(event.target.value) as unknown;
                set(section.kind === 'STEPS' ? 'steps' : 'items', parsed);
              } catch {
                toast.error('Не удалось разобрать JSON — проверьте скобки и запятые');
              }
            }}
            className="font-mono text-2xs"
          />
        </Field>
      )}
    </div>
  );
};

const SortableSection = ({
  section,
  collections,
  onSave,
  onDelete,
}: {
  section: HomeSectionRow;
  collections: { slug: string; titleRu: string }[];
  onSave: (payload: Payload, isVisible: boolean) => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<Payload>(section.payload as Payload);

  const dirty = JSON.stringify(payload) !== JSON.stringify(section.payload);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('panel', isDragging && 'z-10 opacity-80', !section.isVisible && 'opacity-60')}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="cursor-grab text-faint hover:text-ink active:cursor-grabbing"
          aria-label="Переместить секцию"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>

        <button type="button" onClick={() => setOpen((value) => !value)} className="flex-1 text-left">
          <span className="text-sm font-semibold">{kindLabels[section.kind] ?? section.kind}</span>
          <span className="ml-2 text-2xs text-faint">
            {open ? 'свернуть' : 'настроить'}
          </span>
        </button>

        <Button
          size="iconSm"
          variant="ghost"
          title={section.isVisible ? 'Скрыть с витрины' : 'Показать на витрине'}
          onClick={() => onSave(payload, !section.isVisible)}
        >
          {section.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
        </Button>

        <Button
          size="iconSm"
          variant="ghost"
          title="Удалить секцию"
          onClick={() => {
            if (window.confirm('Удалить секцию с главной?')) onDelete();
          }}
          className="hover:text-danger"
        >
          <Trash2 size={15} />
        </Button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          <SectionEditor
            section={section}
            payload={payload}
            onPayload={setPayload}
            collections={collections}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!dirty}
              onClick={() => setPayload(section.payload as Payload)}
            >
              Отменить
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!dirty}
              onClick={() => onSave(payload, section.isVisible)}
            >
              Сохранить секцию
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const HomeBuilderPage = () => {
  const queryClient = useQueryClient();
  const [newKind, setNewKind] = useState('EDITORIAL');

  const { data: sections, isPending } = useQuery({
    queryKey: keys.homeSections,
    queryFn: api.homeSections,
  });
  const { data: collections } = useQuery({ queryKey: keys.collections, queryFn: api.collections });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.homeSections });

  const save = useMutation({
    mutationFn: ({
      id,
      payload,
      isVisible,
      sortOrder,
    }: {
      id: string;
      payload: Payload;
      isVisible: boolean;
      sortOrder: number;
    }) => api.updateHomeSection(id, { payload, isVisible, sortOrder }),
    onSuccess: () => {
      void invalidate();
      toast.success('Секция обновлена');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const create = useMutation({
    mutationFn: () => api.createHomeSection({ kind: newKind, payload: {} }),
    onSuccess: () => {
      void invalidate();
      toast.success('Секция добавлена — теперь настройте её');
    },
  });

  const remove = useMutation({
    mutationFn: api.deleteHomeSection,
    onSuccess: () => {
      void invalidate();
      toast.success('Секция удалена');
    },
  });

  const reorder = useMutation({
    mutationFn: api.reorderHomeSections,
    onSuccess: () => void invalidate(),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sections) return;
    const ids = sections.map((section) => section.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    reorder.mutate(arrayMove(ids, from, to));
  };

  if (isPending || !sections) return <Spinner />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Главная страница</h1>
          <p className="text-2xs text-muted">
            Порядок секций на витрине сверху вниз — перетащите, чтобы поменять
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={newKind}
            onChange={(event) => setNewKind(event.target.value)}
            className="w-auto"
          >
            {Object.entries(kindLabels).map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={() => create.mutate()}>
            <Plus size={15} /> Добавить
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                collections={collections ?? []}
                onSave={(payload, isVisible) =>
                  save.mutate({ id: section.id, payload, isVisible, sortOrder: section.sortOrder })
                }
                onDelete={() => remove.mutate(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Panel title="Подсказка">
        <p className="text-2xs text-muted">
          Секции «Категории», «Готовые наборы» и «Подборка» наполняются автоматически из каталога —
          в них настраиваются только заголовки. Чтобы изменить состав подборки, откройте раздел
          «Товары».
        </p>
      </Panel>
    </div>
  );
};
