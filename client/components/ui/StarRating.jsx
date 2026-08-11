"use client";

export default function StarRating({ value = 0, onChange, size = "text-base", readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex gap-0.5 ${size}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          style={{ color: star <= value ? "#FFC93C" : "#D1D5DB" }}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
