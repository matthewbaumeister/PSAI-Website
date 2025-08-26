"use client"

import type { Metadata } from 'next'
import { useState } from 'react'

export const metadata: Metadata = {
  title: 'Contact Us - Prop Shop AI',
  description: 'Get in touch with Prop Shop AI. Book a demo, ask questions, or learn how we can help your procurement needs.',
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const formData = new FormData(e.currentTarget)
      const formObject: any = {}
      
      // Convert FormData to object
      formData.forEach((value, key) => {
        if (key === 'interests') {
          if (!formObject[key]) {
            formObject[key] = []
          }
          formObject[key].push(value)
        } else {
          formObject[key] = value
        }
      })

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formObject)
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage(result.message)
        // Reset form
        e.currentTarget.reset()
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="contact-page">
      <div className="container">
        <div className="page-header">
          <h1>Let's Build Together</h1>
          <p className="subtitle">
            Join leading procurement teams accelerating their government contract success with Prop Shop AI. 
            Book a 1:1 demo with us to get started.
          </p>
        </div>

        <div className="contact-content">
          <div className="contact-form-section">
            <div className="form-header">
              <h2>Get Started Today</h2>
              <p>Tell us about your procurement needs and we'll show you how Prop Shop AI can help.</p>
            </div>

            {submitStatus === 'success' && (
              <div className="success-message">
                {submitMessage}
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="error-message">
                {submitMessage}
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName" 
                    required 
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    name="lastName" 
                    required 
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Work Email *</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="Enter your work email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="company">Company Name *</label>
                  <input 
                    type="text" 
                    id="company" 
                    name="company" 
                    required 
                    placeholder="Enter your company name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="jobTitle">Job Title</label>
                  <input 
                    type="text" 
                    id="jobTitle" 
                    name="jobTitle" 
                    placeholder="Enter your job title"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="companySize">Company Size</label>
                <select id="companySize" name="companySize">
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="industry">Industry</label>
                <select id="industry" name="industry">
                  <option value="">Select your industry</option>
                  <option value="technology">Technology</option>
                  <option value="defense">Defense & Aerospace</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="construction">Construction</option>
                  <option value="professional-services">Professional Services</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="interests">What are you interested in? *</label>
                <div className="checkbox-group">
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="demo" />
                    <span>Book a Demo</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="pricing" />
                    <span>Pricing Information</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="compliance" />
                    <span>PS.AI Compliance</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="search" />
                    <span>PS.AI Search</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="market-research" />
                    <span>Market Research</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="write" />
                    <span>PS.AI Write</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="partnership" />
                    <span>Partnership Opportunities</span>
                  </label>
                  <label className="checkbox-item">
                    <input type="checkbox" name="interests" value="other" />
                    <span>Other</span>
                  </label>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="message">Tell us about your procurement needs</label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={4}
                  placeholder="Describe your current procurement challenges, goals, or specific questions you have..."
                ></textarea>
              </div>

              <div className="form-group full-width">
                <label className="checkbox-item">
                  <input type="checkbox" name="newsletter" value="yes" />
                  <span>Subscribe to our newsletter for procurement insights and updates</span>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit →'}
              </button>
            </form>
          </div>

          <div className="contact-info-section">
            <div className="info-card">
              <h3>Why Choose Prop Shop AI?</h3>
              <ul>
                <li>Level the playing field with primes</li>
                <li>Automated compliance checks</li>
                <li>Real-time opportunity tracking</li>
                <li>Expert procurement guidance</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Get in Touch</h3>
              <div className="contact-methods">
                <div className="contact-method">
                  <strong>General Inquiries:</strong>
                  <p>hello@prop-shop.ai</p>
                </div>
                <div className="contact-method">
                  <strong>Sales & Demos:</strong>
                  <p>sales@prop-shop.ai</p>
                </div>
                <div className="contact-method">
                  <strong>Support:</strong>
                  <p>support@prop-shop.ai</p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Response Time</h3>
              <p>We typically respond to all inquiries within 24 hours during business days.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
