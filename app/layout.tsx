import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/react"
import Head from "next/head"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const APP_NAME = "Split // it"
const APP_DEFAULT_TITLE = "Split // it"
const APP_TITLE_TEMPLATE = "%s - Split // it"
const APP_DESCRIPTION = "Split bills with friends. No fuss."

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    images: [
      {
        url: "/og_image.png",
        width: 1200,
        height: 630,
        alt: "Split // it - Split bills with friends",
      },
    ],
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    images: ["/og_image.png"],
    description: APP_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Split // it</title>
        <meta name="description" content="Split bills with friends. No fuss." />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="mask-icon" href="/icons/mask-icon.svg" color="#000000" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-iphone-retina.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-ipad-retina.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://split.kal.lol" />
        <meta name="twitter:title" content="Split // it" />
        <meta name="twitter:description" content="Split bills with friends. No fuss." />
        <meta name="twitter:image" content="/og_image.png" />
        <meta name="twitter:creator" content="@kvithana" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Split // it" />
        <meta property="og:description" content="Split bills with friends. No fuss." />
        <meta property="og:site_name" content="Split // it" />
        <meta property="og:url" content="https://split.kal.lol" />
        <meta property="og:image" content="/og_image.png" />
      </Head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
