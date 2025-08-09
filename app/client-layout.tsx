'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import BackgroundPaths from '@/components/ui/background-paths';
import Navigation from '@/components/navigation';
import Loading from './loading';
import '@rainbow-me/rainbowkit/styles.css';
import { Suspense } from 'react';

const queryClient = new QueryClient();

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#49EACB',
            accentColorForeground: 'black',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <BackgroundPaths />
          <div className="relative z-10 min-h-screen">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Suspense fallback={<Loading />}>
                {children}
              </Suspense>
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
