import type React from "react"
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { headers } from "next/headers"
import ContextProvider from "@/context"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "600"],
})

export const metadata: Metadata = {
  title: "Treegens DAO - Mint Your Dynamic NFT Agent",
  description: "The most dynamic NFT ever made. Comes alive as an AI Agent to GROW the Treegens movement.",
  generator: "v0.app",
}

// ATTENTION!!! RootLayout must be an async function to use headers() 
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Retrieve cookies from request headers on the server
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className={`font-sans ${outfit.variable}`}>
        <ContextProvider cookies={cookies}>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </ContextProvider>
      </body>
    </html>
  )
}
