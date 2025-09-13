"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      // Auto-play when component mounts
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          // Auto-play failed, user interaction required
          setIsPlaying(false)
        })
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (audio) {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play()
        setIsPlaying(true)
      }
    }
  }

  return (
    <div>
      <Button
        onClick={togglePlay}
        size="sm"
        className="rounded-full w-10 h-10 p-0 shadow-lg"
        style={{ backgroundColor: "#deeb8b", color: "#191B1C" }}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      <audio ref={audioRef} loop>
        <source src="/audio/treegens-song.mp3" type="audio/mpeg" />
      </audio>
    </div>
  )
}
