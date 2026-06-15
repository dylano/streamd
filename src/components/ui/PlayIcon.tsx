interface PlayIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export function PlayIcon({ size = 24, className, ariaLabel }: PlayIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      className={className}
    >
      <polygon points="8,5 19,12 8,19" fill="currentColor" />
    </svg>
  );
}
