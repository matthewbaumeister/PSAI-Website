"use client"

import { useEffect, useState, type ReactNode } from "react"

export default function AboutPage() {
  const [imageSrc, setImageSrc] = useState("/about-northern-virginia.jpg")

  useEffect(() => {
    const testImg = new Image()
    testImg.onload = () => setImageSrc("/about-northern-virginia.jpg")
    testImg.onerror = () =>
      setImageSrc(
        // Rosslyn/Arlington skyline from Wikimedia (stable URL)
        "https://upload.wikimedia.org/wikipedia/commons/a/a4/Rosslyn_skyline_from_Theodore_Roosevelt_Island.jpg"
      )
    testImg.src = "/about-northern-virginia.jpg"
  }, [])

  return (
    <div className="page-content min-h-screen text-white">
      <main className="container mx-auto px-4 py-24">
        {/* Hero */}
        <section className="about-hero max-w-6xl mx-auto text-center mb-12">
          <h1 className="about-title text-[56px] md:text-[96px] font-extrabold leading-none tracking-tight animated-gradient-text">
            About Us
          </h1>

          {/* Vision statement */}
          <p className="vision-line text-2xl md:text-4xl font-semibold text-gray-100 max-w-4xl mx-auto">
            A world where the government buys based on capability, not connections.
          </p>

          {/* Mission paragraph */}
          <p className="about-paragraph text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We&apos;re building the Procurement Intelligence Platform so capability—not connections—decides outcomes. By combining live market signals, deep compliance automation, and fast research, we give innovative teams the leverage of incumbents: clarity on where to play, speed to respond, and confidence that every submission is airtight.
          </p>
        </section>

        {/* Image: Northern Virginia */}
        <section className="max-w-6xl mx-auto about-image">
          <figure className="relative overflow-hidden rounded-2xl">
            <img
              src={imageSrc}
              alt="Northern Virginia landscape"
              className="w-full h-[340px] md:h-[560px] object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImageSrc("https://upload.wikimedia.org/wikipedia/commons/4/49/Shenandoah_Valley_from_Skyline_Drive%2C_Virginia.jpg")}
            />
            {/* Bottom fade for smoothness */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 md:h-40 bg-gradient-to-b from-transparent to-[#0B1220]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#0B1220]/30 via-transparent to-[#2D5BFF]/10" />
            <figcaption className="mt-4 md:mt-6 text-center text-sm md:text-base text-[#2D5BFF] font-semibold tracking-wide">
              Proudly headquartered in Virginia
            </figcaption>
          </figure>
        </section>

        {/* Scrolling: Tools */}
        <section className="about-section about-tools max-w-6xl mx-auto">
          <h3 className="text-center text-gray-300 uppercase tracking-widest text-xs mb-6">Our Tools</h3>
          <div className="about-scroll-mask">
            <div className="about-scroll-track about-scroll-left">
              {toolChips.map((Chip, i) => (
                <Chip key={`tools-a-${i}`} />
              ))}
              {toolChips.map((Chip, i) => (
                <Chip key={`tools-b-${i}`} />
              ))}
            </div>
          </div>
        </section>

        {/* Scrolling: Publications (placeholders) */}
        <section className="about-section about-pubs max-w-6xl mx-auto">
          <h3 className="text-center text-gray-300 uppercase tracking-widest text-xs mb-6">Publications</h3>
          <div className="about-scroll-mask">
            <div className="about-scroll-track about-scroll-right">
              {publicationChips.map((Chip, i) => (
                <Chip key={`pub-a-${i}`} />
              ))}
              {publicationChips.map((Chip, i) => (
                <Chip key={`pub-b-${i}`} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Local styles for animated gradient heading - matched to header tech-gradient and spacing + scroll */}
      <style>{`
        .animated-gradient-text {
          background: linear-gradient(-45deg, #0B1220, #2D5BFF, #9AF23A, #FF7A29);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: tech-gradient 15s ease infinite;
        }
        /* Enforce spacing under title and among blocks despite global !important rules */
        .about-hero .about-title { margin-bottom: 2.25rem !important; }
        .about-hero .vision-line { margin-bottom: 1.25rem !important; }
        .about-hero .about-paragraph { margin-top: 0.75rem !important; }
        .about-image { margin-top: 2rem !important; }

        /* Lower section spacing to match above-photo spacing */
        .about-section { margin-top: 3.5rem !important; }
        @media (min-width: 768px) { .about-section { margin-top: 5rem !important; } }
        .about-pubs { margin-bottom: 4rem !important; }
        @media (min-width: 768px) { .about-pubs { margin-bottom: 5rem !important; } }

        /* Scrolling rows */
        .about-scroll-mask {
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to right, transparent, white 10%, white 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, white 10%, white 90%, transparent);
        }
        .about-scroll-track {
          display: inline-flex;
          gap: 1rem;
          white-space: nowrap;
        }
        .about-scroll-left { animation: about-scroll-left 45s linear infinite; }
        .about-scroll-right { animation: about-scroll-right 50s linear infinite; }
        @keyframes about-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes about-scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: white;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(45, 91, 255, 0.12);
        }
        .chip .icon {
          width: 1.25rem; height: 1.25rem;
          filter: drop-shadow(0 0 8px rgba(154, 242, 58, 0.35));
        }
      `}</style>
    </div>
  )
}

// --- Inline chip components with brand-colored SVGs ---
function ChipBase({ label, svg }: { label: string; svg: ReactNode }) {
  return (
    <div className="chip">
      {svg}
      <span>{label}</span>
    </div>
  )
}

const toolChips = [
  function ToolHub() {
    return (
      <ChipBase
                        label="PS.AI Small Business"
        svg={(
          <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2D5BFF"/>
                <stop offset="50%" stopColor="#9AF23A"/>
                <stop offset="100%" stopColor="#FF7A29"/>
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="7" stroke="url(#g1)" strokeWidth="2"/>
            <circle cx="12" cy="12" r="2" fill="url(#g1)"/>
            <path d="M12 5v3M12 16v3M5 12h3M16 12h3" stroke="url(#g1)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      />
    )
  },
  function ToolSearch() {
    return (
      <ChipBase
        label="PS.AI Search"
        svg={(
          <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2D5BFF"/>
                <stop offset="50%" stopColor="#9AF23A"/>
                <stop offset="100%" stopColor="#FF7A29"/>
              </linearGradient>
            </defs>
            <circle cx="11" cy="11" r="6" stroke="url(#g2)" strokeWidth="2"/>
            <path d="M16 16l4 4" stroke="url(#g2)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      />
    )
  },
  function ToolCompliance() {
    return (
      <ChipBase
        label="PS.AI Compliance"
        svg={(
          <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2D5BFF"/>
                <stop offset="50%" stopColor="#9AF23A"/>
                <stop offset="100%" stopColor="#FF7A29"/>
              </linearGradient>
            </defs>
            <path d="M12 3l7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4z" stroke="url(#g3)" strokeWidth="2" fill="none"/>
            <path d="M9.5 12l1.8 1.8L15 10" stroke="url(#g3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      />
    )
  },
  function ToolMarket() {
    return (
      <ChipBase
        label="PS.AI Market Research"
        svg={(
          <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2D5BFF"/>
                <stop offset="50%" stopColor="#9AF23A"/>
                <stop offset="100%" stopColor="#FF7A29"/>
              </linearGradient>
            </defs>
            <path d="M5 15h2v4H5zM10 11h2v8h-2zM15 7h2v12h-2z" fill="url(#g4)"/>
            <path d="M4 19h16" stroke="url(#g4)" strokeWidth="2"/>
          </svg>
        )}
      />
    )
  },
  function ToolWrite() {
    return (
      <ChipBase
        label="PS.AI Write"
        svg={(
          <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g5" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2D5BFF"/>
                <stop offset="50%" stopColor="#9AF23A"/>
                <stop offset="100%" stopColor="#FF7A29"/>
              </linearGradient>
            </defs>
            <path d="M4 15l10-10 4 4L8 19H4v-4z" stroke="url(#g5)" strokeWidth="2" fill="none"/>
            <path d="M13 5l4 4" stroke="url(#g5)" strokeWidth="2"/>
          </svg>
        )}
      />
    )
  },
]

const publicationChips = [
  function Pub1() { return <ChipBase label="Publication Placeholder" svg={PlaceholderIcon()} /> },
  function Pub2() { return <ChipBase label="Publication Placeholder" svg={PlaceholderIcon()} /> },
  function Pub3() { return <ChipBase label="Publication Placeholder" svg={PlaceholderIcon()} /> },
  function Pub4() { return <ChipBase label="Publication Placeholder" svg={PlaceholderIcon()} /> },
  function Pub5() { return <ChipBase label="Publication Placeholder" svg={PlaceholderIcon()} /> },
  function Pub6() { return <ChipBase label="Publication Placeholder" svg={PlaceholderIcon()} /> },
]

function PlaceholderIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2D5BFF"/>
          <stop offset="50%" stopColor="#9AF23A"/>
          <stop offset="100%" stopColor="#FF7A29"/>
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="url(#gp)" strokeWidth="2"/>
      <path d="M4 10h16" stroke="url(#gp)" strokeWidth="2"/>
    </svg>
  )
}
