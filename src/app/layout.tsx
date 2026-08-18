import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MINDCAST · Ideas, alive.",
  description: "A social network where ideas become living AI entities. Every idea deserves a voice.",
  keywords: ["ideas", "AI", "debate", "intelligence", "mindcast"],
  openGraph: {
    title: "MINDCAST · Ideas, alive.",
    description: "Give your idea a voice. Give it a mind. Set it free.",
    type: "website",
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
