import { SkeletonBlock, SkeletonText, SkeletonTableRow } from '@/components/ui/Skeleton';

export default function CharactersLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* 헤더 */}
      <div className="border-b pb-4 mb-6">
        <SkeletonBlock className="h-9 w-56 mb-2" />
      </div>

      {/* 싱크 패널 */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
        <SkeletonText className="w-40 mb-3 h-5" />
        <SkeletonText className="w-72 mb-4" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-64 rounded" />
          <SkeletonBlock className="h-10 w-32 rounded" />
        </div>
      </div>

      {/* 테이블 */}
      <SkeletonText className="w-28 mb-4 h-5" />
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['모험단', '캐릭터명', '서버', '직업', '역할', '명성', 'Damage', 'Buff Power', ''].map((h) => (
                <th key={h} className="px-3 py-3.5 text-left">
                  <SkeletonText className="w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonTableRow key={i} cols={9} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
