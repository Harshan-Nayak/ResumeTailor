import React, { Suspense } from 'react';
import TailorPageClient from './TailorPageClient';

export default function TailorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TailorPageClient />
    </Suspense>
  );
}