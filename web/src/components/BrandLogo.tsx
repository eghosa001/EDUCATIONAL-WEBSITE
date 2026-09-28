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
  const size = compact ? 'h-10 w-[158px] sm:h-11 sm:w-[174px]' : 'h-12 w-[210px] sm:h-14 sm:w-[245px]';
  return (
    <Link href={href} aria-label="THE GUIDE" className={`inline-flex shrink-0 items-center ${className}`}>
      <span className={`block overflow-visible ${size}`}>
        {inverse ? (
          <img
            src="/logos/brand-dark.svg"
            alt="THE GUIDE — Your path to smarter learning"
            className="h-full w-full object-contain object-left"
          />
        ) : (
          <>
            <img
              src="/logos/brand-light.svg"
              alt="THE GUIDE — Your path to smarter learning"
              className="h-full w-full object-contain object-left dark:hidden"
            />
            <img
              src="/logos/brand-dark.svg"
              alt="THE GUIDE — Your path to smarter learning"
              className="hidden h-full w-full object-contain object-left dark:block"
            />
          </>
        )}
      </span>
    </Link>
  );
}
