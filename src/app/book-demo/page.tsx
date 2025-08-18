'use client'

import { useState } from 'react'

export default function BookDemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [selectedDate, setSelectedDate] = useState('')
  const [primaryTime, setPrimaryTime] = useState('')

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
      role: formData.get('role') as string,
      companySize: formData.get('companySize') as string,
      useCase: formData.get('useCase') as string,
      timeline: formData.get('timeline') as string,
      date: selectedDate,
      primaryTime: primaryTime,
      message: formData.get('message') as string
    }
    
    try {
      const subject = `Demo Request from ${data.name} - ${data.company}`
      const body = `
Demo Request Details:
Name: ${data.name}
Email: ${data.email}
Company: ${data.company}
Phone: ${data.phone}
Role: ${data.role}
Company Size: ${data.companySize}
Use Case: ${data.useCase}
Timeline: ${data.timeline}
Preferred Date: ${data.date}
Primary Time: ${data.primaryTime}

Message:
${data.message}

        We&apos;ll contact you within 2 hours to confirm your demo slot.`
      
      const mailtoLink = `mailto:info@prop-shop.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      setTimeout(() => {
        window.location.href = mailtoLink
        setSubmitStatus('success')
        setIsSubmitting(false)
        
        setTimeout(() => {
          e.currentTarget.reset()
          setSelectedDate('')
          setPrimaryTime('')
          setSubmitStatus('idle')
        }, 3000)
      }, 500)
    } catch (error) {
      console.error('Error sending demo request:', error)
      setSubmitStatus('error')
      setIsSubmitting(false)
    }
  }



  return (
    <div className="page-content" style={{
      minHeight: '100vh',
      color: 'white',
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
          alignItems: 'start'
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
                background: 'linear-gradient(to right, #9AF23A, #2D5BFF)'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#9AF23A',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>Book Your Demo</span>
            </div>
            
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: '1.5rem'
            }}>
              See Prop Shop AI in
              <span style={{
                background: 'linear-gradient(to right, #2D5BFF, #9AF23A, #FF7A29)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'block',
                marginTop: '0.5rem'
              }}>action</span>
            </h1>
            
            <p style={{
              color: '#9CA3AF',
              fontSize: '1.125rem',
              lineHeight: 1.75,
              marginBottom: '2rem'
            }}>
              Get a personalized 30-minute demo of our AI-powered procurement platform. See how we can help you win more government contracts.
            </p>

            {/* Demo Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2D5BFF, #9AF23A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}>✓</div>
                <span style={{ fontSize: '0.875rem' }}>Live platform walkthrough</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9AF23A, #FF7A29)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}>✓</div>
                <span style={{ fontSize: '0.875rem' }}>Custom use case discussion</span>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF7A29, #2D5BFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}>✓</div>
                <span style={{ fontSize: '0.875rem' }}>Pricing and implementation plan</span>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(45, 91, 255, 0.1), rgba(154, 242, 58, 0.1))',
              border: '1px solid rgba(45, 91, 255, 0.2)',
              borderRadius: '1rem',
              marginTop: '2rem'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Questions before booking?</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Reach out to our team at{' '}
                <a href="mailto:info@prop-shop.ai" style={{ color: '#9AF23A', textDecoration: 'none' }}>
                  info@prop-shop.ai
                </a>
              </p>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                We typically respond within 2 hours during business hours.
              </p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            padding: '2rem',
            position: 'sticky',
            top: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>Schedule Your Demo</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Name and Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Company and Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Role and Company Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Your Role *
                  </label>
                  <select
                    name="role"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select your role</option>
                    <option value="CEO/Founder">CEO/Founder</option>
                    <option value="VP/Director">VP/Director</option>
                    <option value="Manager">Manager</option>
                    <option value="Proposal Writer">Proposal Writer</option>
                    <option value="Business Development">Business Development</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Company Size *
                  </label>
                  <select
                    name="companySize"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select company size</option>
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-1000 employees">201-1000 employees</option>
                    <option value="1000+ employees">1000+ employees</option>
                  </select>
                </div>
              </div>

              {/* Use Case and Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Primary Use Case *
                  </label>
                  <select
                    name="useCase"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select use case</option>
                    <option value="Proposal Writing">Proposal Writing</option>
                    <option value="Market Research">Market Research</option>
                    <option value="Compliance Management">Compliance Management</option>
                    <option value="Contract Search">Contract Search</option>
                    <option value="Small Business Support">Small Business Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Timeline *
                  </label>
                  <select
                    name="timeline"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select timeline</option>
                    <option value="Immediate (within 30 days)">Immediate (within 30 days)</option>
                    <option value="Next 3 months">Next 3 months</option>
                    <option value="Next 6 months">Next 6 months</option>
                    <option value="Just exploring">Just exploring</option>
                  </select>
                </div>
              </div>

              {/* Date and Time Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Primary Time *
                  </label>
                  <input
                    type="time"
                    value={primaryTime}
                    onChange={(e) => setPrimaryTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: '#0B1220',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>



              {/* Message */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Additional Details
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Tell us about your specific needs, questions, or what you'd like to see in the demo..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0B1220',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(to right, #2D5BFF, #9AF23A)',
                  border: 'none',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {isSubmitting ? 'Scheduling Demo...' : 'Schedule Demo'}
              </button>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#22C55E',
                  textAlign: 'center'
                }}>
                  Demo request sent! We&apos;ll contact you within 2 hours to confirm.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  color: '#EF4444',
                  textAlign: 'center'
                }}>
                  Something went wrong. Please try again or contact us directly.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
