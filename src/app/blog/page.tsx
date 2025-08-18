export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Prop Shop AI Blog</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Insights & Updates</h2>
            <p className="text-gray-300">
              Stay informed about the latest developments in government contracting, procurement intelligence, 
              and how AI is transforming the way government agencies evaluate and select vendors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Featured Article */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Featured</div>
              <h3 className="text-xl font-semibold mb-3">The Future of Government Procurement</h3>
              <p className="text-gray-300 mb-4">
                How AI is revolutionizing the way government agencies evaluate proposals and select vendors, 
                moving from connection-based decisions to capability-driven outcomes.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Guide</div>
              <h3 className="text-xl font-semibold mb-3">DOD Contracting Best Practices</h3>
              <p className="text-gray-300 mb-4">
                Essential strategies for navigating the complex world of Department of Defense contracting 
                and maximizing your chances of success.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Analysis</div>
              <h3 className="text-xl font-semibold mb-3">Market Intelligence Trends</h3>
              <p className="text-gray-300 mb-4">
                Understanding the latest trends in government procurement and how to leverage market 
                intelligence for competitive advantage.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Technology</div>
              <h3 className="text-xl font-semibold mb-3">AI in Proposal Writing</h3>
              <p className="text-gray-300 mb-4">
                How artificial intelligence is transforming the proposal writing process and helping 
                companies create more compelling submissions.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Compliance</div>
              <h3 className="text-xl font-semibold mb-3">FAR/DFARS Compliance Guide</h3>
              <p className="text-gray-300 mb-4">
                Navigating the Federal Acquisition Regulation and Defense Federal Acquisition Regulation 
                Supplement requirements for government contracts.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="text-sm text-gray-400 mb-2">Strategy</div>
              <h3 className="text-xl font-semibold mb-3">Competitive Positioning</h3>
              <p className="text-gray-300 mb-4">
                Strategies for positioning your company competitively in government contracting 
                and standing out from the competition.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mt-12">
            <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-6">
              Subscribe to our newsletter to receive the latest insights, updates, and best practices 
              in government contracting and procurement intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Enter your email address"
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
  )
}
