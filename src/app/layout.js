import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "ShowTheRate | 60-Second Mortgage Comparison for Loan Officers",
  description: "Generate professional mortgage comparison reports in 60 seconds. Share instantly via link. AI-powered closing scripts included. Perfect for Loan Officers.",
  keywords: ["mortgage calculator", "loan officer tools", "mortgage comparison", "real estate", "FHA loan", "VA loan"],
  authors: [{ name: "ShowTheRate" }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "ShowTheRate | 60-Second Mortgage Comparison",
    description: "Generate professional mortgage comparison reports in 60 seconds. Perfect for Loan Officers.",
    url: "https://showtherate.com",
    siteName: "ShowTheRate",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShowTheRate - Compare. Fast.',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowTheRate | 60-Second Mortgage Comparison",
    description: "Generate professional mortgage comparison reports in 60 seconds.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

