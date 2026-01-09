// app/error/page.tsx
'use client';

import Link from 'next/link';
export default function ErrorPage() {
  const errorMessage = '发生未知错误';
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <style jsx global>{`
          ::-webkit-scrollbar {
            display: none;
          }
          html {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">访问错误</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}