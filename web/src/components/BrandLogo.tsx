import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export default function BrandLogo({
  href = '/',
  compact = false,
  inverse = false,
  className = '',
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="THE GUIDE"
      className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}
    >
      <img
        src="/logos/the-guide-mark.svg"
        alt=""
        aria-hidden="true"
        className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
      />
      <span className="min-w-0">
        <span
          className={`block whitespace-nowrap text-lg font-extrabold leading-none tracking-[0.07em] sm:text-xl ${
            inverse ? 'text-white' : 'text-[#151A3A] dark:text-white'
          }`}
        >
          THE GUIDE
        </span>
        {!compact && (
          <span
            className={`mt-1 block whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] sm:text-[10px] ${
              inverse ? 'text-slate-200' : 'text-slate-500 dark:text-slate-300'
            }`}
          >
            Your path to smarter learning
          </span>
        )}
      </span>
    </Link>
  );
}
