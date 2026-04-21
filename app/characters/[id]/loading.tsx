import { SkeletonBlock, SkeletonText, SkeletonStatCard } from '@/components/ui/Skeleton';

export default function CharacterDetailLoading() {
  return (
    <main className="p-4 md:p-8 max-w-3xl mx-auto min-h-screen">
      {/* 뒤로 버튼 */}
      <SkeletonText className="w-12 mb-4" />

      {/* 캐릭터 헤더 */}
      <div className="border-b pb-3 md:pb-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-5 w-14 rounded-full" />
        </div>
        <SkeletonText className="w-52" />
      </div>

      {/* StatCard 3개 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* 탭 + 콘텐츠 패널 */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl">
        {/* 탭 헤더 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 pt-1 gap-4">
          {['장비 세트', '서약', '주요 스텟', '아바타 & 크리쳐'].map((label) => (
            <div key={label} className="pb-2 pt-1">
              <SkeletonText className="w-16" />
            </div>
          ))}
        </div>

        {/* 탭 콘텐츠: 장비 목록 형태 */}
        <div className="p-4 space-y-4">
          {/* 세트 그룹 */}
          {Array.from({ length: 3 }).map((_, gi) => (
            <div key={gi}>
              <SkeletonText className="w-32 mb-2" />
              <div className="space-y-2">
                {Array.from({ length: gi === 0 ? 5 : gi === 1 ? 4 : 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <SkeletonText className="w-16 shrink-0" />
                    <SkeletonText className="w-10 shrink-0" />
                    <SkeletonText className="flex-1 max-w-xs" />
                    <SkeletonBlock className="w-10 h-5 shrink-0 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
