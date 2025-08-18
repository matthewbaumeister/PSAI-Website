export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Our Customers</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Success Stories</h2>
            <p className="text-gray-300">
              Discover how government contractors and agencies are leveraging Prop Shop AI to transform 
              their procurement processes and achieve better outcomes through data-driven decision making.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Government Contractors</h3>
              <p className="text-gray-300 mb-6">
                Small to medium-sized contractors using our platform to compete effectively against 
                larger incumbents and win government contracts.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Increased win rates by 40%</li>
                <li>• Reduced proposal development time by 60%</li>
                <li>• Improved compliance accuracy to 98%</li>
                <li>• Enhanced competitive positioning</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Government Agencies</h3>
              <p className="text-gray-300 mb-6">
                Federal, state, and local agencies leveraging our intelligence platform to make 
                more informed procurement decisions.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Streamlined vendor evaluation process</li>
                <li>• Enhanced transparency in procurement</li>
                <li>• Improved vendor diversity</li>
                <li>• Reduced procurement cycle times</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Customer Testimonials</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl text-[#9AF23A] mb-4">&quot;</div>
                <p className="text-gray-300 mb-4">
                  &quot;Prop Shop AI has transformed how we approach government contracting. 
                  The intelligence insights are invaluable.&quot;
                </p>
                <div className="text-sm text-gray-400">- Defense Contractor</div>
              </div>
              <div className="text-center">
                <div className="text-4xl text-[#9AF23A] mb-4">&quot;</div>
                <p className="text-gray-300 mb-4">
                  &quot;Finally, a platform that levels the playing field. We&apos;re competing 
                  and winning against much larger companies.&quot;
                </p>
                <div className="text-sm text-gray-400">- Small Business Owner</div>
              </div>
              <div className="text-center">
                <div className="text-4xl text-[#9AF23A] mb-4">&quot;</div>
                <p className="text-gray-300 mb-4">
                  &quot;The compliance automation has saved us countless hours and 
                  eliminated costly mistakes.&quot;
                </p>
                <div className="text-sm text-gray-400">- Government Relations Director</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Join Our Success Stories</h3>
              <p className="text-gray-300 mb-6">
                Ready to transform your government contracting approach? See how Prop Shop AI 
                can help you compete more effectively and win more contracts.
              </p>
              <a 
                href="/book-demo" 
                className="inline-block bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Book a Demo
              </a>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Case Studies</h3>
              <p className="text-gray-300 mb-6">
                Dive deeper into how our customers are achieving success with detailed case studies 
                and implementation stories.
              </p>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
