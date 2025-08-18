export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Frequently Asked Questions</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Common Questions</h2>
            <p className="text-gray-300">
              Find answers to the most frequently asked questions about Prop Shop AI, our platform, 
              and government contracting in general.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">What is Prop Shop AI?</h3>
              <p className="text-gray-300">
                Prop Shop AI is a procurement intelligence platform that levels the playing field for government contractors. 
                We provide AI-powered tools for opportunity search, compliance automation, market research, and proposal writing 
                to help companies compete more effectively in government contracting.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">How does Prop Shop AI help small businesses?</h3>
              <p className="text-gray-300">
                Our platform provides small businesses with the same intelligence and tools that larger companies have access to. 
                We automate compliance checking, provide market insights, and help identify opportunities that match your capabilities, 
                allowing you to compete effectively against larger incumbents.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">What are the main features of the platform?</h3>
              <p className="text-gray-300">
                Our platform includes four main products: PS.AI Search for finding opportunities, PS.AI Compliance for automated 
                compliance checking, PS.AI Market Research for competitive intelligence, and PS.AI Write for AI-assisted proposal writing. 
                Each tool is designed to streamline different aspects of the government contracting process.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">How accurate is the compliance automation?</h3>
              <p className="text-gray-300">
                Our compliance automation tools achieve 98% accuracy in identifying FAR/DFARS requirements and potential compliance issues. 
                The system continuously learns from new regulations and user feedback to maintain high accuracy levels.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Do you offer training and support?</h3>
              <p className="text-gray-300">
                Yes, we provide comprehensive training, documentation, and support to help you get the most out of our platform. 
                This includes onboarding sessions, video tutorials, written guides, and ongoing customer support.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">What types of government contracts do you support?</h3>
              <p className="text-gray-300">
                We support all major types of government contracts including fixed-price, cost-reimbursement, time-and-materials, 
                and indefinite-delivery contracts. Our platform covers contracts from federal, state, and local government agencies.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">How do I get started with Prop Shop AI?</h3>
              <p className="text-gray-300">
                Getting started is easy! Simply book a demo to see the platform in action, and our team will guide you through 
                the setup process. We offer a 60-day challenge where if you don&apos;t submit a compliant proposal in your first 60 days, 
                we&apos;ll extend your subscription free until you do.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Is my data secure?</h3>
              <p className="text-gray-300">
                Absolutely. We take data security seriously and implement enterprise-grade security measures including encryption, 
                secure data centers, and compliance with government security standards. Your proprietary information is protected 
                and never shared with competitors.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Can I integrate Prop Shop AI with my existing tools?</h3>
              <p className="text-gray-300">
                Yes, our platform offers API access and integration capabilities with popular CRM systems, proposal management tools, 
                and other business software. We can work with your existing workflow to ensure a smooth implementation.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">What if I need help with a specific government agency?</h3>
              <p className="text-gray-300">
                We provide agency-specific guidance and submission guides for major government agencies. Our platform includes 
                insights into agency preferences, requirements, and evaluation criteria to help you tailor your approach.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mt-12">
            <h3 className="text-xl font-semibold mb-4">Still Have Questions?</h3>
            <p className="text-gray-300 mb-6">
              Can&apos;t find the answer you&apos;re looking for? Our team is here to help with any specific questions 
              about government contracting or our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/contact" 
                className="inline-block bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                Contact Support
              </a>
              <a 
                href="/book-demo" 
                className="inline-block bg-white/10 border border-white/20 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
