import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="contact-page">
      <div className="container">
        <div className="page-header">
          <h1>Prop Shop AI</h1>
          <p className="subtitle">
            The procurement intelligence platform
          </p>
        </div>
        
        <div className="contact-content">
          {children}
        </div>
      </div>
    </main>
  )
}
