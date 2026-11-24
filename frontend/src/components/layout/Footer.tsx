import type { ComponentType } from 'react';
import { Instagram, Send } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import {
  INSTAGRAM_URL,
  SOCIAL_USERNAME,
  TELEGRAM_URL,
  TIKTOK_URL,
} from '../../lib/links';
import { SaveStatus } from '../common/SaveStatus';

/** Lucide has no brand icons, so TikTok is a compact inline SVG. */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

interface SocialLink {
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
}

/**
 * Bottom-of-page footer.
 *
 * Colours come from semantic tokens (surface / border / primary / accent), so
 * dark mode works without `dark:` branches. Flex + logical spacing follows the
 * document `dir`, so the same markup is correct in English (LTR) and Arabic
 * (RTL); only the @handle is forced LTR.
 */
export function Footer() {
  const { t } = useI18n();

  const socials: SocialLink[] = [
    { label: t('footer.telegram'), href: TELEGRAM_URL, Icon: Send },
    { label: t('footer.tiktok'), href: TIKTOK_URL, Icon: TikTokIcon },
    { label: t('footer.instagram'), href: INSTAGRAM_URL, Icon: Instagram },
  ];

  return (
    <footer className="mt-8 border-t border-border pt-5 text-small text-primary/45">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-legal">{t('app.disclaimer')}</p>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="text-legal font-medium text-primary/60">
            {t('footer.followUs')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface text-primary/70 transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:shadow-focus"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="rounded-sm text-legal text-primary/50 transition hover:text-accent focus-visible:outline-none focus-visible:shadow-focus"
          >
            @{SOCIAL_USERNAME}
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <p className="text-legal text-primary/35">
          {t('app.name')} — {t('footer.madeWith')}
        </p>
        <SaveStatus />
      </div>
    </footer>
  );
}
