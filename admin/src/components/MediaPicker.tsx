import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical, ImagePlus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys, type MediaAsset } from '@/lib/api';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { bytes } from '@/lib/format';
import { cn } from '@/lib/cn';

export type PickedImage = { assetId: string; url: string; altRu?: string | null; altKk?: string | null };

/** Одна миниатюра в списке фото товара: перетаскивается за ручку, снимается крестиком. */
const SortableThumb = ({
  image,
  index,
  onRemove,
}: {
  image: PickedImage;
  index: number;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.assetId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative overflow-hidden rounded-control border border-line bg-raised',
        isDragging && 'z-10 opacity-80',
      )}
    >
      <img src={image.url} alt="" className="aspect-[4/5] w-full object-cover" />

      {index === 0 && (
        <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-2xs font-semibold text-accent-ink">
          Обложка
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-1 py-1">
        <button
          type="button"
          className="cursor-grab text-white/80 hover:text-white active:cursor-grabbing"
          aria-label="Переместить фото"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Убрать фото"
          className="text-white/80 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

type Props = {
  value: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  max?: number;
};

/**
 * Фото товара: загрузка перетаскиванием, выбор из общей медиатеки и порядок показа.
 * Первое фото — обложка карточки на витрине, остальные попадают в галерею.
 */
export const MediaPicker = ({ value, onChange, max = 8 }: Props) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: library, isPending } = useQuery({
    queryKey: keys.media({ picker: true }),
    queryFn: () => api.media({ limit: 120 }),
    enabled: libraryOpen,
  });

  const { data: storageProbe } = useQuery({
    queryKey: keys.media({ probe: true }),
    queryFn: () => api.media({ limit: 1 }),
    staleTime: 5 * 60_000,
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: MediaAsset[] = [];
      for (const file of files) uploaded.push(await api.uploadMedia(file));
      return uploaded;
    },
    onSuccess: (assets) => {
      onChange([
        ...value,
        ...assets.map((asset) => ({ assetId: asset.id, url: asset.url })),
      ].slice(0, max));
      void queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success(assets.length === 1 ? 'Фото загружено' : `Загружено фото: ${assets.length}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = value.findIndex((image) => image.assetId === active.id);
    const to = value.findIndex((image) => image.assetId === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(value, from, to));
  };

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length;
    if (room <= 0) {
      toast.error(`Больше ${max} фото на товар не добавить`);
      return;
    }
    upload.mutate(Array.from(files).slice(0, room));
  };

  const storageDisabled = storageProbe?.storageEnabled === false;

  return (
    <div className="flex flex-col gap-3">
      {storageDisabled && (
        <p className="flex items-start gap-2 rounded-control border border-warning/40 bg-warning/10 px-3 py-2 text-2xs text-warning">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Хранилище фото не подключено: заполните переменные R2_* в окружении бэкенда. Пока фото
          загрузить нельзя — витрина покажет буквенные заглушки.
        </p>
      )}

      {value.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={value.map((image) => image.assetId)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {value.map((image, index) => (
                <SortableThumb
                  key={image.assetId}
                  image={image}
                  index={index}
                  onRemove={() => onChange(value.filter((item) => item.assetId !== image.assetId))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-panel border border-dashed px-4 py-6 text-center transition-colors',
          dragOver ? 'border-accent bg-accent-soft' : 'border-line-strong',
        )}
      >
        <ImagePlus size={20} className="text-faint" />
        <p className="text-2xs text-muted">
          Перетащите фото сюда или выберите файлы. Мы сожмём их и подготовим для витрины.
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            disabled={upload.isPending || storageDisabled}
            onClick={() => inputRef.current?.click()}
            data-testid="upload-photo"
          >
            <Upload size={13} />
            {upload.isPending ? 'Загружаем…' : 'Загрузить'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
            Из медиатеки
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <Dialog.Root open={libraryOpen} onOpenChange={setLibraryOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="panel fixed left-1/2 top-1/2 z-50 flex max-h-[80vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <Dialog.Title className="text-sm font-semibold">Медиатека</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="iconSm" aria-label="Закрыть">
                  <X size={15} />
                </Button>
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto p-4">
              {isPending ? (
                <Spinner />
              ) : library && library.items.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {library.items.map((asset) => {
                    const picked = value.some((image) => image.assetId === asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        disabled={picked}
                        onClick={() => {
                          onChange([...value, { assetId: asset.id, url: asset.url }].slice(0, max));
                          setLibraryOpen(false);
                        }}
                        className={cn(
                          'overflow-hidden rounded-control border text-left transition-colors',
                          picked ? 'border-accent opacity-50' : 'border-line hover:border-accent',
                        )}
                      >
                        <img src={asset.url} alt="" className="aspect-square w-full object-cover" />
                        <span className="block truncate px-1.5 py-1 text-2xs text-faint">
                          {bytes(asset.bytes)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Медиатека пуста"
                  hint="Загрузите первое фото — оно станет доступно всем товарам"
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
