"use client";

import dynamic from 'next/dynamic';

const ClientWrapper = dynamic(
  () => import('./components/ClientWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Football Squares</h1>
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Loading...</h2>
          </div>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return <ClientWrapper />;
}
