import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ActivityTracker } from "@/components/activity-tracker"
import { SessionSync } from "@/components/auth/session-sync"
import { AssetRecovery } from "@/components/runtime/asset-recovery"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
    : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : null) ||
  "https://mortal-kombat-dedetizadora-site.vercel.app"

const siteOrigin = siteUrl.replace(/\/+$/, "")

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "Mortal Kombat - Controle de Pragas Profissional",
  description:
    "Sistema de orcamento para controle de pragas. Calcule o preco do seu tratamento de forma rapida e facil. Servicos especializados em baratas, cupins, escorpioes e muito mais.",
  keywords: ["dedetizacao", "controle de pragas", "orcamento", "baratas", "cupins", "escorpioes", "formiga", "rato"],
  generator: "Next.js",
  applicationName: "Mortal Kombat Controle de Pragas",
  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Mortal Kombat Dedetizadora - Orcamento Rapido",
    description: "Controle de pragas em Uberlandia. Orcamento rapido e atendimento profissional.",
    type: "website",
    locale: "pt_BR",
    url: siteOrigin,
    siteName: "Mortal Kombat Dedetizadora",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Mortal Kombat Dedetizadora - Orcamento Rapido",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mortal Kombat Dedetizadora - Orcamento Rapido",
    description: "Controle de pragas em Uberlandia com atendimento profissional.",
    images: ["/twitter-image"],
  },

  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Mortal Kombat - Controle de Pragas",
              description: "Servico profissional de dedetizacao e controle de pragas",
              image: `${siteOrigin}/opengraph-image`,
              url: siteOrigin,
              telephone: "+55-XX-XXXXX-XXXX",
              address: {
                "@type": "PostalAddress",
                addressCountry: "BR",
                addressLocality: "Sao Paulo",
              },
              areaServed: "BR",
              serviceType: ["Controle de Pragas", "Dedetizacao", "Desinsetizacao"],
            }),
          }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ActivityTracker />
        <SessionSync />
        <AssetRecovery />
        {children}
      </body>
    </html>
  )
}
