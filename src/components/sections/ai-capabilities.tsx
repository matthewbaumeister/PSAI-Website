

export function AICapabilities() {
  return (
    <section className="py-24 bg-[#0B1220] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2D5BFF]/5 via-transparent to-[#9AF23A]/5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-20">
          <h2 className="text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            The compliance engine for challengers.
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Tools that showcase innovation over incumbency. Bring your capture, BD, and SMEs into one workspace.
          </p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid gap-8 lg:grid-cols-2 mb-20">
          {/* Proposal Intelligence Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D5BFF]/20 to-[#9AF23A]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:shadow-[#2D5BFF]/20 transition-all duration-500 hover:border-[#2D5BFF]/30 hover:transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-white">
                  Proposal Intelligence
                </h3>
                <span className="bg-[#2D5BFF]/20 text-[#2D5BFF] border border-[#2D5BFF]/30 px-4 py-2 rounded-full text-sm font-mono font-semibold">
                  Core
                </span>
              </div>
              
              <div className="space-y-8">
                {/* PI Feature */}
                <div className="flex items-start space-x-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2D5BFF]/30 to-[#2D5BFF]/10 flex items-center justify-center flex-shrink-0 border border-[#2D5BFF]/30 shadow-lg">
                    <span className="text-lg font-bold text-white font-mono">PI</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-3">Live Contract Feed</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Real-time government opportunity alerts with advanced search filters and competitive analysis.
                    </p>
                  </div>
                </div>
                
                {/* AI Feature */}
                <div className="flex items-start space-x-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#9AF23A]/30 to-[#9AF23A]/10 flex items-center justify-center flex-shrink-0 border border-[#9AF23A]/30 shadow-lg">
                    <span className="text-lg font-bold text-white font-mono">AI</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-3">Smart Matching</h4>
                    <p className="text-gray-300 leading-relaxed">
                      AI-powered opportunity matching based on your capabilities, past performance, and win themes.
                    </p>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-8 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-4 px-6 rounded-xl hover:from-[#1e4bd8] hover:to-[#7dd32e] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Explore Intelligence →
              </button>
            </div>
          </div>

          {/* Compliance Templates Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A29]/20 to-[#2D5BFF]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl hover:shadow-[#FF7A29]/20 transition-all duration-500 hover:border-[#FF7A29]/30 hover:transform hover:scale-[1.02]">
              <h3 className="text-3xl font-bold text-white mb-8">
                Compliance Templates
              </h3>
              
              <div className="space-y-8">
                {/* CT Feature */}
                <div className="flex items-start space-x-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF7A29]/30 to-[#FF7A29]/10 flex items-center justify-center flex-shrink-0 border border-[#FF7A29]/30 shadow-lg">
                    <span className="text-lg font-bold text-white font-mono">CT</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-3">Auto-Fill Structures</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Pre-built templates with compliance baked in that pass first review and reduce submission time.
                    </p>
                  </div>
                </div>
                
                {/* QC Feature */}
                <div className="flex items-start space-x-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF7A29]/30 to-[#FF7A29]/10 flex items-center justify-center flex-shrink-0 border border-[#FF7A29]/30 shadow-lg">
                    <span className="text-lg font-bold text-white font-mono">QC</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-3">Quality Control</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Automated validation for FAR, DFARS, and agency-specific requirements with real-time guidance.
                    </p>
                  </div>
                </div>
              </div>
              
              <button className="w-full mt-8 border-2 border-[#2D5BFF] text-[#2D5BFF] font-semibold py-4 px-6 rounded-xl hover:bg-[#2D5BFF]/10 transition-all duration-300 transform hover:scale-105">
                View Templates →
              </button>
            </div>
          </div>
        </div>

        {/* Additional Capabilities Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-20">
          {/* Diversity Advantage */}
          <div className="group text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2D5BFF]/20 to-[#2D5BFF]/5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#2D5BFF]/30 to-[#2D5BFF]/10 border border-[#2D5BFF]/30 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-[#2D5BFF]/20 transition-all duration-300">
                <span className="text-2xl font-bold text-white font-mono">DA</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Diversity Advantage</h3>
            <p className="text-gray-300 leading-relaxed">
              Tools that showcase innovation over incumbency and highlight your unique value proposition
            </p>
          </div>
          
          {/* Collaboration Tools */}
          <div className="group text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9AF23A]/20 to-[#9AF23A]/5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#9AF23A]/30 to-[#9AF23A]/10 border border-[#9AF23A]/30 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-[#9AF23A]/20 transition-all duration-300">
                <span className="text-2xl font-bold text-white font-mono">CT</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Collaboration Tools</h3>
            <p className="text-gray-300 leading-relaxed">
              Bring your capture, BD, and SMEs into one workspace with real-time editing and version control
            </p>
          </div>
          
          {/* Win Probability */}
          <div className="group text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A29]/20 to-[#FF7A29]/5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FF7A29]/30 to-[#FF7A29]/10 border border-[#FF7A29]/30 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-[#FF7A29]/20 transition-all duration-300">
                <span className="text-2xl font-bold text-white font-mono">WP</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Win Probability</h3>
            <p className="text-gray-300 leading-relaxed">
              Predictive analytics for proposal success and competitive positioning against prime contractors
            </p>
          </div>
          
          {/* Past Performance */}
          <div className="group text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A29]/20 to-[#FF7A29]/5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-[#FF7A29]/30 to-[#FF7A29]/10 border border-[#FF7A29]/30 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-[#FF7A29]/20 transition-all duration-300">
                <span className="text-2xl font-bold text-white font-mono">PP</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Past Performance</h3>
            <p className="text-gray-300 leading-relaxed">
              Automated past performance documentation and tracking for CPARS and contractor evaluations
            </p>
          </div>
        </div>

        {/* Guarantee Statement */}
        <div className="text-center">
          <div className="group relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D5BFF]/20 via-[#9AF23A]/20 to-[#FF7A29]/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl shadow-2xl group-hover:shadow-[#2D5BFF]/20 transition-all duration-500">
              <h3 className="text-3xl font-bold text-white mb-6">
                The prime advantage — without the prime.
              </h3>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                If you don&apos;t submit a compliant proposal in your first 60 days, we&apos;ll extend your subscription free until you do.
              </p>
              <button className="bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-5 px-10 rounded-xl hover:from-[#1e4bd8] hover:to-[#7dd32e] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg">
                Start Your 60-Day Challenge →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
