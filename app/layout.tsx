import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BusinessJsonLd } from "@/components/business-json-ld";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const description =
  "Кафе, сокови, коктели и добар муабет на Маршал Тито 146 во Струмица. Отворено секој ден од 08:00 до 01:00.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Bla Bla Cafe | Струмица",
    template: "%s | Bla Bla Cafe",
  },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bla Bla Cafe | Струмица",
    description,
    siteName: "Bla Bla Cafe",
    locale: "mk_MK",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#15120f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mk"
      className={`${geist.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body>
        <BusinessJsonLd />
        {children}
      </body>
    </html>
  );
}
