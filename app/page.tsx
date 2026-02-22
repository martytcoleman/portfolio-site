"use client"

import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"

const Galaxy = dynamic(() => import("@/components/Galaxy"), { ssr: false })
const CometEffect = dynamic(() => import("@/components/CometEffect"), { ssr: false })

const INTERESTS = [
  "Space Travel",
  "Guitar",
  "Ancient Aliens",
  "Stand-up Comedy",
  "Darts",
]

function CyclingInterests() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % INTERESTS.length)
        setVisible(true)
      }, 400)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="inline-block min-w-[140px]">
      <span
        className={`inline-block transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        {INTERESTS[index]}
      </span>
    </span>
  )
}

const IFRAME_VIEWPORT = { width: 1920, height: 1200 } // 16:10 full-screen simulation

function IframePreview({ url, title, screenshot }: { url: string; title: string; screenshot?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const thumbnailRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const [modalScale, setModalScale] = useState(0.5)
  const thumbnailScale = 256 / IFRAME_VIEWPORT.width

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "auto", block: "center" })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !modalContainerRef.current) return
    const updateScale = () => {
      if (modalContainerRef.current) {
        const rect = modalContainerRef.current.getBoundingClientRect()
        const scale = Math.min(
          rect.width / IFRAME_VIEWPORT.width,
          rect.height / IFRAME_VIEWPORT.height,
        )
        setModalScale(scale)
      }
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(modalContainerRef.current)
    return () => observer.disconnect()
  }, [isOpen])

  return (
    <>
      <button
        ref={thumbnailRef}
        onClick={() => setIsOpen(true)}
        className="group relative w-full max-w-[256px] aspect-[16/10] rounded-lg border border-border overflow-hidden hover:border-muted-foreground/50 transition-all duration-500 hover:shadow-lg cursor-pointer bg-secondary"
      >
        {screenshot ? (
          <Image
            src={screenshot}
            alt={`${title} preview`}
            fill
            className="object-cover object-top"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute left-1/2 top-0 origin-top"
            style={{
              width: IFRAME_VIEWPORT.width,
              height: IFRAME_VIEWPORT.height,
              transform: `translateX(-50%) scale(${thumbnailScale})`,
            }}
          >
            <iframe
              src={url}
              title={`${title} preview`}
              className="w-full h-full pointer-events-none"
              style={{ width: IFRAME_VIEWPORT.width, height: IFRAME_VIEWPORT.height }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-2 bg-background/90 text-foreground text-sm rounded-full border border-border backdrop-blur-sm">
            View Live Site
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-[896px] rounded-xl border border-border overflow-hidden shadow-2xl bg-background flex-shrink-0 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-chart-4/60" />
                  <div className="w-3 h-3 rounded-full bg-chart-2/60" />
                </div>
                <span className="text-sm text-muted-foreground font-mono truncate max-w-md">{url}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Open in new tab
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close preview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              ref={modalContainerRef}
              className="relative w-full overflow-hidden bg-secondary"
              style={{
                aspectRatio: "16/10",
              }}
            >
              <div
                className="absolute left-1/2 top-0 origin-top"
                style={{
                  width: IFRAME_VIEWPORT.width,
                  height: IFRAME_VIEWPORT.height,
                  transform: `translateX(-50%) scale(${modalScale})`,
                }}
              >
                <iframe
                  src={url}
                  title={`${title} full preview`}
                  style={{ width: IFRAME_VIEWPORT.width, height: IFRAME_VIEWPORT.height }}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  const [galaxyReady, setGalaxyReady] = useState(false)
  const [showComet, setShowComet] = useState(false)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])
  const navButtonsRef = useRef<(HTMLButtonElement | null)[]>([])
  const NAV_SECTIONS = ["intro", "work", "connect"]

  useEffect(() => {
    if (!galaxyReady) return
    const t = setTimeout(() => setShowComet(true), 1200)
    return () => clearTimeout(t)
  }, [galaxyReady])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up")
            const idx = NAV_SECTIONS.indexOf(entry.target.id)
            navButtonsRef.current.forEach((btn, i) => {
              if (!btn) return
              btn.className = `w-2 h-8 rounded-full transition-all duration-500 ${
                i === idx ? "bg-foreground" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGalaxyReady = useCallback(() => setGalaxyReady(true), [])

  const experiences = [
    {
      company: "Second Wind",
      role: "Founder & CEO",
      period: "Nov 2025 - Present",
      location: "Hanover, NH",
      description: [
        "Built a system that shapes how companies are discovered and evaluated in buyer conversations with AI.",
        "Moved pilot customers from rarely to consistently appearing and ranking high across key buyer prompts.",
        "Shipped management platform that monitors models, publishes fixes, and learns from every action.",
      ],
      url: "https://www.secondwind.cloud/",
      hasPreview: true,
      screenshot: "/images/secondwind-screenshot.png",
    },
    {
      company: "Tuck Advisors",
      role: "Software Engineer",
      period: "Mar 2025 - Jan 2026",
      location: "Hanover, NH",
      description: [
        "Promoted from intern to lead the firm's technology function; built the full AI & automation stack for operations.",
        "Automated analyst workflows (emails, call notes, client research) to support faster daily decision-making.",
        "Built a custom Chrome extension, CRM automations, fit scoring and target search, and AI deal analyzer tech.",
        "Built systems that became core tooling used by deal teams across multiple successful M&A processes in 2025.",
      ],
      url: "https://www.tuckadvisors.com/",
      hasPreview: true,
    },
    {
      company: "FusionTally",
      role: "Co-Founder",
      period: "Oct 2024 - Present",
      location: "Burlington, MA",
      description: [
        "Built and shipped an analytics and league management platform for darts, beta tested in professional leagues.",
        "Currently hands off day to day while co-founders explore acquisition discussions with larger darts organizations.",
      ],
      tech: ["React", "Node.js", "PostgreSQL", "Analytics"],
      url: "https://www.fusiontally.com/",
      hasPreview: true,
    },
    {
      company: "Coleman Test Prep",
      role: "Founder",
      period: "Jul 2024 - Present",
      location: "Chelmsford, MA",
      description: [
        "Founded scalable group SAT tutoring model for 65 students, raising scores by 160 points in 3 weeks on average.",
        "Achieved 97% satisfaction rate; generating $1,700 per week in peak summer and fall periods.",
        "Developed proprietary study modules and AI assistant for original SAT questions and personalized practice sets.",
      ],
      hasPreview: false,
      logo: "/images/ctplogo.png",
    },
    {
      company: "DARTS (Dartmouth Advising & Research for Tech Start-Ups)",
      role: "President",
      period: "Nov 2023 - Nov 2025",
      location: "Hanover, NH",
      description: [
        "Led consulting for Scale AI and other Series A-C startups, managing a team of 5 analysts.",
        "Executed GTM strategy for Scale AI's data training program, recruiting over 50 expert data annotators.",
        "Built web scraping infrastructure for expert annotator sourcing used directly by Scale AI's executive team.",
        "Led competitive industry research developing growth strategy plans for other Series A-C companies.",
      ],
      hasPreview: false,
      logo: "/images/dartsatdartmouth_logo.jpeg",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {showComet && <CometEffect />}
      <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col gap-4">
          {NAV_SECTIONS.map((section, i) => (
            <button
              key={section}
              ref={(el) => { navButtonsRef.current[i] = el }}
              onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" })}
              className="w-2 h-8 rounded-full transition-all duration-500 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              aria-label={`Navigate to ${section}`}
            />
          ))}
        </div>
      </nav>

      {/* Galaxy background — fixed layer, never moves during scroll */}
      <div className="fixed inset-0 z-0 bg-black">
        <Galaxy
          density={0.8}
          glowIntensity={0.3}
          saturation={0}
          rotationSpeed={0.02}
          starSpeed={0.15}
          speed={0.3}
          onReady={handleGalaxyReady}
        />
      </div>

      {/* Hero / Intro - full width */}
      <header
        id="intro"
        ref={(el) => { sectionsRef.current[0] = el }}
        className="relative min-h-screen flex items-center overflow-hidden w-full"
      >
        <div
          className={`relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-16 w-full transition-opacity duration-1000 ease-out ${galaxyReady ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center gap-10 sm:gap-14 w-full">
            <div className="shrink-0">
              <div className="w-[180px] sm:w-[220px] aspect-square rounded-xl overflow-hidden border border-border">
                <Image
                  src="/images/headshot.jpeg"
                  alt="Martin Coleman headshot"
                  width={560}
                  height={747}
                  className="w-full h-full object-cover object-[center_15%]"
                  priority
                />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-tight">
                {"Hi, I'm "}
                <span className="text-foreground">Marty.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
                {"I'm a junior at Dartmouth studying Computer Science and Math. I'm interested in how AI changes what people think—and what they do."}
              </p>
              <div className="text-sm text-muted-foreground/60 font-mono tracking-wider pt-2">
                {"Also into "}
                <span className="text-foreground/80"><CyclingInterests /></span>
              </div>
            </div>
          </div>
        </div>

        {/* Social icons — bottom right of hero */}
        <div className={`absolute bottom-[10%] right-8 z-10 flex items-center gap-5 transition-opacity duration-1000 ease-out ${galaxyReady ? "opacity-100" : "opacity-0"}`}>
          <Link
            href="https://www.linkedin.com/in/marty-coleman"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </Link>
          <Link
            href="https://www.youtube.com/watch?v=NVPRZimcizg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors duration-300"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="relative z-10 bg-background" style={{ willChange: "transform", transform: "translateZ(0)" }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-16">
        {/* Experience */}
        <section
          id="work"
          ref={(el) => { sectionsRef.current[1] = el }}
          className="min-h-screen py-20 sm:py-32 opacity-0"
        >
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light">Experience</h2>
              <div className="text-sm text-muted-foreground font-mono">2023 - PRESENT</div>
            </div>

            <div className="space-y-16 sm:space-y-20">
              {experiences.map((job, index) => (
                <div key={index} className="space-y-6">
                  <div className="grid lg:grid-cols-12 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-border/50 items-center">
                    <div className="lg:col-span-4 space-y-1">
                      <h3 className="text-xl sm:text-2xl font-medium">{job.company}</h3>
                      <div className="text-muted-foreground">{job.role}</div>
                      <div className="text-xs text-muted-foreground font-mono">{job.period}</div>
                      <div className="text-xs text-muted-foreground">{job.location}</div>
                      {job.hasPreview && job.url && (
                        <div className="pt-3">
                          <IframePreview url={job.url} title={job.company} screenshot={job.screenshot} />
                        </div>
                      )}
                      {!job.hasPreview && job.logo && (
                        <div className="pt-3">
                          <div className="relative w-full max-w-[256px] aspect-[16/10] rounded-lg overflow-hidden bg-black flex items-center justify-center">
                            <Image
                              src={job.logo}
                              alt={`${job.company} logo`}
                              fill
                              className="object-contain p-4"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-8">
                      <ul className="space-y-2">
                        {job.description.map((point, i) => (
                          <li key={i} className="text-muted-foreground leading-relaxed flex gap-2 items-start">
                            <span className="text-foreground/40 pt-[0.4em] shrink-0">
                              <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="4" />
                              </svg>
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Connect */}
        <section
          id="connect"
          ref={(el) => { sectionsRef.current[2] = el }}
          className="py-20 sm:py-32 opacity-0"
        >
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl font-light">{"Let's Connect"}</h2>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg">
              Always interested in new opportunities, collaborations, and conversations about technology, startups,
              and building cool stuff.
            </p>

            <div className="space-y-3">
              <Link
                href="mailto:marty@secondwind.cloud"
                className="group flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors duration-300"
              >
                <span className="text-base sm:text-lg">marty@secondwind.cloud</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="mailto:martin.t.coleman.27@dartmouth.edu"
                className="group flex items-center gap-3 text-foreground hover:text-muted-foreground transition-colors duration-300"
              >
                <span className="text-base sm:text-lg">martin.t.coleman.27@dartmouth.edu</span>
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <footer className="py-12 sm:py-16 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Martin Coleman. All rights reserved.</div>
              <div className="text-xs text-muted-foreground">Dartmouth College '27</div>
            </div>

          </div>
        </footer>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </div>
  )
}
