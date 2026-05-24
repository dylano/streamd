const STAR_POINTS =
  "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26";

interface StarIconProps {
  size?: number;
  filled?: boolean;
  className?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export function StarIcon({ size = 24, filled = true, className, ariaLabel, children }: StarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      className={className}
    >
      {filled ? (
        <polygon points={STAR_POINTS} fill="currentColor" />
      ) : (
        <polygon
          points={STAR_POINTS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {children}
    </svg>
  );
}
