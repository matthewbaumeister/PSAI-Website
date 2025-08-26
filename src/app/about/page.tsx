import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Prop Shop AI - Leveling the Playing Field for Government Contracting Underdogs',
  description: 'Learn how Prop Shop AI is fighting for the underdogs in government contracting, leveling the playing field against big companies that win based on connections rather than merit.',
}

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="container">
        <div className="page-header">
          <div className="badge">Our Story</div>
          <h1>About Prop Shop AI</h1>
          <p className="subtitle">
            We're not just another government contracting company. We're the Robin Hood of procurement,
            fighting for the underdogs and leveling the playing field against established companies that 
            win based on who they know, not what they can do.
          </p>
        </div>

        <div className="hero-section">
          <div className="hero-content">
            <h2>The Robin Hood of Government Contracting</h2>
            <p>
              In a world where established companies maintain advantages through relationships and resources, 
              we're working to democratize access to government contracting opportunities. We believe that 
              every company, regardless of size or connections, deserves a fair shot at government contracts.
            </p>
            <div className="hero-features">
              <div className="feature">
                <div className="feature-icon">🏹</div>
                <h3>Fighting for the Underdogs</h3>
                <p>We champion small businesses, startups, and innovative companies</p>
              </div>
              <div className="feature">
                <div className="feature-icon">⚖️</div>
                <h3>Leveling the Playing Field</h3>
                <p>Democratizing access to government contracting opportunities</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🚀</div>
                <h3>Innovation Over Connections</h3>
                <p>Rewarding merit, capability, and innovation, not just relationships</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>The Challenge: Access Barriers in Government Contracting</h2>
          <div className="problem-description">
            <div className="problem-text">
              <p>
                Government contracting has evolved into a system where established companies often maintain 
                advantages through long-standing relationships, extensive resources, and insider knowledge. 
                While these companies may deliver quality work, the system creates barriers that make it 
                difficult for innovative newcomers to compete on equal footing.
              </p>
              <p>
                Meanwhile, innovative small businesses, veteran-owned companies, women-owned businesses, and
                minority-owned enterprises often struggle to access the same opportunities. They're not 
                necessarily shut out due to lack of capability, but rather due to limited access to the 
                networks, intelligence, and tools that established players take for granted.
              </p>
            </div>
            <div className="problem-stats">
              <div className="stat">
                <div className="stat-number">80%</div>
                <div className="stat-label">of contracts go to the same 20% of companies</div>
              </div>
              <div className="stat">
                <div className="stat-number">$500B+</div>
                <div className="stat-label">in annual government spending</div>
              </div>
              <div className="stat">
                <div className="stat-number">90%</div>
                <div className="stat-label">of small businesses never win a government contract</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Our Mission: Democratizing Government Contracting</h2>
          <div className="mission-content">
            <div className="mission-text">
              <h3>We're Changing the Game</h3>
              <p>
                Prop Shop AI was founded on a simple principle: government contracts should go to the companies
                that can do the best work, not just the companies that know the right people. We're using cutting-edge
                technology to level the playing field and give underdogs the tools they need to compete with established players.
              </p>
              <p>
                Like Robin Hood sharing resources with those who need them most, we're making the advantages that 
                established companies have developed available to everyone. We're democratizing access to government 
                contracting intelligence, tools, and opportunities.
              </p>
            </div>
            <div className="mission-principles">
              <div className="principle">
                <h4>🏹 Merit Over Connections</h4>
                <p>We believe contracts should be won based on capability, not relationships</p>
              </div>
              <div className="principle">
                <h4>⚖️ Fair Play for All</h4>
                <p>Every company deserves equal access to government opportunities</p>
              </div>
              <div className="principle">
                <h4>🚀 Innovation Wins</h4>
                <p>We reward creativity and innovation over established advantages</p>
              </div>
              <div className="principle">
                <h4>🤝 Power to the People</h4>
                <p>Democratizing access to government contracting tools and intelligence</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>How We're Supporting the Underdogs</h2>
          <div className="fighting-methods">
            <div className="method">
              <div className="method-icon">🔍</div>
              <h3>Democratizing Intelligence</h3>
              <p>
                Established companies have teams of analysts and expensive market intelligence tools. We're making
                that same intelligence available to small businesses at a fraction of the cost.
              </p>
            </div>
            <div className="method">
              <div className="method-icon">🤖</div>
              <h3>AI-Powered Tools</h3>
              <p>
                We're using artificial intelligence to give small companies the same capabilities that
                established companies spend millions developing in-house.
              </p>
            </div>
            <div className="method">
              <div className="method-icon">📊</div>
              <h3>Proprietary Data Access</h3>
              <p>
                We've built proprietary databases and search tools that give underdogs access to
                opportunities that established companies may not actively share.
              </p>
            </div>
            <div className="method">
              <div className="method-icon">✍️</div>
              <h3>Expert Writing Support</h3>
              <p>
                Established companies have entire proposal departments. We're providing PhD-level writing
                support to help small companies compete on equal footing.
              </p>
            </div>
            <div className="method">
              <div className="method-icon">🏢</div>
              <h3>Small Business Focus</h3>
              <p>
                We're specifically designed for small businesses, with tools and resources that
                help them navigate set-aside programs and win contracts.
              </p>
            </div>
            <div className="method">
              <div className="method-icon">👥</div>
              <h3>Community Building</h3>
              <p>
                We're building a community of underdogs who support each other, share knowledge,
                and work together to succeed in government contracting.
              </p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>The Companies We're Supporting</h2>
          <div className="underdog-categories">
            <div className="underdog-category">
              <h3>Small Businesses</h3>
              <p>Companies with innovative ideas but limited resources to compete with established players</p>
            </div>
            <div className="underdog-category">
              <h3>Veteran-Owned Businesses</h3>
              <p>Service members who served their country but struggle to win contracts from it</p>
            </div>
            <div className="underdog-category">
              <h3>Women-Owned Businesses</h3>
              <p>Female entrepreneurs working to overcome barriers in government contracting</p>
            </div>
            <div className="underdog-category">
              <h3>Minority-Owned Businesses</h3>
              <p>Diverse companies that bring innovation but face historical disadvantages</p>
            </div>
            <div className="underdog-category">
              <h3>Startups & Innovators</h3>
              <p>New companies with cutting-edge solutions but no established relationships</p>
            </div>
            <div className="underdog-category">
              <h3>Rural & Local Businesses</h3>
              <p>Companies outside the DC beltway that lack access to decision-makers</p>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Our Team</h2>
          <div className="team-section">
            <div className="team-intro">
              <p>
                We're a team of government contracting professionals, technology innovators, and business
                leaders who believe that the best companies should win, regardless of their size or connections. 
                We've seen the system from the inside and we're determined to make it more accessible.
              </p>
            </div>
            <div className="team-values">
              <div className="value">
                <h4>🎯 Relentless Focus</h4>
                <p>We're laser-focused on leveling the playing field for underdogs</p>
              </div>
              <div className="value">
                <h4>💪 Unwavering Determination</h4>
                <p>We won't stop until every deserving company has a fair shot</p>
              </div>
              <div className="value">
                <h4>🚀 Innovation First</h4>
                <p>We use cutting-edge technology to solve age-old problems</p>
              </div>
              <div className="value">
                <h4>🤝 Community Driven</h4>
                <p>We succeed when our community of underdogs succeeds</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <h2>Join Our Mission</h2>
          <div className="join-rebellion">
            <div className="rebellion-text">
              <h3>Are You Ready to Level the Playing Field?</h3>
              <p>
                The government contracting landscape has favored established players for too long. It's time for 
                innovative companies to rise up and claim their fair share of government contracts. With Prop Shop AI
                on your side, you'll have the tools, intelligence, and support you need to compete with the biggest 
                players in the game.
              </p>
              <p>
                Join us in our mission to democratize government contracting. Together, we can level the
                playing field and ensure that contracts go to the companies that deserve them most - not just 
                the companies that know the right people.
              </p>
            </div>
            <div className="rebellion-actions">
              <div className="action">
                <h4>🏹 Arm Yourself</h4>
                <p>Get access to the tools and intelligence you need to compete</p>
                <a href="/contact" className="btn btn-primary">Get Started</a>
              </div>
              <div className="action">
                <h4>🤝 Join the Community</h4>
                <p>Connect with other companies working to succeed in government contracting</p>
                <a href="/contact" className="btn btn-outline">Join Us</a>
              </div>
              <div className="action">
                <h4>📚 Learn the Ropes</h4>
                <p>Master government contracting with our expert resources</p>
                <a href="/resources" className="btn btn-outline">Learn More</a>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Level the Playing Field?</h2>
          <p>
            Stop letting established advantages determine success. Start winning based on capability,
            innovation, and merit. Prop Shop AI is here to level the playing field.
          </p>
          <div className="cta-buttons">
            <a href="/contact" className="btn btn-primary btn-lg">Join Our Mission</a>
            <a href="/book-demo" className="btn btn-outline btn-lg">See How It Works</a>
          </div>
        </div>
      </div>
    </main>
  )
}
