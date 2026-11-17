import { useId } from 'react';

interface CafeCostLogoProps {
  className?: string;
  title?: string;
}

/**
 * Platform-owned CaféCost brand mark.
 *
 * The logo is a fixed asset of the application, never part of the user's
 * workspace data. It is intentionally not editable through the calculator.
 */
export function CafeCostLogo({ className, title = 'CaféCost' }: CafeCostLogoProps) {
  const titleId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-labelledby={titleId}
      className={className}
    >
      <title id={titleId}>{title}</title>
      <rect width="64" height="64" rx="14" fill="#0F172A" />
      <path
        d="M18 22h22v14a10 10 0 0 1-10 10h-2a10 10 0 0 1-10-10V22Z"
        fill="#FFFFFF"
      />
      <path
        d="M40 25h4a6 6 0 0 1 0 12h-4"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 16c0 2-2 3-2 5M30 16c0 2-2 3-2 5M36 16c0 2-2 3-2 5"
        fill="none"
        stroke="#93C5FD"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="29" cy="33" r="3" fill="#2563EB" />
    </svg>
  );
}
