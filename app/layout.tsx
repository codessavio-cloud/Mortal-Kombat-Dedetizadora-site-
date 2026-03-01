import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ActivityTracker } from "@/components/activity-tracker"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  metadataBase: new URL("https://mortalkombatdedetizadora.com.br"),
  title: "Mortal Kombat - Controle de Pragas Profissional",
  description:
    "Sistema de orcamento para controle de pragas. Calcule o preco do seu tratamento de forma rapida e facil. Servicos especializados em baratas, cupins, escorpioes e muito mais.",
  keywords: ["dedetizacao", "controle de pragas", "orcamento", "baratas", "cupins", "escorpioes", "formiga", "rato"],
  generator: "Next.js",
  applicationName: "Mortal Kombat Controle de Pragas",

  openGraph: {
    title: "Mortal Kombat - Controle de Pragas",
    description: "Calcule o preco do seu tratamento de dedetizacao de forma rapida e profissional.",
    type: "website",
    locale: "pt_BR",
    url: "https://mortalkombatdedetizadora.com.br",
    siteName: "Mortal Kombat Controle de Pragas",
    images: [
      {
        url: "/logo.png",
        width: 400,
        height: 100,
        alt: "Mortal Kombat - Controle de Pragas",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Mortal Kombat - Controle de Pragas",
    description: "Sistema profissional de orcamento para controle de pragas",
    images: ["/logo.png"],
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
              image: "https://mortalkombatdedetizadora.com.br/logo.png",
              url: "https://mortalkombatdedetizadora.com.br",
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
        {children}
        {process.env.NODE_ENV === "production" ? <Analytics /> : null}
      </body>
    </html>
  )
}