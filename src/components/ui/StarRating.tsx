import { StarIcon } from "./StarIcon";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  rating: number | null;
  onChange: (rating: number) => void;
}

export function StarRating({ rating, onChange }: StarRatingProps) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={styles.star}
          onClick={() => onChange(i)}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <StarIcon
            filled={rating !== null && i <= rating}
            className={rating !== null && i <= rating ? styles.filled : styles.empty}
          />
        </button>
      ))}
    </div>
  );
}
