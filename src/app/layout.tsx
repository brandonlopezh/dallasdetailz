import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dallasdetailz.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Dallas Detailz — Mobile Detailing in DFW | We Come to You",
    template: "%s | Dallas Detailz",
  },
  description:
    "Mobile auto detailing across Duncanville, Dallas & DFW. We come to you — exterior, interior, and full details for trucks, SUVs, and more. Book online in under 90 seconds.",
  keywords: [
    "mobile detailing Dallas",
    "car detailing Duncanville",
    "DFW auto detailing",
    "mobile car wash Dallas",
    "truck detailing",
  ],
  openGraph: {
    title: "Dallas Detailz — We come to you. DFW mobile detailing.",
    description:
      "Exterior, interior, and full details across DFW. Book online in under 90 seconds.",
    url: SITE_URL,
    siteName: "Dallas Detailz",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">
        {children}
      </body>
    </html>
  );
}
