export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Community</h1>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
            <p className="text-gray-300">
              Connect with fellow government contractors, share insights, and stay updated on the latest 
              developments in procurement intelligence and government contracting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Discussion Forum</h3>
              <p className="text-gray-300 mb-6">
                Engage with other government contractors in our community forum. Share experiences, 
                ask questions, and learn from peers in the industry.
              </p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li>• Best Practices Sharing</li>
                <li>• Q&A Sessions</li>
                <li>• Success Stories</li>
                <li>• Industry Discussions</li>
                <li>• Networking Opportunities</li>
              </ul>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Expert Network</h3>
              <p className="text-gray-300 mb-6">
                Connect with industry experts, government relations professionals, and procurement 
                specialists who can provide valuable insights and guidance.
              </p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li>• Industry Experts</li>
                <li>• Government Relations</li>
                <li>• Procurement Specialists</li>
                <li>• Legal Advisors</li>
                <li>• Technology Partners</li>
              </ul>
              <div className="text-sm text-gray-400">Coming Soon</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-semibold mb-6">Community Events</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Monthly Meetups</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Virtual and in-person meetups to discuss industry trends and share experiences.
                </p>
                <div className="text-xs text-gray-400">Monthly • Virtual & In-Person</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Expert Panels</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Panel discussions featuring industry leaders and government contracting experts.
                </p>
                <div className="text-xs text-gray-400">Quarterly • Virtual</div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Workshop Series</h4>
                <p className="text-gray-300 text-sm mb-2">
                  Hands-on workshops focused on specific aspects of government contracting.
                </p>
                <div className="text-xs text-gray-400">Bi-Monthly • Virtual</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Resource Sharing</h3>
              <p className="text-gray-300 mb-6">
                Access and share valuable resources, templates, and tools contributed by community members.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Proposal Templates</li>
                <li>• Compliance Checklists</li>
                <li>• Market Research Reports</li>
                <li>• Best Practice Guides</li>
                <li>• Tool Recommendations</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Mentorship Program</h3>
              <p className="text-gray-300 mb-6">
                Connect with experienced government contractors who can provide guidance and mentorship.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• One-on-One Mentoring</li>
                <li>• Group Mentorship</li>
                <li>• Skill Development</li>
                <li>• Career Guidance</li>
                <li>• Industry Insights</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Get Involved</h3>
              <p className="text-gray-300 mb-6">
                Ready to join our community? Sign up to receive updates about upcoming events, 
                forum access, and networking opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#2D5BFF]"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-[#2D5BFF] to-[#9AF23A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  Join Community
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Community Guidelines</h3>
              <p className="text-gray-300 mb-6">
                Our community is built on mutual respect, professionalism, and shared learning. 
                Review our guidelines to ensure a positive experience for all members.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>• Professional Conduct</li>
                <li>• Respectful Communication</li>
                <li>• Confidentiality</li>
                <li>• No Self-Promotion</li>
                <li>• Constructive Feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
