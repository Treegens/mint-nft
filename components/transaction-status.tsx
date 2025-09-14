"use client"

import { useWaitForTransactionReceipt } from "wagmi"
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TransactionStatusProps {
  hash: `0x${string}` | undefined
  onSuccess?: () => void
  onError?: () => void
}

export function TransactionStatus({ hash, onSuccess, onError }: TransactionStatusProps) {
  const { data: receipt, isError, isLoading } = useWaitForTransactionReceipt({
    hash,
  })

  if (!hash) return null

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-400">Transaction Pending</p>
          <p className="text-xs text-blue-300">Waiting for confirmation...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    onError?.()
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
        <XCircle className="w-5 h-5 text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-400">Transaction Failed</p>
          <p className="text-xs text-red-300">Please try again</p>
        </div>
      </div>
    )
  }

  if (receipt) {
    onSuccess?.()
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-400">Transaction Successful!</p>
          <p className="text-xs text-green-300">Your NFT has been minted</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-green-400 border-green-400/20 hover:bg-green-400/10"
          asChild
        >
        <a
          href={`https://sepolia.basescan.org/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          View on BaseScan
          <ExternalLink className="w-3 h-3" />
        </a>
        </Button>
      </div>
    )
  }

  return null
}
