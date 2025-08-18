import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0B1220] text-gray-300">
      {/* CACHE BUST: 2025-01-12 15:30 - FORCE FOOTER REFRESH */}
      <div className="container mx-auto px-4 py-40">
        {/* Logo and Company Name Section */}
        <div className="flex items-center mb-16">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-gray-400">&nbsp;</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2rem', justifyContent: 'space-between' }}>
          {/* PRODUCTS */}
          <div>
            <h3 className="text-gray-400 font-semibold mb-4 text-sm">PRODUCTS</h3>
            <ul className="space-y-2 list-none">
              <li><Link href="/small-business-success-hub" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Small Business</Link></li>
              <li><Link href="/products/search" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Search</Link></li>
              <li><Link href="/products/compliance" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Compliance</Link></li>
              <li><Link href="/products/market-research" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Market Research</Link></li>
              <li><Link href="/products/write" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Write</Link></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="text-gray-400 font-semibold mb-4 text-sm">COMPANY</h3>
            <ul className="space-y-2 list-none">
              <li><Link href="/about" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">About</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Careers</Link></li>
              <li><Link href="/security" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Security</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Terms</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Privacy</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">FAQ</Link></li>
            </ul>
          </div>

          {/* RESOURCES */}
          <div>
            <h3 className="text-gray-400 font-semibold mb-4 text-sm">RESOURCES</h3>
            <ul className="space-y-2 list-none">
              <li><Link href="/blog" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Blog</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Contact Us</Link></li>
              <li><Link href="/customers" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Customers</Link></li>
              <li><Link href="/events" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Events</Link></li>
              <li><Link href="/documentation" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Documentation</Link></li>
              <li><Link href="/guides" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Guides</Link></li>
              <li><Link href="/community" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Community</Link></li>
              <li><Link href="/market-research-reports" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Published Market Research Reports</Link></li>
              <li><Link href="/research" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Research</Link></li>
            </ul>
          </div>

          {/* GUIDES */}
          <div>
            <h3 className="text-gray-400 font-semibold mb-4 text-sm">GUIDES</h3>
            <ul className="space-y-2 list-none">
              <li><Link href="/guides/small-business" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Small Business</Link></li>
              <li><Link href="/guides/search" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Search</Link></li>
              <li><Link href="/guides/compliance" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Compliance</Link></li>
              <li><Link href="/guides/market-research" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Market Research</Link></li>
              <li><Link href="/guides/write" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">PS.AI Write</Link></li>
              <li><Link href="/guides/dod-contracting" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">DOD Contracting</Link></li>
              <li><Link href="/guides/agency-specific" className="text-gray-400 hover:text-gray-200 transition-colors text-xs">Agency Specific</Link></li>
            </ul>
          </div>

          {/* FOLLOW US */}
          <div>
            <h3 className="text-gray-400 font-semibold mb-4 text-sm">FOLLOW US</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider with minimal margins */}
        <div className="footer-divider my-1 border-t border-gray-600"></div>

        {/* Bottom Section */}
        <div className="pt-1 pb-2">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              Copyright © {currentYear} Make Ready Consulting LLC, DBA Prop Shop AI. All rights reserved.
            </div>
            <div className="text-gray-400 text-sm">
              <Link href="/terms" className="hover:text-gray-200 transition-colors">Terms of Use</Link>
              <span className="mx-2">&nbsp;&amp;&nbsp;</span>
              <Link href="/privacy" className="hover:text-gray-200 transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}