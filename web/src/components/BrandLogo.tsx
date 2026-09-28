import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

const lightCrop = 'absolute left-[-40.65%] top-[-73.33%] h-[250.67%] w-[177.94%] max-w-none select-none';
const darkCrop = 'absolute left-[-16.82%] top-[-42.67%] h-[200.53%] w-[128.88%] max-w-none select-none';

export default function BrandLogo({
  href = '/',
  compact = false,
  inverse = false,
  className = '',
}: BrandLogoProps) {
  const width = compact ? 'w-[138px] sm:w-[160px] md:w-[176px]' : 'w-[190px] sm:w-[220px] md:w-[245px]';
  return (
    <Link
      href={href}
      aria-label="THE GUIDE"
      data-brand-logo
      className={`inline-flex shrink-0 items-center ${width} ${className}`}
    >
      {inverse ? (
        <span className="relative block w-full overflow-hidden aspect-[1070/375]">
          <img
            src="/logos/dark-mode-silver.jfif"
            alt="THE GUIDE — Your path to smarter learning"
            data-brand-image="dark"
            loading="eager"
            decoding="async"
            draggable={false}
            className={darkCrop}
          />
        </span>
      ) : (
        <>
          <span className="relative block w-full overflow-hidden aspect-[775/300] dark:hidden">
            <img
              src="/logos/primary-logo.jfif"
              alt="THE GUIDE — Your path to smarter learning"
              data-brand-image="light"
              loading="eager"
              decoding="async"
              draggable={false}
              className={lightCrop}
            />
          </span>
          <span className="relative hidden w-full overflow-hidden aspect-[1070/375] dark:block">
            <img
              src="/logos/dark-mode-silver.jfif"
              alt="THE GUIDE — Your path to smarter learning"
              data-brand-image="dark"
              loading="eager"
              decoding="async"
              draggable={false}
              className={darkCrop}
            />
          </span>
        </>
      )}
    </Link>
  );
}
