import { Button } from './Button';
import { useLocale } from '@/hooks/useLocale';

type Props = {
  isError?: boolean;
  onRetry?: () => void;
  title?: string;
  hint?: string;
};

/**
 * Единое состояние «грузим / не получилось» на всю высоту экрана.
 * Держит вертикальный ритм страницы, чтобы шапка и подвал не прыгали.
 */
export const PageState = ({ isError, onRetry, title, hint }: Props) => {
  const { t } = useLocale();

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="h-px w-10 bg-honey" />
        <p className="font-editorial text-heading-sm">
          {title ?? (isError ? t('common.error') : t('common.loading'))}
        </p>
        {hint && <p className="max-w-sm text-body-sm text-stone">{hint}</p>}
        {isError && onRetry && (
          <Button onClick={onRetry} className="mt-2">
            {t('common.retry')}
          </Button>
        )}
      </div>
    </div>
  );
};
