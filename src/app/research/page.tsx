export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Research & Insights</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Market Intelligence</h2>
            <p className="text-gray-300">
              In-depth research and analysis on government procurement trends, market dynamics, 
              and the evolving landscape of government contracting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Market Reports</h3>
              <p className="text-gray-300 mb-6">
                Comprehensive analysis of government procurement trends, spending patterns, 
                and competitive landscapes across different sectors and agencies.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Annual Procurement Trends</li>
                <li>• Sector-Specific Analysis</li>
                <li>• Competitive Intelligence</li>
                <li>• Spending Pattern Reports</li>
                <li>• Agency Performance Metrics</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Industry Insights</h3>
              <p className="text-gray-300 mb-6">
                Expert analysis and commentary on the latest developments in government contracting, 
                regulatory changes, and emerging opportunities.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Regulatory Updates</li>
                <li>• Policy Analysis</li>
                <li>• Technology Trends</li>
                <li>• Best Practice Research</li>
                <li>• Innovation Studies</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Featured Research</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">AI in Government Procurement</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Analysis of how artificial intelligence is transforming government procurement 
                  processes and vendor selection.
                </p>
                <div className="text-xs text-gray-400">Research Report • 2024</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Small Business Opportunities</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Comprehensive study of opportunities and challenges for small businesses 
                  in government contracting.
                </p>
                <div className="text-xs text-gray-400">Market Analysis • 2024</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Compliance Automation Impact</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Research on the impact of automated compliance checking on proposal success rates 
                  and efficiency.
                </p>
                <div className="text-xs text-gray-400">Impact Study • 2024</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Data Analytics</h3>
              <p className="text-gray-300 mb-6">
                Leverage our proprietary data and analytics to gain insights into government 
                procurement patterns and opportunities.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Spending Analytics</li>
                <li>• Vendor Performance Data</li>
                <li>• Award Pattern Analysis</li>
                <li>• Competitive Intelligence</li>
                <li>• Predictive Analytics</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Custom Research</h3>
              <p className="text-gray-300 mb-6">
                Commission custom research and analysis tailored to your specific needs and 
                market interests.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Market Entry Analysis</li>
                <li>• Competitive Assessment</li>
                <li>• Opportunity Identification</li>
                <li>• Risk Analysis</li>
                <li>• Strategic Planning Support</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Research Partnership</h3>
              <p className="text-gray-300 mb-6">
                Partner with our research team to conduct studies, surveys, and analysis 
                that benefit the entire government contracting community.
              </p>
              <a 
                href="/contact" 
                className="inline-block bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Partner With Us
              </a>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Stay Informed</h3>
              <p className="text-gray-300 mb-6">
                Subscribe to receive the latest research reports, market insights, and 
                industry analysis directly to your inbox.
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
