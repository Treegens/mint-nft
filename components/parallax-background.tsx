"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const leftTransform = -350 - scrollY * 0.3
  const rightTransform = 350 + scrollY * 0.3
  const opacity = Math.max(0, 1 - scrollY * 0.003)

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 transform -translate-y-1/2 transition-all duration-300"
        style={{
          transform: `translateY(-50%) translateX(${leftTransform}px)`,
          opacity: opacity,
          zIndex: 1,
        }}
      >
        <Image
          src="/images/treegen-parallax-1.png"
          alt="Treegen Background"
          width={500}
          height={500}
          className="object-contain"
        />
      </div>

      <div
        className="absolute top-1/2 left-1/2 transform -translate-y-1/2 transition-all duration-300"
        style={{
          transform: `translateY(-50%) translateX(${rightTransform}px)`,
          opacity: opacity,
          zIndex: 1,
        }}
      >
        <Image
          src="/images/treegen-parallax-2.png"
          alt="Treegen Background"
          width={500}
          height={500}
          className="object-contain"
        />
      </div>
    </div>
  )
}
