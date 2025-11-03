import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ConnectionStatus } from "@/components/connection-status"
import { Toaster } from "sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FoodLang AI - Arabic ↔ English Food Packaging Translator",
  description: "Translate food packaging labels between Arabic and English using AI-powered RAG technology",
  keywords: ["translation", "Arabic", "English", "food packaging", "AI", "OCR"],
  authors: [{ name: "FoodLang AI Team" }],
  creator: "FoodLang AI",
  publisher: "FoodLang AI",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ConnectionStatus />
          <Toaster position="top-right" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
