'use client';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '14px', borderRadius = '6px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonStatCards() {
  return (
    <div className="stats-row">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="stat-card" style={{ pointerEvents: 'none' }}>
          <Skeleton width="60%" height="11px" className="mb8" />
          <Skeleton width="40%" height="30px" className="mb8" />
          <Skeleton width="70%" height="11px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <table className="tbl">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton width="60%" height="11px" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><Skeleton width={c === 0 ? '70%' : '50%'} height="13px" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <Skeleton width="35%" height="14px" />
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height="13px" />
        ))}
      </div>
    </div>
  );
}
