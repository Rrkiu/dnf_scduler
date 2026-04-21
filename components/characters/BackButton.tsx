'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BackButtonProps {
  fallback?: string;
  label?: string;
}

/**
 * 이전 페이지로 돌아가는 Back 버튼.
 * - 이전 페이지가 같은 도메인(Next.js 내부)이면 router.back()
 * - 직접 URL 접속 등으로 내부 히스토리가 없으면 fallback 경로로 이동
 */
export default function BackButton({ fallback = '/characters', label = '← 캐릭터 목록' }: BackButtonProps) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // document.referrer: 직전에 방문한 페이지 URL
    // 같은 도메인(또는 same-origin)에서 왔을 때만 router.back() 가능
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerOrigin = new URL(referrer).origin;
        const currentOrigin = window.location.origin;
        if (referrerOrigin === currentOrigin) {
          setCanGoBack(true);
        }
      } catch {
        // URL 파싱 실패 시 fallback 사용
      }
    }
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  // canGoBack 상태에 따라 label을 동적으로 결정하면 hydration mismatch 우려가 있으므로
  // prop으로 받은 label을 항상 사용하고, navigate 방식만 동적으로 처리
  return (
    <button
      onClick={handleBack}
      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
    >
      {label}
    </button>
  );
}
