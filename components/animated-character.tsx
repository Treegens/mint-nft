"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

const treegenImages = [
  "/images/treegen-1.png",
  "/images/treegen-2.png",
  "/images/treegen-3.png",
  "/images/treegen-4.png",
  "/images/treegen-5.png",
  "/images/treegen-6.png",
]

export function AnimatedCharacter() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex === treegenImages.length - 1 ? 0 : prevIndex + 1))
        setIsTransitioning(false)
      }, 500) // Half the transition duration for smooth crossfade
    }, 3000) // Slightly longer interval for better viewing

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-80 h-80 mx-auto animate-float">
      {treegenImages.map((src, index) => (
        <Image
          key={src}
          src={src || "/placeholder.svg"}
          alt={`Treegen character ${index + 1}`}
          fill
          className={`object-contain transition-opacity duration-1000 ease-in-out animate-gentle-glow ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
          priority={index === 0}
        />
      ))}
    </div>
  )
}
