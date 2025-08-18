export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Guides & Resources</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Expert Guidance</h2>
            <p className="text-gray-300">
              Comprehensive guides and resources to help you navigate government contracting, 
              maximize your success with Prop Shop AI, and stay ahead of the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Search Guide</h3>
              <p className="text-gray-300 mb-4">
                Master the art of finding and evaluating government opportunities with our 
                comprehensive search platform guide.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Compliance Guide</h3>
              <p className="text-gray-300 mb-4">
                Navigate complex compliance requirements with confidence using our automated 
                compliance checking tools.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Market Research Guide</h3>
              <p className="text-gray-300 mb-4">
                Leverage market intelligence to understand your competitive landscape and 
                position your company for success.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Write Guide</h3>
              <p className="text-gray-300 mb-4">
                Create compelling proposals faster with AI-powered writing assistance and 
                proven templates.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">DOD Contracting Guide</h3>
              <p className="text-gray-300 mb-4">
                Essential strategies and best practices for navigating Department of Defense 
                contracting requirements.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Agency Specific Submission Guides</h3>
              <p className="text-gray-300 mb-4">
                Detailed guides for submitting proposals to specific government agencies 
                and understanding their unique requirements.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Quick Start Guides</h3>
              <p className="text-gray-300 mb-6">
                Get up and running quickly with our step-by-step quick start guides for 
                each platform feature.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• First Search in 5 Minutes</li>
                <li>• Compliance Check Setup</li>
                <li>• Market Research Basics</li>
                <li>• AI Writing Assistant</li>
                <li>• Team Collaboration</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Advanced Strategies</h3>
              <p className="text-gray-300 mb-6">
                Take your government contracting to the next level with advanced strategies 
                and optimization techniques.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Competitive Analysis Deep Dive</li>
                <li>• Proposal Optimization</li>
                <li>• Risk Assessment</li>
                <li>• Performance Metrics</li>
                <li>• Scaling Your Operations</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Video Tutorials</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Platform Overview</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Complete walkthrough of the Prop Shop AI platform and its key features.
                </p>
                <div className="text-xs text-gray-400">Video • 15 minutes</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Search Mastery</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Advanced search techniques and filtering strategies for finding the best opportunities.
                </p>
                <div className="text-xs text-gray-400">Video • 20 minutes</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Compliance Automation</h4>
                <p className="text-gray-300 text-sm mb-2">
                  How to use automated compliance checking to reduce errors and save time.
                </p>
                <div className="text-xs text-gray-400">Video • 12 minutes</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Request a Custom Guide</h3>
              <p className="text-gray-300 mb-6">
                              Need guidance on a specific topic or workflow? We can create custom guides 
              tailored to your organization&apos;s needs.
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
                Subscribe to receive notifications when new guides and resources are published.
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
