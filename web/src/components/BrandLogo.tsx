import { useId } from 'react';
import Link from 'next/link';

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  /** Use the light mark on a deliberately dark surface, even in light theme. */
  inverse?: boolean;
  className?: string;
};

/**
 * The supplied silver logo is a JPEG: the dark rectangle is baked into its pixels.
 * Cropping alone cannot remove that rectangle. Instead, convert the artwork's
 * luminance into an alpha mask and paint its ORIGINAL lettering/compass/book
 * silhouette with a theme-aware ink. The visible result has no background.
 *
 * The source crop matches the earlier approved brand framing. Unlike linking an
 * image from inside an external SVG file, this inline SVG is permitted to load
 * the original same-origin image in Chrome, Safari and Firefox.
 */
export default function BrandLogo({
  href = '/',
  compact = false,
  inverse = false,
  className = '',
}: BrandLogoProps) {
  const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const filterId = `guide-brand-key-${instance}`;
  const maskId = `guide-brand-mask-${instance}`;
  const width = compact
    ? 'w-[126px] min-[390px]:w-[148px] sm:w-[160px] md:w-[176px]'
    : 'w-[188px] sm:w-[220px] md:w-[245px]';

  return (
    <Link
      href={href}
      aria-label="THE GUIDE — home"
      data-brand-logo
      className={`inline-flex shrink-0 items-center bg-transparent p-0 shadow-none ${width} ${className}`}
    >
      <svg
        viewBox="0 0 1070 375"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="THE GUIDE — Your path to smarter learning"
        className="block h-auto w-full overflow-visible"
        data-brand-image="transparent"
      >
        <defs>
          {/* Make pixels darker than the JPEG backdrop fully transparent.
              Edge pixels remain feathered, preserving the supplied artwork. */}
          <filter id={filterId} colorInterpolationFilters="sRGB" x="-15%" y="-15%" width="130%" height="130%">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.85 0.85 0.85 0 -0.65"
            />
          </filter>
          <mask
            id={maskId}
            x="0"
            y="0"
            width="1070"
            height="375"
            maskUnits="userSpaceOnUse"
            style={{ maskType: 'alpha' }}
          >
            <image
              href="/logos/dark-mode-silver.jfif"
              x="-180"
              y="-160"
              width="1379"
              height="752"
              preserveAspectRatio="none"
              filter={`url(#${filterId})`}
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="1070"
          height="375"
          mask={`url(#${maskId})`}
          className={inverse ? 'fill-[#E8DFCF]' : 'fill-[#151A3A] dark:fill-[#E8DFCF]'}
        />
      </svg>
    </Link>
  );
}
