import { Hero } from '@/components/sections/hero'

export default function HomePage() {
  return (
    <main>
      <Hero />
      
      {/* Additional sections can be added here */}
      <section className="features-section">
        <div className="container">
          <h2>Why Prop Shop AI?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Procurement Intelligence</h3>
              <p>Real-time insights on opportunities, competitors, and market trends.</p>
            </div>
            <div className="feature-card">
              <h3>Compliance Automation</h3>
              <p>Built-in compliance checks and automated proposal generation.</p>
            </div>
            <div className="feature-card">
              <h3>Level Playing Field</h3>
              <p>Small businesses compete directly with primes on equal footing.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
