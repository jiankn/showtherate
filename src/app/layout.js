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
  title: "ShowTheRate | Mortgage Comparison Tool with Auto Property Data & AI Scripts",
  description: "Generate mortgage comparisons in 60 seconds. Auto-fill property tax, HOA & home values via RentCast. Get AI-powered closing scripts. Share instantly with clients.",
  keywords: ["mortgage calculator", "loan officer tools", "mortgage comparison", "property tax lookup", "AI mortgage scripts", "RentCast integration", "HOA lookup", "real estate", "FHA loan", "VA loan"],
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
    title: "ShowTheRate | Auto-Fill Property Data + AI Closing Scripts",
    description: "Generate mortgage comparisons in 60 seconds. Auto-fill tax, HOA & values. AI-powered scripts. One-click share.",
    url: "https://showtherate.com",
    siteName: "ShowTheRate",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShowTheRate - Auto-fill property data, AI scripts, 60-second comparisons',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShowTheRate | Auto-Fill Property Data + AI Closing Scripts",
    description: "Generate mortgage comparisons in 60 seconds. Auto-fill tax, HOA & values. AI-powered scripts.",
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

