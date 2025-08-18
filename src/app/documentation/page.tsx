export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Documentation</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Platform Documentation</h2>
            <p className="text-gray-300">
              Comprehensive guides, tutorials, and reference materials to help you get the most out of 
              Prop Shop AI&apos;s procurement intelligence platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Platform Overview</li>
                <li>• Quick Start Guide</li>
                <li>• Account Setup</li>
                <li>• First Search</li>
                <li>• Basic Compliance Check</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Search</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Search Interface Guide</li>
                <li>• Advanced Filters</li>
                <li>• Opportunity Matching</li>
                <li>• Competitive Analysis</li>
                <li>• Export Results</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Compliance</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Compliance Templates</li>
                <li>• FAR/DFARS Requirements</li>
                <li>• Automated Validation</li>
                <li>• Quality Control</li>
                <li>• Error Resolution</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Market Research</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Market Intelligence</li>
                <li>• Competitor Analysis</li>
                <li>• Agency Insights</li>
                <li>• Trend Analysis</li>
                <li>• Custom Reports</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">PS.AI Write</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• AI Writing Assistant</li>
                <li>• Proposal Templates</li>
                <li>• Content Optimization</li>
                <li>• Collaboration Tools</li>
                <li>• Version Control</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">API Reference</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Authentication</li>
                <li>• Search API</li>
                <li>• Compliance API</li>
                <li>• Webhooks</li>
                <li>• Rate Limits</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Tutorials</h3>
              <p className="text-gray-300 mb-6">
                Step-by-step tutorials to help you master specific features and workflows 
                within the Prop Shop AI platform.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Creating Your First Search</li>
                <li>• Setting Up Compliance Checks</li>
                <li>• Generating Market Reports</li>
                <li>• Writing Proposals with AI</li>
                <li>• Integrating with Your Workflow</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Best Practices</h3>
              <p className="text-gray-300 mb-6">
                Proven strategies and best practices for maximizing your success with 
                government contracting and the Prop Shop AI platform.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Effective Search Strategies</li>
                <li>• Compliance Optimization</li>
                <li>• Competitive Positioning</li>
                <li>• Proposal Writing Tips</li>
                <li>• Team Collaboration</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
            <p className="text-gray-300 mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help you 
              get the most out of Prop Shop AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/contact" 
                className="inline-block bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Contact Support
              </a>
              <a 
                href="/faq" 
                className="inline-block bg-white/10 border border-white/20 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
              >
                View FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
