import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Simple, clean header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mb-4">
              <span className="text-lg font-bold text-white">PS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prop Shop AI
            </h1>
            <p className="text-gray-600">
              The procurement intelligence platform
            </p>
          </div>
          
          {/* Render the auth pages */}
          {children}
        </div>
      </div>
    </div>
  )
}
