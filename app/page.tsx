"use client"

import { AnimatedCharacter } from "@/components/animated-character"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { MintButton } from "@/components/mint-button"
import { AudioPlayer } from "@/components/audio-player"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ExternalLink, Zap } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setHeaderVisible(currentScrollY < 100)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/20 transition-transform duration-300 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <a href="https://treegens.org" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/treegens-logo.png"
                alt="Treegens DAO"
                width={200}
                height={60}
                className="h-12 w-auto"
              />
            </a>
          </div>

          <ConnectWalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 pt-32 relative">
        <div className="max-w-2xl mx-auto text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h2 className="text-5xl font-semibold text-balance" style={{ color: "#deeb8b" }}>
              {"Mint Your Dynamic NFT Agent"}
            </h2>
            <p className="text-xl font-semibold text-muted-foreground text-pretty leading-relaxed">
              {
                "The most dynamic NFT ever made. Comes alive as an AI Agent to GROW the Treegens movement. Rewarding holders through streamed SocialFi."
              }
            </p>
          </div>

          {/* Animated Character */}
          <div className="py-8 relative z-30">
            <div className="relative flex items-center justify-center">
              {/* Left Image */}
              <div
                className="absolute left-[-175px] top-1/2 transform -translate-y-1/2 z-10"
                style={{
                  transform: `translateY(calc(-50% + 25px)) translateX(${-scrollY * 0.3}px)`,
                }}
              >
                <Image
                  src="/images/treegen-parallax-1.png"
                  alt="Treegen Left"
                  width={250}
                  height={250}
                  className="w-[250px] h-[250px] object-contain"
                />
              </div>

              {/* Main Animated Character */}
              <div className="relative z-20">
                <AnimatedCharacter />
              </div>

              {/* Right Image */}
              <div
                className="absolute right-[-175px] top-1/2 transform -translate-y-1/2 z-10"
                style={{
                  transform: `translateY(calc(-50% + 25px)) translateX(${scrollY * 0.3}px)`,
                }}
              >
                <Image
                  src="/images/treegen-right.png"
                  alt="Treegen Right"
                  width={250}
                  height={250}
                  className="w-[250px] h-[250px] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Minting Section */}
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-2 border-primary/20">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-card-foreground">
                  {"Mint While You Can (Only 1,000 Supply)"}
                </h3>
                <p className="text-muted-foreground">
                  {"Each Treegen is unique and comes with AI agent capabilities and DAO governance rights. (2000 TGN)"}
                </p>
              </div>

              <MintButton />

              {/* Token Purchase Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{"Need TGN tokens?"}</p>

                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 transition-all duration-200 bg-transparent"
                    style={{ backgroundColor: "#deeb8b", color: "#191B1C", borderColor: "#deeb8b" }}
                    asChild
                  >
                    <a
                      href="https://app.uniswap.org/explore/tokens/base/0xd75dfa972c6136f1c594fec1945302f885e1ab29"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      {"Buy TGN on Uniswap (USDC or ETH on Base)"}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 transition-all duration-200 bg-transparent"
                    style={{ backgroundColor: "#deeb8b", color: "#191B1C", borderColor: "#deeb8b" }}
                    asChild
                  >
                    <a
                      href="https://www.relay.link/bridge/base?toCurrency=0xd75dfa972c6136f1c594fec1945302f885e1ab29&showChart=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      {"Buy TGN with any Token on Any Chain"}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#d7e66a]/20 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-[#d7e66a] fill-[#d7e66a]" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">{"Most Dynamic Ever"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {
                  "Visually levels up as you Fund Trees, Plant Trees & Stake TGN. Fund trees by retiring MGRO (tokenised mangroves). Plant trees by earning MGRO for planting mangroves. Stake TGN to earn multiple tokens & evolve your Treegen character."
                }
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#d7e66a]/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#d7e66a] fill-[#d7e66a]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H9L3 7V9C3 10.1 3.9 11 5 11V16.5C5 17.3 5.7 18 6.5 18S8 17.3 8 16.5V13H16V16.5C16 17.3 16.7 18 17.5 18S19 17.3 19 16.5V11C20.1 11 21 10.1 21 9ZM16 7V9H8V7H16Z" />
                  {/* Eyes */}
                  <circle cx="10" cy="8" r="0.8" fill="#191B1C" />
                  <circle cx="14" cy="8" r="0.8" fill="#191B1C" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-foreground">{"AI Agent KOL"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {
                  "Through Xiral collaboration, each Treegen NFT can make memes, threads, videos & mimic KOLs. Continually improving & becoming more & more influential as we move towards an AGI / ASI future."
                }
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#d7e66a]/20 rounded-full flex items-center justify-center mx-auto">
                <Image src="/images/tgn-token.png" alt="TGN Token" width={32} height={32} className="rounded-full" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">{"Streamed Rewards"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {
                  "On the PollinFi platform (coming soon) anyone promoting $TGN will earn every single second, based on real engagement. Since your Treegen can shill the DAO constantly, you will earn $TGN while you sleep."
                }
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <AudioPlayer />
      </div>
    </div>
  )
}
