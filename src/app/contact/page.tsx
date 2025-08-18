'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      timeline: formData.get('timeline') as string,
      message: formData.get('message') as string
    }
    
    try {
      const subject = `Contact from ${data.name} - ${data.company}`
      const body = `
Name: ${data.name}
Email: ${data.email}
Company: ${data.company}
Phone: ${data.phone}
Timeline: ${data.timeline}

Message:
${data.message}`
      
      const mailtoLink = `mailto:info@prop-shop.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      setTimeout(() => {
        window.location.href = mailtoLink
        setSubmitStatus('success')
        setIsSubmitting(false)
        
        setTimeout(() => {
          e.currentTarget.reset()
          setSubmitStatus('idle')
        }, 3000)
      }, 500)
    } catch (error) {
      console.error('Error sending email:', error)
      setSubmitStatus('error')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      color: 'var(--text-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: 1.6,
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          {/* Left Column - Content */}
          <div style={{ paddingRight: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                height: '1px',
                width: '48px',
                background: 'linear-gradient(to right, var(--accent-secondary), var(--accent-primary))'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--accent-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                GET STARTED
              </span>
            </div>
            
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              color: 'var(--text-primary)'
            }}>
              Ready to transform your procurement process?
              <span style={{
                background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary), var(--accent-primary))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block'
              }}>
                procurement process?
              </span>
            </h1>
            
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.125rem',
              lineHeight: 1.75,
              marginBottom: '3rem'
            }}>
              Get in touch and let&apos;s discuss how Prop Shop AI can help you win more contracts with AI-powered proposal generation.
            </p>

            {/* Contact Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Email Card */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                <div style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.2), rgba(154, 242, 58, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>✉</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Email us directly</h3>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>info@prop-shop.ai</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>We&apos;ll respond within 24 hours</p>
                </div>
              </div>
              
              {/* Book Demo Card */}
              <div 
                onClick={() => window.location.href = '/book-demo'}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.2), rgba(154, 242, 58, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>📅</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Book a demo</h3>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Schedule 30 minutes with our team</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>See Prop Shop AI in action</p>
                </div>
                <svg style={{ color: 'var(--text-secondary)', transition: 'color 0.3s ease' }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              
              {/* Live Chat Card */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(154, 242, 58, 0.3)'
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                <div style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.5rem',
                  background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.2), rgba(154, 242, 58, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>💬</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Live chat</h3>
                  <p style={{ color: 'var(--accent-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Available Mon-Fri, 9am-6pm EST</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Get instant answers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Contact our team</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fill out the form and we&apos;ll be in touch shortly.</p>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }} htmlFor="name">First name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--input-bg)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }} htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john@company.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--input-bg)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }} htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  placeholder="Your company name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--input-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }} htmlFor="phone">Phone number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="(555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--input-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }} htmlFor="timeline">Timeline</label>
                <select
                  id="timeline"
                  name="timeline"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--input-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select timeline</option>
                  <option value="Immediate">Immediate</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6+ months">6+ months</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }} htmlFor="message">How can we help?</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your current procurement challenges..."
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--input-bg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  position: 'relative',
                  background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                  padding: '1px',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '1.5rem'
                }}
              >
                <div style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '0.45rem',
                  padding: '0.875rem 1.5rem',
                  fontWeight: 600,
                  color: 'white',
                  transition: 'background 0.3s ease'
                }}>
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </div>
              </button>

              {submitStatus === 'success' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  marginTop: '1rem',
                  background: 'rgba(154, 242, 58, 0.1)',
                  border: '1px solid rgba(154, 242, 58, 0.2)',
                  color: 'var(--accent-secondary)'
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Message sent! We&apos;ll get back to you within 24 hours.
                </div>
              )}

              {submitStatus === 'error' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  marginTop: '1rem',
                  background: 'rgba(255, 122, 41, 0.1)',
                  border: '1px solid rgba(255, 122, 41, 0.2)',
                  color: 'var(--accent-primary)'
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Something went wrong. Please try again or email us directly.
                </div>
              )}
            </form>

            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5
              }}>
                By contacting us, you agree to our 
                <a href="/privacy" style={{ color: 'var(--accent-primary)', textDecoration: 'none', transition: 'color 0.3s ease' }}> Privacy Policy</a> and 
                <a href="/terms" style={{ color: 'var(--accent-primary)', textDecoration: 'none', transition: 'color 0.3s ease' }}> Terms of Service</a>. 
                We&apos;ll use your information to respond to your inquiry and improve our services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
