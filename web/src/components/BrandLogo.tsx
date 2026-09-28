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
  const frame = compact
    ? 'h-11 w-[180px] sm:h-12 sm:w-[205px]'
    : 'h-14 w-[225px] sm:h-16 sm:w-[260px]';

  return (
    <Link
      href={href}
      aria-label="THE GUIDE — Your path to smarter learning"
      className={`relative block shrink-0 overflow-hidden ${frame} ${className}`}
    >
      {inverse ? (
        <img
          src="/logos/dark-mode-silver.jfif"
          alt="THE GUIDE — Your path to smarter learning"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <>
          <img
            src="/logos/primary-logo.jfif"
            alt="THE GUIDE — Your path to smarter learning"
            className="absolute inset-0 h-full w-full object-cover object-center dark:hidden"
          />
          <img
            src="/logos/dark-mode-silver.jfif"
            alt="THE GUIDE — Your path to smarter learning"
            className="absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
          />
        </>
      )}
    </Link>
  );
}
