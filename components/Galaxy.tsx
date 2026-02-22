"use client"

import { Renderer, Program, Mesh, Color, Triangle } from "ogl"
import { memo, useEffect, useRef } from "react"
import "./Galaxy.css"

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform float uRotationSpeed;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 3.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / max(d, 0.005);
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float flareSize = smoothstep(0.9, 1.0, size);

      /* Realistic star colors: subtle blues, oranges, whites */
      float colorChoice = Hash21(si + 7.0);
      float hue, sat, val;
      if (colorChoice < 0.45) {
        /* Cool blues / blue-whites */
        hue = 0.58 + Hash21(si + 11.0) * 0.08;
        sat = 0.15 + Hash21(si + 13.0) * 0.2;
        val = 0.85 + Hash21(si + 17.0) * 0.15;
      } else if (colorChoice < 0.75) {
        /* Warm oranges / amber */
        hue = 0.07 + Hash21(si + 19.0) * 0.05;
        sat = 0.2 + Hash21(si + 23.0) * 0.25;
        val = 0.9 + Hash21(si + 29.0) * 0.1;
      } else {
        /* Neutral whites */
        hue = 0.08 + Hash21(si + 31.0) * 0.02;
        sat = Hash21(si + 37.0) * 0.12;
        val = 0.92 + Hash21(si + 41.0) * 0.08;
      }
      vec3 base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);

      col += star * size * base;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  float autoRotAngle = uTime * uRotationSpeed;
  float ca = cos(autoRotAngle);
  float sa = sin(autoRotAngle);
  uv = mat2(ca, -sa, sa, ca) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`

interface GalaxyProps {
  focal?: [number, number]
  rotation?: [number, number]
  starSpeed?: number
  density?: number
  hueShift?: number
  disableAnimation?: boolean
  speed?: number
  mouseInteraction?: boolean
  glowIntensity?: number
  saturation?: number
  mouseRepulsion?: boolean
  repulsionStrength?: number
  twinkleIntensity?: number
  rotationSpeed?: number
  autoCenterRepulsion?: number
  transparent?: boolean
  className?: string
  onReady?: () => void
}

export default memo(function Galaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  className = "",
  onReady,
  ...rest
}: GalaxyProps) {
  const ctnDom = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ctnDom.current) return
    const ctn = ctnDom.current

    const renderer = new Renderer({
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 1)

    let program: Program

    const DPR = 0.75

    function resize() {
      renderer.setSize(ctn.offsetWidth * DPR, ctn.offsetHeight * DPR)
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height,
        )
      }
    }
    window.addEventListener("resize", resize, false)
    resize()

    const geometry = new Triangle(gl)
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uFocal: { value: new Float32Array(focal) },
        uRotation: { value: new Float32Array(rotation) },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uRotationSpeed: { value: rotationSpeed },
        uTransparent: { value: false },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })

    renderer.render({ scene: mesh })
    onReadyRef.current?.()

    ctn.appendChild(gl.canvas)

    let animateId: number | null = null
    let lastFrame = 0
    const FRAME_INTERVAL = 1000 / 45

    function update(t: number) {
      animateId = requestAnimationFrame(update)
      if (t - lastFrame < FRAME_INTERVAL) return
      lastFrame = t

      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001
        program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0
      }

      renderer.render({ scene: mesh })
    }

    function startLoop() {
      if (animateId === null) {
        animateId = requestAnimationFrame(update)
      }
    }

    function stopLoop() {
      if (animateId !== null) {
        cancelAnimationFrame(animateId)
        animateId = null
      }
    }

    startLoop()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop()
        else stopLoop()
      },
      { threshold: 0 },
    )
    observer.observe(ctn)

    return () => {
      observer.disconnect()
      stopLoop()
      window.removeEventListener("resize", resize)
      ctn.removeChild(gl.canvas)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={ctnDom} className={`galaxy-container ${className}`} {...rest} />
})
