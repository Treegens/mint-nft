"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function ConnectWalletButton() {
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = () => {
    // Placeholder for wallet connection logic
    setIsConnected(!isConnected)
  }

  return (
    <Button
      onClick={handleConnect}
      variant="outline"
      className="flex items-center gap-2 h-12 px-6 transition-all duration-200 bg-transparent"
      style={{
        borderColor: "#deeb8b",
        color: "#deeb8b",
        backgroundColor: "transparent",
      }}
    >
      <Wallet className="w-4 h-4" />
      {isConnected ? "Wallet Connected" : "Connect Wallet"}
    </Button>
  )
}
