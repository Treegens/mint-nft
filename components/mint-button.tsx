"use client"

import React, { useState } from "react"
import { useMintNFT } from "@/lib/hooks/useMintNFT"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

export function MintButton() {
  const {
    isConnected,
    isApproving,
    isMinting,
    isProcessing,
    currentStep,
    error,
    approvalHash,
    mintHash,
    usdcBalance,
    hasEnoughBalance,
    isApproved,
    setError,
    mintNFT,
    resetMintFlow,
    approveAndMint,
  } = useMintNFT()

  const [clicked, setClicked] = useState(false)

  const formatBalance = (balance: bigint | undefined | null) => {
    if (!balance) return "0"
    // USDC has 6 decimals, so we need to divide by 1e6
    return Number(balance) / 1e6
  }

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet to Mint"
    if (!hasEnoughBalance) return "Insufficient USDC Balance"
    
    if (isProcessing || isApproving || isMinting) {
      switch (currentStep) {
        case 'approving':
          return "Approving USDC..."
        case 'approved':
          return "Approved! Preparing mint..."
        case 'minting':
          return "Minting NFT..."
        default:
          return "Processing..."
      }
    }
    
    if (isApproved) {
      return "Mint NFT"
    }
    
    return "Approve & Mint NFT"
  }

  const getButtonIcon = () => {
    if (isProcessing || isApproving || isMinting || clicked) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    
    if (currentStep === 'approved') {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    
    if (currentStep === 'completed' || (isApproved && hasEnoughBalance)) {
      return <CheckCircle className="w-4 h-4" />
    }
    
    return <span className="text-lg font-bold">$</span>
  }

  const isButtonDisabled = !isConnected || isProcessing || isApproving || isMinting || (!hasEnoughBalance && isConnected) || clicked

  // Show Mint Again button after successful mint
  const showMintAgain = !!mintHash

  // When user clicks mint, set a short-lived clicked state to show buffered animation
  const onMintClick = async () => {
    if (isButtonDisabled || clicked) return
    
    setClicked(true)
    setError(null)
    
    try {
      if (!isApproved) {
        // Use the new single-click approve and mint flow
        await approveAndMint()
      } else {
        // Just mint if already approved
        await mintNFT()
      }
    } catch (err) {
      console.error('Mint click error:', err)
      setError(typeof err === "string" ? err : "Action failed. Please try again.")
    } finally {
      // Clear clicked state after a short delay for better UX
      setTimeout(() => setClicked(false), 300)
    }
  }

  // Get current status for display
  const getStatusDisplay = () => {
    if (currentStep === 'approving' || isApproving) {
      return { title: "Approving USDC", subtitle: "Confirm approval in your wallet", type: "pending" as const }
    }
    if (currentStep === 'approved') {
      return { title: "Approval Confirmed", subtitle: "Preparing to mint NFT...", type: "success" as const }
    }
    if (currentStep === 'minting' || isMinting) {
      return { title: "Minting NFT", subtitle: "Confirm mint transaction in your wallet", type: "pending" as const }
    }
    if (currentStep === 'failed') {
      return { title: "Transaction Cancelled", subtitle: error ?? "You rejected the request or it failed.", type: "failed" as const }
    }
    if (currentStep === 'completed' && mintHash) {
      return { title: "NFT Minted Successfully!", subtitle: "Your NFT has been minted", type: "success" as const }
    }
    return null
  }
  
  const statusDisplay = getStatusDisplay()

  return (
    <div className="space-y-4">
      {/* Unified Transaction Status */}
      {statusDisplay && (
        <div className={`flex items-center gap-3 p-4 rounded-md border ${
          statusDisplay.type === 'pending' 
            ? 'bg-blue-500/10 border-blue-500/20' 
            : statusDisplay.type === 'failed'
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-green-500/10 border-green-500/20'
        }`}>
          {statusDisplay.type === 'pending' ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          ) : statusDisplay.type === 'failed' ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              statusDisplay.type === 'pending' ? 'text-blue-400' : statusDisplay.type === 'failed' ? 'text-red-400' : 'text-green-400'
            }`}>
              {statusDisplay.title}
            </p>
            <p className={`text-xs ${
              statusDisplay.type === 'pending' ? 'text-blue-300' : statusDisplay.type === 'failed' ? 'text-red-300' : 'text-green-300'
            }`}>
              {statusDisplay.subtitle}
            </p>
          </div>
          {currentStep === 'completed' && mintHash && (
            <Button
              size="sm"
              variant="outline"
              className="text-green-400 border-green-400/20 hover:bg-green-400/10"
              asChild
            >
              <a
                href={`https://sepolia.basescan.org/tx/${mintHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View Transaction
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      )}

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
      {!showMintAgain ? (
        <Button
          onClick={onMintClick}
          disabled={isButtonDisabled}
          size="lg"
          className={`w-full h-14 text-lg font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            clicked ? "transform scale-95" : ""
          }`}
          style={{ backgroundColor: "#deeb8b", color: "#191B1C" }}
        >
          <div className="flex items-center gap-3">
            {getButtonIcon()}
            {getButtonText()}
          </div>
        </Button>
      ) : (
        <Button
          onClick={resetMintFlow}
          size="lg"
          className="w-full h-14 text-lg font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: "#deeb8b", color: "#191B1C" }}
        >
          Mint Again
        </Button>
      )}

      {/* Additional status indicators */}
      {clicked && !statusDisplay && (
        <p className="text-center text-sm text-blue-400">Initiating transaction...</p>
      )}

      {/* Status Messages */}
      {isConnected && !hasEnoughBalance && (
        <p className="text-center text-sm text-red-400">
          You need at least 0.5 USDC to mint. Get USDC from a faucet or bridge.
        </p>
      )}

      {/* Success celebration - only show if completed and not showing status above */}
      {currentStep === 'completed' && mintHash && !statusDisplay && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-400">
          <div className="flex-1 text-sm">
            <div className="font-medium">🎉 NFT minted successfully!</div>
            <div>
              <a
                href={`https://sepolia.basescan.org/tx/${mintHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-green-500 hover:text-green-700"
              >
                View on BaseScan
              </a>
            </div>
          </div>
          <button
            onClick={() => resetMintFlow()}
            className="text-green-400 hover:text-green-300"
            aria-label="Dismiss minted message and mint again"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}