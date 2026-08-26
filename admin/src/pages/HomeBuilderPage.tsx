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
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type HomeSectionRow } from '@/lib/api';
import {
  Button,
  Field,
  Input,
  Panel,
  SaveButton,
  Select,
  Spinner,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/cn';

/** Что каждая секция делает на витрине — чтобы не пришлось угадывать по названию. */
const kindDescriptions: Record<string, string> = {
  HERO: 'Первый экран: крупный заголовок, подзаголовок и две кнопки. Показывается один раз, самым верхом.',
  CATEGORIES: 'Плитка категорий каталога. Наполняется автоматически — настраиваются только заголовки.',
  BUNDLES: 'Все готовые наборы из каталога. Наполняется автоматически.',
  COLLECTION: 'Выбранная подборка товаров, например «Хиты». Состав задаётся в разделе «Товары».',
  EDITORIAL: 'Текстовый блок на всю ширину: крупный заголовок слева, абзац справа. Для истории бренда.',
  BANNER: 'Полоса-баннер под акцию или объявление.',
  STEPS: 'Пронумерованные шаги «Как это работает» на тёмном фоне.',
  FAQ: 'Раскрывающиеся вопросы и ответы.',
  CONTACTS: 'Заголовок над подвалом с контактами. Сами контакты берутся из «Настроек».',
};

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


/**
 * Повторяемый список двуязычных блоков — шаги «Как это работает» и вопросы FAQ.
 * Раньше это правилось прямо в JSON: одна лишняя запятая ломала секцию,
 * а увидеть структуру можно было только по фигурным скобкам.
 */
const RepeatableList = ({
  label,
  addLabel,
  hint,
  items,
  fields,
  onChange,
}: {
  label: string;
  addLabel: string;
  hint?: string;
  items: Record<string, unknown>[];
  fields: { key: string; label: string; multiline?: boolean }[];
  onChange: (items: Record<string, unknown>[]) => void;
}) => {
  const patch = (index: number, key: string, next: L) =>
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: next } : item)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="label-caps">{label}</span>
        {hint && <p className="mt-0.5 text-2xs text-faint">{hint}</p>}
      </div>

      {items.length === 0 && (
        <p className="rounded-control border border-dashed border-line-strong px-3 py-4 text-center text-2xs text-faint">
          Пока пусто — секция не появится на витрине
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-control border border-line p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded bg-accent-soft text-2xs font-semibold text-ink">
              {index + 1}
            </span>
            <span className="text-2xs text-faint">{label.slice(0, -1).toLowerCase()}</span>

            <div className="ml-auto flex items-center gap-0.5">
              <Button
                size="iconSm"
                variant="ghost"
                aria-label="Выше"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp size={14} />
              </Button>
              <Button
                size="iconSm"
                variant="ghost"
                aria-label="Ниже"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown size={14} />
              </Button>
              <Button
                size="iconSm"
                variant="ghost"
                aria-label="Удалить"
                className="hover:text-danger"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <LocalizedField
                key={field.key}
                label={field.label}
                multiline={field.multiline}
                value={asL(item[field.key])}
                onChange={(next) => patch(index, field.key, next)}
              />
            ))}
          </div>
        </div>
      ))}

      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => onChange([...items, {}])}
      >
        <Plus size={14} /> {addLabel}
      </Button>
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
        <RepeatableList
          label="Шаги"
          addLabel="Добавить шаг"
          hint="Нумерация проставляется сама. Обычно хватает четырёх шагов."
          items={(payload.steps ?? []) as Record<string, unknown>[]}
          onChange={(items) => set('steps', items)}
          fields={[
            { key: 'title', label: 'Заголовок шага' },
            { key: 'text', label: 'Пояснение', multiline: true },
          ]}
        />
      )}

      {section.kind === 'FAQ' && (
        <RepeatableList
          label="Вопросы"
          addLabel="Добавить вопрос"
          hint="Отвечайте на то, что реально спрашивают в переписке: сроки хранения, доставка, оплата."
          items={(payload.items ?? []) as Record<string, unknown>[]}
          onChange={(items) => set('items', items)}
          fields={[
            { key: 'q', label: 'Вопрос' },
            { key: 'a', label: 'Ответ', multiline: true },
          ]}
        />
      )}
    </div>
  );
};

const SortableSection = ({
  section,
  collections,
  onSave,
  onDelete,
  isSaving,
  isSaved,
}: {
  section: HomeSectionRow;
  collections: { slug: string; titleRu: string }[];
  onSave: (payload: Payload, isVisible: boolean) => void;
  onDelete: () => void;
  /** Состояние общей мутации, но только для этой секции */
  isSaving: boolean;
  isSaved: boolean;
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

        <button type="button" onClick={() => setOpen((value) => !value)} className="min-w-0 flex-1 text-left">
          <span className="text-sm font-semibold">{kindLabels[section.kind] ?? section.kind}</span>
          <span className="ml-2 text-2xs text-faint">{open ? 'свернуть' : 'настроить'}</span>
          {!section.isVisible && <span className="ml-2 text-2xs text-warning">скрыта</span>}
          <span className="block truncate text-2xs text-faint">
            {kindDescriptions[section.kind] ?? ''}
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
            <SaveButton
              isPending={isSaving}
              isSuccess={isSaved}
              dirty={dirty}
              label="Сохранить секцию"
              cleanLabel="Секция сохранена"
              onClick={() => onSave(payload, section.isVisible)}
            />
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
                isSaving={save.isPending && save.variables?.id === section.id}
                isSaved={save.isSuccess && save.variables?.id === section.id}
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
