import './globals.css';
import ClientLayout from './client-layout';

export const metadata = {
  title: 'Insightra - Prediction Markets',
  description: 'Decentralized prediction markets on Kasplex',
    generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white min-h-screen font-sleek">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
