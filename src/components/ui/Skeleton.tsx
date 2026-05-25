interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function Skeleton({ lines = 1, className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton-stack ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <span className="skeleton-line" key={index} />
      ))}
    </div>
  );
}
