export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Careers at Prop Shop AI</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Join Our Mission</h2>
            <p className="text-gray-300 mb-6">
              We&apos;re building the future of government procurement intelligence. Our platform levels the playing field 
              for challengers and incumbents alike, ensuring the most capable vendors win—not just those with the best connections.
            </p>
            <p className="text-gray-300">
              We&apos;re looking for passionate individuals who want to make a real impact in government contracting 
              and help democratize access to opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Open Positions</h3>
                          <p className="text-gray-300 mb-4">
              We&apos;re currently building our team. Check back soon for open positions in:
            </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Software Engineering</li>
                <li>• Product Management</li>
                <li>• Government Relations</li>
                <li>• Sales & Business Development</li>
                <li>• Marketing & Communications</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Why Join Us?</h3>
              <ul className="text-gray-300 space-y-3">
                <li>• Mission-driven work with real impact</li>
                <li>• Cutting-edge AI and government tech</li>
                <li>• Remote-first culture</li>
                <li>• Competitive compensation</li>
                <li>• Growth opportunities</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mt-8">
            <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
            <p className="text-gray-300 mb-4">
              Don&apos;t see a position that fits? We&apos;re always looking for talented individuals who share our vision.
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
