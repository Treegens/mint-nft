"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useReadContract } from "wagmi"
import { parseUnits } from "viem"
import USDCTokenABI from "@/lib/abi/USDCToken.json"
import NFTContractABI from "@/lib/abi/NFTContract.json"

// Contract addresses - Base Sepolia testnet for testing
const USDC_TOKEN_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const
const NFT_CONTRACT_ADDRESS = "0x0f6fd7483C9ED740e6bc0a203059001c2907D0Db" as const
const MINT_PRICE = parseUnits("0.5", 6) // 0.5 USDC (6 decimals)

export function useMintNFT() {
  const { address, isConnected } = useAccount()
  const [isApproving, setIsApproving] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contract write functions
  const { writeContract: writeContractUSDC, data: approvalTxHash } = useWriteContract()
  const { writeContract: writeContractNFT, data: mintTxHash } = useWriteContract()

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

  const approveTokens = async () => {
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

      writeContractUSDC({
        address: USDC_TOKEN_ADDRESS,
        abi: USDCTokenABI,
        functionName: "approve",
        args: [NFT_CONTRACT_ADDRESS, MINT_PRICE],
      })
    } catch (err) {
      console.error("Approval failed:", err)
      setError("Failed to approve USDC tokens. Please try again.")
    } finally {
      setIsApproving(false)
    }
  }

  const mintNFT = async () => {
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

      writeContractNFT({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFTContractABI,
        functionName: "mintNFTasUser",
      })
    } catch (err) {
      console.error("Minting failed:", err)
      setError("Failed to mint NFT. Please try again.")
    } finally {
      setIsMinting(false)
    }
  }

  const handleMint = async () => {
    if (!isApproved) {
      await approveTokens()
    } else {
      await mintNFT()
    }
  }

  return {
    // State
    isConnected,
    isApproving,
    isMinting,
    error,
    approvalHash: approvalTxHash,
    mintHash: mintTxHash,
    
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
  }
}
