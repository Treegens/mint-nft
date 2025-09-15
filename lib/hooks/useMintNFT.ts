"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { parseUnits } from "viem"
import TGNTokenABI from "@/lib/abi/TGNToken.json"
import NFTContractABI from "@/lib/abi/NFTContract.json"

// Contract addresses - Base mainnet for production
const TGN_TOKEN_ADDRESS = "0xd75dfa972c6136f1c594fec1945302f885e1ab29" as const
const NFT_CONTRACT_ADDRESS = "0xef8B62026895A09D6A631181008969677b7A5ABB" as const
const MANAGEMENT_CONTRACT_ADDRESS = "0x43576228672F058dE4131A1C0996A920E3B68028" as const
const MINT_PRICE = parseUnits("2000", 18) // 2000 TGN (18 decimals)

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
  const { writeContract: writeContractTGN, data: approvalTxHash } = useWriteContract()
  const { writeContract: writeContractNFT, data: mintTxHash } = useWriteContract()

  // Persist hashes locally so UI can keep them until user resets
  // When the hook-provided data changes, copy it into local state
  useEffect(() => {
    if (approvalTxHash) setApprovalHashState(approvalTxHash as `0x${string}`)
  }, [approvalTxHash])

  useEffect(() => {
    if (mintTxHash) setMintHashState(mintTxHash as unknown as `0x${string}`)
  }, [mintTxHash])

  // Read user's TGN balance
  const { data: tgnBalance } = useReadContract({
    address: TGN_TOKEN_ADDRESS,
    abi: TGNTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Read current allowance
  const { data: allowance } = useReadContract({
    address: TGN_TOKEN_ADDRESS,
    abi: TGNTokenABI,
    functionName: "allowance",
    args: address ? [address, MANAGEMENT_CONTRACT_ADDRESS] : undefined,
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

  // Check if user has enough TGN balance
  const hasEnoughBalance = typeof tgnBalance === "bigint" ? tgnBalance >= MINT_PRICE : false

  // Check if user has approved enough tokens
  const isApproved = typeof allowance === "bigint" ? allowance >= MINT_PRICE : false

  const approveTokens = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return
    }

    if (!hasEnoughBalance) {
      setError("Insufficient TGN balance. You need at least 2000 TGN.")
      return
    }

    try {
      setIsApproving(true)
      setError(null)
      await writeContractTGN({
        address: TGN_TOKEN_ADDRESS,
        abi: TGNTokenABI,
        functionName: "approve",
        args: [MANAGEMENT_CONTRACT_ADDRESS, MINT_PRICE],
      })
    } catch (err: unknown) {
      console.error("Approval failed:", err)
      const getMessage = (e: unknown) => {
        if (typeof e === "object" && e !== null && "message" in e) {
          return String((e as { message?: unknown }).message)
        }
        return String(e)
      }
      setError(getMessage(err) || "Failed to approve TGN tokens. Please try again.")
      // If approval fails, cancel any pending auto-mint request
      setAutoMintRequested(false)
    } finally {
      setIsApproving(false)
    }
  }, [isConnected, address, hasEnoughBalance, writeContractTGN])

  // Stable callbacks to avoid changing references in effects
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
      setError("Insufficient TGN balance. You need at least 2000 TGN.")
      return
    }

    if (!isApproved) {
      setError("Please approve TGN tokens first")
      return
    }

    try {
      setIsMinting(true)
      setError(null)
      await writeContractNFT({
        address: MANAGEMENT_CONTRACT_ADDRESS,
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

  // No extra wrapper needed — use the `mintNFT` callback directly where required

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
    tgnBalance,
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
