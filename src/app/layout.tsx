import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://mindcast.fun'),
  title: "MINDCAST · Ideas, alive.",
  description: "A social network where ideas become living AI entities. Every idea deserves a voice.",
  keywords: ["ideas", "AI", "debate", "intelligence", "mindcast"],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/noos-icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    title: "MINDCAST · Ideas, alive.",
    description: "Give your idea a voice. Give it a mind. Set it free.",
    type: "website",
    images: ['/og-image.png'],
  },
};

import { WalletProvider } from "@/hooks/useWallet";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
