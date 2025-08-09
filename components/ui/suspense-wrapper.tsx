"use client";

import { Suspense, ReactNode } from 'react';
import Loading from '@/app/loading';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SuspenseWrapper({ 
  children, 
  fallback = <Loading /> 
}: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}
