/** 단순 회색 블록 - 스켈레톤의 기본 단위 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
    />
  );
}

/** 한 줄짜리 텍스트 스켈레톤 */
export function SkeletonText({ className = '' }: { className?: string }) {
  return <SkeletonBlock className={`h-4 rounded ${className}`} />;
}

/** StatCard 스켈레톤 (캐릭터 상세 상단 요약 카드용) */
export function SkeletonStatCard() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
      <SkeletonText className="w-12 mb-2" />
      <SkeletonText className="w-20" />
    </div>
  );
}

/** 테이블 행 스켈레톤 */
export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-4">
          <SkeletonText className={i === 0 ? 'w-24' : 'w-16'} />
        </td>
      ))}
    </tr>
  );
}

/** 카드형 스켈레톤 (스케줄 목록용) */
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-100 dark:border-gray-700">
      <SkeletonText className="w-3/4 mb-3 h-5" />
      <SkeletonText className="w-1/2" />
    </div>
  );
}
