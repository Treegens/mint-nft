"use client"

import { useMintNFT } from "@/lib/hooks/useMintNFT"
import { TransactionStatus } from "@/components/transaction-status"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function MintButton() {
  const {
    isConnected,
    isApproving,
    isMinting,
    error,
    approvalHash,
    mintHash,
    usdcBalance,
    hasEnoughBalance,
    isApproved,
    handleMint,
    setError,
  } = useMintNFT()

  const formatBalance = (balance: bigint | undefined | null) => {
    if (!balance) return "0"
    // USDC has 6 decimals, so we need to divide by 1e6
    return Number(balance) / 1e6
  }

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet to Mint"
    if (!hasEnoughBalance) return "Insufficient USDC Balance"
    if (isApproving) return "Approving USDC..."
    if (isMinting) return "Minting NFT..."
    if (!isApproved) return "Approve USDC & Mint"
    return "Mint NFT"
  }

  const getButtonIcon = () => {
    if (isApproving || isMinting) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (isApproved && hasEnoughBalance) {
      return <CheckCircle className="w-4 h-4" />
    }
    return <span className="text-lg font-bold">$</span>
  }

  const isButtonDisabled = !isConnected || isApproving || isMinting || (!hasEnoughBalance && isConnected)

  return (
    <div className="space-y-4">
      {/* Transaction Status */}
      <TransactionStatus 
        hash={approvalHash} 
        onSuccess={() => {
          // Refresh allowance after successful approval
          window.location.reload()
        }}
      />
      <TransactionStatus 
        hash={mintHash} 
        onSuccess={() => {
          // Refresh balance after successful mint
          window.location.reload()
        }}
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Balance Display */}
      {isConnected && usdcBalance !== undefined && (
        <div className="text-center text-sm text-muted-foreground">
          Your USDC Balance: {formatBalance(usdcBalance as bigint | undefined | null)} USDC
        </div>
      )}

      {/* Mint Button */}
      <Button
        onClick={handleMint}
        disabled={isButtonDisabled}
        size="lg"
        className="w-full h-14 text-lg font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#deeb8b", color: "#191B1C" }}
      >
        <div className="flex items-center gap-3">
          {getButtonIcon()}
          {getButtonText()}
        </div>
      </Button>

      {/* Status Messages */}
      {isConnected && !hasEnoughBalance && (
        <p className="text-center text-sm text-red-400">
          You need at least 0.5 USDC to mint. Get USDC from a faucet or bridge.
        </p>
      )}

      {isApproved && hasEnoughBalance && (
        <p className="text-center text-sm text-green-400">
          ✓ USDC tokens approved. Ready to mint!
        </p>
      )}
    </div>
  )
}
