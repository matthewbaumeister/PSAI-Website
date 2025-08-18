export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Events & Webinars</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Stay Connected</h2>
            <p className="text-gray-300">
              Join us for exclusive events, webinars, and workshops focused on government contracting, 
              procurement intelligence, and the future of AI in government procurement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <div className="text-sm text-[#9AF23A] mb-2">Upcoming</div>
              <h3 className="text-xl font-semibold mb-4">Government Contracting Masterclass</h3>
              <p className="text-gray-300 mb-4">
                Learn the fundamentals of government contracting, from registration to proposal submission, 
                in this comprehensive workshop designed for newcomers to the space.
              </p>
              <div className="text-sm text-gray-400 mb-4">Date: TBD</div>
              <div className="text-sm text-gray-400 mb-6">Duration: 2 hours</div>
              <button className="px-6 py-3 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                Register Interest
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <div className="text-sm text-[#9AF23A] mb-2">Upcoming</div>
              <h3 className="text-xl font-semibold mb-4">AI in Procurement Webinar</h3>
              <p className="text-gray-300 mb-4">
                Discover how artificial intelligence is transforming government procurement and 
                learn practical strategies for leveraging AI in your contracting efforts.
              </p>
              <div className="text-sm text-gray-400 mb-4">Date: TBD</div>
              <div className="text-sm text-gray-400 mb-6">Duration: 1 hour</div>
              <button className="px-6 py-3 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                Register Interest
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Past Events</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">DOD Contracting Workshop</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Deep dive into Department of Defense contracting requirements and best practices.
                </p>
                <div className="text-xs text-gray-400">Recorded • 90 minutes</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Compliance Automation Demo</h4>
                <p className="text-gray-300 text-sm mb-2">
                  See how AI can automate compliance checking and reduce proposal errors.
                </p>
                <div className="text-xs text-gray-400">Recorded • 45 minutes</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Market Intelligence Panel</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Industry experts discuss the future of procurement intelligence and market analysis.
                </p>
                <div className="text-xs text-gray-400">Recorded • 60 minutes</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Request a Custom Event</h3>
              <p className="text-gray-300 mb-6">
                              Need a specific workshop or training for your team? We can create custom events 
              tailored to your organization&apos;s needs and goals.
              </p>
              <a 
                href="/contact" 
                className="inline-block bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Contact Us
              </a>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
              <p className="text-gray-300 mb-6">
                Subscribe to our events newsletter to be notified about upcoming webinars, 
                workshops, and industry events.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#2D5BFF]"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
