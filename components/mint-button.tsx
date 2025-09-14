"use client"

import React, { useState } from "react"
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
    setError,
    mintNFT,
    resetMintFlow,
    requestApprovalThenMint,
  } = useMintNFT()

  const formatBalance = (balance: bigint | undefined | null) => {
    if (!balance) return "0"
    // USDC has 6 decimals, so we need to divide by 1e6
    return Number(balance) / 1e6
  }

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet to Mint"
    if (!hasEnoughBalance) return "Insufficient USDC Balance"
    return "Mint NFT"
  }

  const getButtonIcon = () => {
    if (isApproving || isMinting) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (clicked) {
      // show micro-spinner during the click buffer for immediate feedback
      return <Loader2 className="w-4 h-4 animate-spin text-[#191B1C]" />
    }
    if (isApproved && hasEnoughBalance) {
      return <CheckCircle className="w-4 h-4" />
    }
    return <span className="text-lg font-bold">$</span>
  }

  const isButtonDisabled = !isConnected || isApproving || isMinting || (!hasEnoughBalance && isConnected)

  // Show Mint Again button after successful mint
  const showMintAgain = !!mintHash
  const [clicked, setClicked] = useState(false)
  // 0 = none, 1 = approval pending, 2 = mint pending
  const [pendingStep, setPendingStep] = useState<0 | 1 | 2>(0)
  const [autoMintRequested, setAutoMintRequested] = useState(false)

  // When user clicks mint, set a short-lived clicked state to show buffered animation
  const onMintClick = async () => {
    if (isButtonDisabled || clicked) return
    setClicked(true)
    try {
      if (!isApproved) {
        setPendingStep(1)
        setAutoMintRequested(true)
        // Request approval via hook; we'll call mintNFT on approval success
        await requestApprovalThenMint()
      } else {
        setPendingStep(2)
        await mintNFT()
      }
    } catch (err) {
      setPendingStep(0)
      setError(typeof err === "string" ? err : "Action failed. Please try again.")
    } finally {
      setClicked(false)
    }
  }

  // If mint tx has been submitted, ensure pendingStep reflects minting
  React.useEffect(() => {
    if (mintHash) {
      setPendingStep(2)
    }
  }, [mintHash])

  return (
    <div className="space-y-4">
      {/* Transaction Status */}
      {/* Step 1: Approve USDC tokens */}
      <TransactionStatus
        hash={approvalHash}
        pendingTitle={"Approving USDC"}
        pendingSubtitle={"Confirm approval in your wallet"}
        successTitle={"Approval confirmed"}
        successSubtitle={"USDC is approved for minting"}
        onError={() => {
          // leave error handling to hook
          setPendingStep(0)
          setAutoMintRequested(false)
        }}
        onSuccess={async () => {
          // when approval is confirmed, advance to the mint pending UI
          setPendingStep(2)
          if (autoMintRequested) {
            setAutoMintRequested(false)
            // start minting (this should open the wallet popup)
            await mintNFT()
          }
        }}
        // Show pending immediately when pendingStep is 1, or during approval
        forcePending={pendingStep === 1 || isApproving}
      />

      {/* Step 2: Mint the NFT */}
      <TransactionStatus
        hash={mintHash}
        pendingTitle={"Minting NFT"}
        pendingSubtitle={"Mint transaction is being confirmed"}
        successTitle={"Mint successful"}
        successSubtitle={"Your NFT has been minted"}
        onDismiss={() => resetMintFlow()}
        onError={() => {
          // leave error handling to hook
        }}
        // Show pending immediately when pendingStep is 2, or during minting
        forcePending={pendingStep === 2 || isMinting}
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
      {!showMintAgain ? (
        <Button
          onClick={onMintClick}
          disabled={isButtonDisabled || clicked}
          size="lg"
          className={`w-full h-14 text-lg font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${clicked ? "transform scale-95" : ""
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

      {/* Status text for approving/minting */}
      {isApproving && (
        <p className="text-center text-sm text-yellow-500">Approving USDC tokens...</p>
      )}
      {isMinting && (
        <p className="text-center text-sm text-blue-500">Minting NFT...</p>
      )}

      {/* Status Messages */}
      {isConnected && !hasEnoughBalance && (
        <p className="text-center text-sm text-red-400">
          You need at least 0.5 USDC to mint. Get USDC from a faucet or bridge.
        </p>
      )}

      {/* Show NFT link after mint */}
      {mintHash && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-400">
          <div className="flex-1 text-sm">
            <div className="font-medium">🎉 NFT minted!</div>
            <div>
              View transaction on&nbsp;
              <a
                href={`https://sepolia.basescan.org/tx/${mintHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-green-500 hover:text-green-700"
              >
                BaseScan
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
