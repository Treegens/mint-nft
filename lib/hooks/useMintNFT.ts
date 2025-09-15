"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { parseUnits } from "viem"
import USDCTokenABI from "@/lib/abi/USDCToken.json"
import NFTContractABI from "@/lib/abi/NFTContract.json"

// Contract addresses - Base Sepolia testnet for testing
const USDC_TOKEN_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const
const NFT_CONTRACT_ADDRESS = "0x6d636e75F32d408f8225BA7e3E0155B98c359E69" as const
const MINT_PRICE = parseUnits("0.5", 6) // 0.5 USDC (6 decimals)

export function useMintNFT() {
  const { address, isConnected } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvalHashState, setApprovalHashState] = useState<`0x${string}` | undefined>(undefined)
  const [mintHashState, setMintHashState] = useState<`0x${string}` | undefined>(undefined)
  const [minted, setMinted] = useState(false)
  const [autoMintRequested, setAutoMintRequested] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'approved' | 'minting' | 'completed' | 'failed'>('idle')
  const [currentAction, setCurrentAction] = useState<'approve' | 'mint' | null>(null)

  // Helpers
  const getMessage = (e: unknown) => {
    if (typeof e === "object" && e !== null && "message" in e) {
      return String((e as { message?: unknown }).message)
    }
    return String(e)
  }

  const isUserRejectedError = (e: unknown) => {
    const anyErr = e as { code?: unknown; name?: unknown; message?: unknown }
    const code = anyErr?.code
    const name = typeof anyErr?.name === 'string' ? anyErr.name.toLowerCase() : ''
    const msg = typeof anyErr?.message === 'string' ? anyErr.message.toLowerCase() : getMessage(e).toLowerCase()
    return code === 4001 || name.includes('userrejected') || msg.includes('user rejected') || msg.includes('rejected the request')
  }

  // Contract write functions
  const { writeContract: writeContractUSDC, data: approvalTxHash } = useWriteContract()
  const { writeContract: writeContractNFT, data: mintTxHash } = useWriteContract()

  // Persist hashes locally so UI can keep them until user resets
  // When the hook-provided data changes, copy it into local state
  useEffect(() => {
    if (approvalTxHash) setApprovalHashState(approvalTxHash as `0x${string}`)
  }, [approvalTxHash])

  useEffect(() => {
    if (mintTxHash) setMintHashState(mintTxHash as unknown as `0x${string}`)
  }, [mintTxHash])

  // Read user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDCTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read current allowance
  const { data: allowance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: USDCTokenABI,
    functionName: "allowance",
    args: address ? [address, NFT_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read NFT contract info
  const { data: mintPrice } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFTContractABI,
    functionName: "mintPrice",
  })

  const { data: totalSupply } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFTContractABI,
    functionName: "totalSupply",
  })

  const { data: maxSupply } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFTContractABI,
    functionName: "maxSupply",
  })

  // Check if user has enough USDC balance
  const hasEnoughBalance = typeof usdcBalance === "bigint" ? usdcBalance >= MINT_PRICE : false

  // Check if user has approved enough tokens
  const isApproved = typeof allowance === "bigint" ? allowance >= MINT_PRICE : false

  const approveTokens = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return false
    }

    if (!hasEnoughBalance) {
      setError("Insufficient USDC balance. You need at least 0.5 USDC.")
      return false
    }

    try {
      setIsApproving(true)
      setCurrentAction('approve')
      setCurrentStep('approving')
      setError(null)
      await writeContractUSDC({
        address: USDC_TOKEN_ADDRESS,
        abi: USDCTokenABI,
        functionName: "approve",
        args: [NFT_CONTRACT_ADDRESS, MINT_PRICE],
      })
      return true
    } catch (err: unknown) {
      console.error("Approval failed:", err)
      if (isUserRejectedError(err)) {
        setError("You rejected the approval in wallet.")
      } else {
        setError(getMessage(err) || "Failed to approve USDC tokens. Please try again.")
      }
      setCurrentStep('failed')
      setAutoMintRequested(false)
      return false
    } finally {
      setIsApproving(false)
    }
  }, [isConnected, address, hasEnoughBalance, writeContractUSDC])

  // Stable callbacks to avoid changing references in effects
  const approveTokensCb = useCallback(async () => {
    return approveTokens()
  }, [writeContractUSDC, isConnected, address, hasEnoughBalance])

  const mintNFT = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return false
    }

    if (!hasEnoughBalance) {
      setError("Insufficient USDC balance. You need at least 0.5 USDC.")
      return false
    }

    if (!isApproved) {
      setError("Please approve USDC tokens first")
      return false
    }

    try {
      setIsMinting(true)
      setCurrentAction('mint')
      setCurrentStep('minting')
      setError(null)
      await writeContractNFT({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFTContractABI,
        functionName: "mintNFTasUser",
      })
      setMinted(true)
      return true
    } catch (err: unknown) {
      console.error("Minting failed:", err)
      if (isUserRejectedError(err)) {
        setError("You rejected the mint in wallet.")
      } else {
        setError(getMessage(err) || "Failed to mint NFT. Please try again.")
      }
      setCurrentStep('failed')
      return false
    } finally {
      setIsMinting(false)
    }
  }, [isConnected, address, hasEnoughBalance, isApproved, writeContractNFT])

  const mintNFTCb = useCallback(async () => {
    return mintNFT()
  }, [writeContractNFT, isConnected, address, isApproved])

  // Single-click approve and mint flow
  const approveAndMint = useCallback(async () => {
    if (isProcessing) return false
    
    setIsProcessing(true)
    setError(null)
    
    try {
      // If already approved, just mint
      if (isApproved) {
        const success = await mintNFT()
        if (success) {
          setCurrentStep('completed')
        }
        return success
      }
      
      // Otherwise, approve first then mint
      setAutoMintRequested(true)
      const approvalSuccess = await approveTokens()
      if (!approvalSuccess) {
        setAutoMintRequested(false)
        return false
      }
      
      // Don't mint here - let the allowance watcher handle it
      return true
    } catch (err) {
      console.error("Approve and mint failed:", err)
      setError("Transaction failed. Please try again.")
      setCurrentStep('idle')
      setAutoMintRequested(false)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, isApproved, mintNFT, approveTokens])

  // Helper to request approval and automatically mint after approval is confirmed
  const requestApprovalThenMint = useCallback(async () => {
    return approveAndMint()
  }, [approveAndMint])

  const handleMint = async () => {
    if (!isApproved) {
      await approveTokens()
    } else {
      await mintNFT()
    }
  }

  // Watch for approval confirmation and auto-mint
  useEffect(() => {
    if (autoMintRequested && isApproved && !isMinting && !isApproving) {
      setAutoMintRequested(false)
      setCurrentStep('approved')
      
      // Small delay to show approved state, then mint
      const timer = setTimeout(async () => {
        const success = await mintNFT()
        if (success) {
          setCurrentStep('completed')
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [autoMintRequested, isApproved, isMinting, isApproving, mintNFT])

  // Update current step based on transaction hashes
  useEffect(() => {
    if (mintHashState && currentStep !== 'completed') {
      setCurrentStep('completed')
    }
  }, [mintHashState, currentStep])

  return {
    // State
    isConnected,
    isApproving,
    isMinting,
    isProcessing,
    currentStep,
    error,
    approvalHash: approvalHashState,
    mintHash: mintHashState,
    minted,

    // Data
    usdcBalance,
    allowance,
    mintPrice,
    totalSupply,
    maxSupply,
    hasEnoughBalance,
    isApproved,

    // Actions
    approveTokens,
    mintNFT,
    approveAndMint,
    handleMint,
    setError,
    resetMintFlow: () => {
      setMinted(false)
      setError(null)
      setApprovalHashState(undefined)
      setMintHashState(undefined)
      setAutoMintRequested(false)
      setIsProcessing(false)
      setCurrentStep('idle')
    },
    requestApprovalThenMint,
  }
}
