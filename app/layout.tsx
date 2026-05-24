import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/config/wagmi";
import { Providers } from "@/app/providers";
import { activeChain } from "@/config/chains";
import "./globals.css";

const siteUrl = "https://blue-rift.vercel.app";
const title = "Blue Rift | Endless Tunnel";
const description =
  "Pilot a neon craft through an endless 3D tunnel runner with optional self-reported Ink score saves.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Blue Rift",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Blue Rift endless tunnel runner preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
  other: activeChain.name === "Base" ? { "base:app_id": "6a0368520ec9a0da33575316" } : {},
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get("cookie"));

  return (
    <html lang="en">
      <body>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
