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
      return
    }

    if (!hasEnoughBalance) {
      setError("Insufficient USDC balance. You need at least 0.5 USDC.")
      return
    }

    try {
      setIsApproving(true)
      setError(null)
      await writeContractUSDC({
        address: USDC_TOKEN_ADDRESS,
        abi: USDCTokenABI,
        functionName: "approve",
        args: [NFT_CONTRACT_ADDRESS, MINT_PRICE],
      })
    } catch (err: unknown) {
      console.error("Approval failed:", err)
      const getMessage = (e: unknown) => {
        if (typeof e === "object" && e !== null && "message" in e) {
          return String((e as { message?: unknown }).message)
        }
        return String(e)
      }
      setError(getMessage(err) || "Failed to approve USDC tokens. Please try again.")
      // If approval fails, cancel any pending auto-mint request
      setAutoMintRequested(false)
    } finally {
      setIsApproving(false)
    }
  }, [isConnected, address, hasEnoughBalance, writeContractUSDC])

  // Stable callbacks to avoid changing references in effects
  const approveTokensCb = useCallback(async () => {
    return approveTokens()
  }, [writeContractUSDC, isConnected, address, hasEnoughBalance])

  // Helper to request approval and automatically mint after approval is confirmed
  const requestApprovalThenMint = useCallback(async () => {
    setAutoMintRequested(true)
    await approveTokens()
    // do not clear autoMintRequested here - allow the allowance watcher to trigger mint
  }, [approveTokens])

  const mintNFT = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return
    }

    if (!hasEnoughBalance) {
      setError("Insufficient USDC balance. You need at least 0.5 USDC.")
      return
    }

    if (!isApproved) {
      setError("Please approve USDC tokens first")
      return
    }

    try {
      setIsMinting(true)
      setError(null)
      await writeContractNFT({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFTContractABI,
        functionName: "mintNFTasUser",
      })
      setMinted(true)
    } catch (err: unknown) {
      console.error("Minting failed:", err)
      const getMessage = (e: unknown) => {
        if (typeof e === "object" && e !== null && "message" in e) {
          return String((e as { message?: unknown }).message)
        }
        return String(e)
      }
      setError(getMessage(err) || "Failed to mint NFT. Please try again.")
    } finally {
      setIsMinting(false)
    }
  }, [isConnected, address, hasEnoughBalance, isApproved, writeContractNFT])

  const mintNFTCb = useCallback(async () => {
    return mintNFT()
  }, [writeContractNFT, isConnected, address, isApproved])

  const handleMint = async () => {
    if (!isApproved) {
      await approveTokens()
    } else {
      await mintNFT()
    }
  }

  // Watch allowance and when it's sufficient and auto-mint requested, start minting
  useEffect(() => {
    if (autoMintRequested && isApproved && !isMinting) {
      // clear the flag and trigger mint
      setAutoMintRequested(false)
      // fire-and-forget mint (we don't await here to avoid double-awaits upstream)
      mintNFT().catch((err) => console.error("Auto-mint failed:", err))
    }
  }, [autoMintRequested, isApproved, isMinting, mintNFT])

  return {
    // State
    isConnected,
    isApproving,
    isMinting,
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
    handleMint,
    setError,
    resetMintFlow: () => {
      setMinted(false)
      setError(null)
      setApprovalHashState(undefined)
      setMintHashState(undefined)
      setAutoMintRequested(false)
      // Optionally reset other states if needed
    },
    requestApprovalThenMint,
  }
}
