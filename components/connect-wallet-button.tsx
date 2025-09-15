"use client"

import React from "react"
import { Wallet } from "lucide-react"

export function ConnectWalletButton() {
  // When our custom button is clicked we forward the click to the underlying
  // `appkit-button` element (if present) so the existing AppKit connect flow
  // is used. This lets us fully control visuals while preserving behavior.
  const handleClick = () => {
    const el = document.querySelector("appkit-button") as HTMLElement | null
    if (el) {
      // Forward a real click to trigger the webcomponent's native behavior
      el.click()
    }
  }

  return (
    <div className="appkit-button-wrapper">
      <button
        onClick={handleClick}
        aria-label="Connect Wallet"
        className={
          "inline-flex items-center gap-3 px-4 h-12 rounded-lg border border-[#deeb8b] text-[#deeb8b] bg-[rgba(25,27,28,0.25)] backdrop-blur-sm hover:shadow-neon-hover transition-all duration-150"
        }
        style={{ boxShadow: "0 0 0 1px rgba(222,235,139,0.03) inset" }}
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-sm bg-[rgba(222,235,139,0.06)]">
          <Wallet className="w-4 h-4" />
        </span>
        <span className="font-medium">Connect Wallet</span>
      </button>
    </div>
  )
}
