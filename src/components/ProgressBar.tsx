export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-fill ${value >= 100 ? "done" : ""}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}
