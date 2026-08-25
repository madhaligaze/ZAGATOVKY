import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api, keys } from '@/lib/api';
import { Button, Chip, EmptyState, Panel, Spinner } from '@/components/ui';
import { bytes, dateTime } from '@/lib/format';

export const MediaPage = () => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: keys.media({ page: true }),
    queryFn: () => api.media({ limit: 200 }),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) await api.uploadMedia(file);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Файлы загружены');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: api.deleteMedia,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Файл удалён');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const storageDisabled = data?.storageEnabled === false;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Медиатека</h1>
          <p className="text-2xs text-muted">
            {data ? `${data.total} файлов` : 'Загружаем'} · фото хранятся в Cloudflare R2
          </p>
        </div>

        <Button
          variant="primary"
          disabled={storageDisabled || upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={15} /> {upload.isPending ? 'Загружаем…' : 'Загрузить'}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) upload.mutate(Array.from(event.target.files));
            event.target.value = '';
          }}
        />
      </div>

      {storageDisabled && (
        <p className="flex items-start gap-2 rounded-panel border border-warning/40 bg-warning/10 px-4 py-3 text-2xs text-warning">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          Хранилище не подключено. Заполните R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY и R2_PUBLIC_URL в переменных бэкенда — после этого загрузка
          заработает без изменений в коде.
        </p>
      )}

      <Panel
        className="min-h-64"
        bodyClassName={dragOver ? 'bg-accent-soft transition-colors' : 'transition-colors'}
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            if (event.dataTransfer.files.length && !storageDisabled) {
              upload.mutate(Array.from(event.dataTransfer.files));
            }
          }}
        >
          {isPending ? (
            <Spinner />
          ) : data && data.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {data.items.map((asset) => (
                <figure key={asset.id} className="overflow-hidden rounded-control border border-line">
                  <img src={asset.url} alt="" className="aspect-square w-full object-cover" />
                  <figcaption className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <span className="min-w-0">
                      <span className="block truncate text-2xs" title={asset.originalName ?? ''}>
                        {asset.originalName ?? 'без имени'}
                      </span>
                      <span className="text-2xs text-faint">
                        {asset.width}×{asset.height} · {bytes(asset.bytes)}
                      </span>
                      <span className="block text-2xs text-faint">{dateTime(asset.createdAt)}</span>
                    </span>

                    {asset.usageCount > 0 ? (
                      <Chip tone="accent" title="Используется в товарах">
                        {asset.usageCount}
                      </Chip>
                    ) : (
                      <button
                        type="button"
                        aria-label="Удалить файл"
                        onClick={() => {
                          if (window.confirm('Удалить файл безвозвратно?')) remove.mutate(asset.id);
                        }}
                        className="shrink-0 text-faint transition-colors hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Пока ни одного файла"
              hint="Перетащите фото сюда или нажмите «Загрузить». Файлы можно переиспользовать в разных товарах."
            />
          )}
        </div>
      </Panel>
    </div>
  );
};
