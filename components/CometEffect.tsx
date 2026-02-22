"use client"

import { useEffect, useRef, useState } from "react"

export default function CometEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Trajectory: enters top-left, exits bottom-right
    const startX = W * 0.02
    const startY = H * 0.05
    const endX   = W * 0.85
    const endY   = H * 0.78

    const DURATION  = 2600
    const TRAIL_MAX = 55

    const trail: { x: number; y: number }[] = []
    let startTs: number | null = null
    let rafId: number

    function frame(ts: number) {
      if (!startTs) startTs = ts
      const elapsed = ts - startTs
      const raw = Math.min(elapsed / DURATION, 1)
      // ease-in then coast
      const p = raw < 0.4
        ? (raw / 0.4) * (raw / 0.4) * 0.4
        : 0.4 + (raw - 0.4) * (1 / 0.6) * 0.6

      const x = startX + (endX - startX) * p
      const y = startY + (endY - startY) * p

      trail.push({ x, y })
      if (trail.length > TRAIL_MAX) trail.shift()

      ctx.clearRect(0, 0, W, H)

      // Trail — tapered segments, oldest = thin+transparent, newest = thick+opaque
      for (let i = 1; i < trail.length; i++) {
        const ratio = i / trail.length
        const alpha = ratio * ratio * 0.7
        const lineW = ratio * 3.5

        ctx.beginPath()
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
        ctx.lineTo(trail[i].x, trail[i].y)
        ctx.strokeStyle = `rgba(255, 145, 30, ${alpha})`
        ctx.lineWidth = lineW
        ctx.lineCap = "round"
        ctx.stroke()
      }

      // Comet head glow
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 30)
      glow.addColorStop(0,    "rgba(255, 235, 140, 1)")
      glow.addColorStop(0.15, "rgba(255, 180,  50, 0.95)")
      glow.addColorStop(0.4,  "rgba(255, 110,   0, 0.45)")
      glow.addColorStop(1,    "rgba(255,  60,   0, 0)")

      ctx.beginPath()
      ctx.arc(x, y, 30, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // Solid bright core
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255, 245, 200, 0.95)"
      ctx.fill()

      if (raw < 1) {
        rafId = requestAnimationFrame(frame)
      } else {
        // Fade out residual trail
        let fadeAlpha = 1.0
        const lastTrail = [...trail]

        function fadeFrame() {
          fadeAlpha -= 0.06
          if (fadeAlpha <= 0) {
            ctx.clearRect(0, 0, W, H)
            setDone(true)
            return
          }
          ctx.clearRect(0, 0, W, H)
          ctx.globalAlpha = fadeAlpha

          for (let i = 1; i < lastTrail.length; i++) {
            const ratio = i / lastTrail.length
            ctx.beginPath()
            ctx.moveTo(lastTrail[i - 1].x, lastTrail[i - 1].y)
            ctx.lineTo(lastTrail[i].x, lastTrail[i].y)
            ctx.strokeStyle = `rgba(255, 145, 30, ${ratio * ratio * 0.7})`
            ctx.lineWidth = ratio * 3.5
            ctx.lineCap = "round"
            ctx.stroke()
          }

          ctx.globalAlpha = 1
          requestAnimationFrame(fadeFrame)
        }
        fadeFrame()
      }
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [])

  if (done) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4,
      }}
    />
  )
}
