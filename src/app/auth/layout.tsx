import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prop Shop AI
            </h1>
            <p className="text-gray-600">
              The procurement intelligence platform
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
