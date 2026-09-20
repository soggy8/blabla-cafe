import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Bla Bla Cafe | Струмица",
    template: "%s | Bla Bla Cafe",
  },
  description:
    "Кафе, добар муабет и вечерна атмосфера на Маршал Тито 146 во Струмица.",
  openGraph: {
    title: "Bla Bla Cafe",
    description: "Не доаѓаш само на кафе.",
    locale: "mk_MK",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mk" className={`${geist.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  );
}
