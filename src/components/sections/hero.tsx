'use client'

import { useEffect, useRef } from 'react'

export function Hero() {
  const proofRef = useRef<HTMLDivElement>(null)
  const agenciesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const proofItems = proofRef.current
    const agenciesItems = agenciesRef.current

    if (!proofItems || !agenciesItems) return

    // Clone items for seamless infinite scroll
    const proofClone = proofItems.cloneNode(true) as HTMLElement
    const agenciesClone = agenciesItems.cloneNode(true) as HTMLElement

    // Append clones
    proofItems.appendChild(proofClone)
    agenciesItems.appendChild(agenciesClone)

    // Animation frame IDs for cleanup
    let proofAnimationId: number
    let agenciesAnimationId: number

    // Infinite scroll animation for proof items (left to right)
    let proofPosition = 0
    const proofScroll = () => {
      proofPosition -= 0.5 // Slower movement for readability
      if (proofPosition <= -proofItems.scrollWidth / 2) {
        proofPosition = 0
      }
      proofItems.style.transform = `translateX(${proofPosition}px)`
      proofAnimationId = requestAnimationFrame(proofScroll)
    }

    // Infinite scroll animation for agencies (right to left, opposite direction)
    let agenciesPosition = 0
    const agenciesScroll = () => {
      agenciesPosition += 0.5 // Move right (opposite direction from proof)
      if (agenciesPosition >= agenciesItems.scrollWidth / 2) {
        agenciesPosition = 0
      }
      agenciesItems.style.transform = `translateX(${agenciesPosition}px)`
      agenciesAnimationId = requestAnimationFrame(agenciesScroll)
    }

    // Start animations
    proofScroll()
    agenciesScroll()

    // Cleanup function to stop animations
    return () => {
      if (proofAnimationId) {
        cancelAnimationFrame(proofAnimationId)
      }
      if (agenciesAnimationId) {
        cancelAnimationFrame(agenciesAnimationId)
      }
    }
  }, [])

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="badge">The Procurement Intelligence Platform</div>
          <h1>
            Level the Playing Field with{' '}
            <span className="gradient-text">AI-Powered</span> Government Contracting
          </h1>
          <p className="hero-description">
            Access the same intelligence, tools, and opportunities that big companies use to win government contracts. 
            No more losing to companies with better connections - win with superior capabilities.
          </p>
          
          <div className="mission-statement">
            <h2>Our Mission</h2>
            <p>
              <strong>"We provide capabilities based on quality and merit, not connections."</strong>
            </p>
            <p>
              In government contracting, success should be determined by what you can deliver, not who you know. 
              We're democratizing access to the tools and intelligence that level the playing field for innovative 
              companies competing against established giants.
            </p>
          </div>
          
          <div className="cta-buttons">
            <a href="/book-demo" className="btn btn-primary btn-lg">
              Book Demo
            </a>
            <a href="/contact" className="btn btn-outline btn-lg">
              Get Started
            </a>
          </div>
        </div>
      </div>
      
      <div className="proof-section">
        <div className="section-label">TRUSTED BY INNOVATORS, PRIMES, AND GOVERNMENT AGENCIES</div>
        <div className="proof-items" ref={proofRef}>
          <div className="proof-item">COMPLIANCE</div>
          <div className="proof-item">SEARCH</div>
          <div className="proof-item">MARKET RESEARCH</div>
          <div className="proof-item">WRITING</div>
          <div className="proof-item">CRM</div>
          <div className="proof-item">SMALL BUSINESS</div>
          <div className="proof-item">COMPLIANCE</div>
          <div className="proof-item">SEARCH</div>
          <div className="proof-item">MARKET RESEARCH</div>
          <div className="proof-item">WRITING</div>
          <div className="proof-item">CRM</div>
          <div className="proof-item">SMALL BUSINESS</div>
          <div className="proof-item">COMPLIANCE</div>
          <div className="proof-item">SEARCH</div>
          <div className="proof-item">MARKET RESEARCH</div>
          <div className="proof-item">WRITING</div>
          <div className="proof-item">CRM</div>
          <div className="proof-item">SMALL BUSINESS</div>
          <div className="proof-item">COMPLIANCE</div>
          <div className="proof-item">SEARCH</div>
          <div className="proof-item">MARKET RESEARCH</div>
          <div className="proof-item">WRITING</div>
          <div className="proof-item">CRM</div>
          <div className="proof-item">SMALL BUSINESS</div>
          <div className="proof-item">COMPLIANCE</div>
          <div className="proof-item">SEARCH</div>
          <div className="proof-item">MARKET RESEARCH</div>
          <div className="proof-item">WRITING</div>
          <div className="proof-item">CRM</div>
          <div className="proof-item">SMALL BUSINESS</div>
        </div>
      </div>
      
      <div className="agencies-section">
        <div className="section-label">WE'VE WORKED ON PROPOSALS SUPPORTING</div>
        <div className="agencies-items" ref={agenciesRef}>
          <div className="agency-item">DOD</div>
          <div className="agency-item">DHS</div>
          <div className="agency-item">VA</div>
          <div className="agency-item">HHS</div>
          <div className="agency-item">GSA</div>
          <div className="agency-item">NASA</div>
          <div className="agency-item">DOD</div>
          <div className="agency-item">DHS</div>
          <div className="agency-item">VA</div>
          <div className="agency-item">HHS</div>
          <div className="agency-item">GSA</div>
          <div className="agency-item">NASA</div>
          <div className="agency-item">DOD</div>
          <div className="agency-item">DHS</div>
          <div className="agency-item">VA</div>
          <div className="agency-item">HHS</div>
          <div className="agency-item">GSA</div>
          <div className="agency-item">NASA</div>
          <div className="agency-item">DOD</div>
          <div className="agency-item">DHS</div>
          <div className="agency-item">VA</div>
          <div className="agency-item">HHS</div>
          <div className="agency-item">GSA</div>
          <div className="agency-item">NASA</div>
          <div className="agency-item">DOD</div>
          <div className="agency-item">DHS</div>
          <div className="agency-item">VA</div>
          <div className="agency-item">HHS</div>
          <div className="agency-item">GSA</div>
          <div className="agency-item">NASA</div>
        </div>
      </div>
    </section>
  )
}
