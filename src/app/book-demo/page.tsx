'use client'

import { useState } from 'react'

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    companySize: '',
    phone: '',
    useCase: '',
    timeline: '',
    budget: '',
    additionalInfo: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subject: 'Demo Request',
          message: `Demo Request Details:
Company: ${formData.company}
Company Size: ${formData.companySize}
Use Case: ${formData.useCase}
Timeline: ${formData.timeline}
Budget: ${formData.budget}
Additional Info: ${formData.additionalInfo}`
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          companySize: '',
          phone: '',
          useCase: '',
          timeline: '',
          budget: '',
          additionalInfo: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contact-page">
      <div className="container">
        <div className="page-header">
          <h1>Book Your Demo</h1>
          <p className="subtitle">
            See how Prop Shop AI can transform your government contracting strategy. 
            Get a personalized walkthrough of our platform tailored to your needs.
          </p>
        </div>

        <div className="contact-content">
          <div className="contact-form-section">
            <div className="form-header">
              <h2>Schedule Your Demo</h2>
              <p>Fill out the form below and we'll get back to you within 24 hours to schedule your personalized demo.</p>
            </div>

            {submitStatus === 'success' && (
              <div className="success-message">
                Thank you! We've received your demo request and will contact you within 24 hours to schedule your personalized demo.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="error-message">
                There was an error submitting your request. Please try again or contact us directly.
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
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
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
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="companySize">Company Size *</label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    required
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

              <div className="form-group full-width">
                <label htmlFor="useCase">Primary Use Case *</label>
                <select
                  id="useCase"
                  name="useCase"
                  value={formData.useCase}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select your primary use case</option>
                  <option value="Finding government opportunities">Finding government opportunities</option>
                  <option value="Compliance and proposal writing">Compliance and proposal writing</option>
                  <option value="Market research and intelligence">Market research and intelligence</option>
                  <option value="CRM and opportunity tracking">CRM and opportunity tracking</option>
                  <option value="Contract management">Contract management</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="timeline">Timeline for Implementation</label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                  >
                    <option value="">Select timeline</option>
                    <option value="Immediate (within 30 days)">Immediate (within 30 days)</option>
                    <option value="Short term (1-3 months)">Short term (1-3 months)</option>
                    <option value="Medium term (3-6 months)">Medium term (3-6 months)</option>
                    <option value="Long term (6+ months)">Long term (6+ months)</option>
                    <option value="Just exploring">Just exploring</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="budget">Budget Range</label>
                  <select
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                  >
                    <option value="">Select budget range</option>
                    <option value="Under $5K">Under $5K</option>
                    <option value="$5K - $25K">$5K - $25K</option>
                    <option value="$25K - $100K">$25K - $100K</option>
                    <option value="$100K+">$100K+</option>
                    <option value="Not sure yet">Not sure yet</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="additionalInfo">Additional Information</label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us more about your specific needs, current challenges, or any questions you have..."
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Request Demo'}
              </button>
            </form>
          </div>

          <div className="contact-info-section">
            <div className="info-card">
              <h3>What to Expect</h3>
              <ul>
                <li><strong>Personalized Walkthrough:</strong> See our platform configured for your specific use case</li>
                <li><strong>Live Q&A:</strong> Get answers to your questions in real-time</li>
                <li><strong>ROI Discussion:</strong> Understand the potential impact on your business</li>
                <li><strong>Next Steps:</strong> Clear path forward if you decide to proceed</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Demo Details</h3>
              <ul>
                <li><strong>Duration:</strong> 30-45 minutes</li>
                <li><strong>Format:</strong> Video call (Zoom, Teams, or your preference)</li>
                <li><strong>Participants:</strong> Your team members are welcome to join</li>
                <li><strong>Preparation:</strong> No preparation needed - just bring your questions</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Why Choose Prop Shop AI?</h3>
              <ul>
                <li><strong>Level Playing Field:</strong> Compete with big companies on equal footing</li>
                <li><strong>AI-Powered Intelligence:</strong> Access the same tools the giants use</li>
                <li><strong>Proven Results:</strong> Success stories from companies like yours</li>
                <li><strong>Dedicated Support:</strong> Personal attention from our expert team</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Ready to Get Started?</h3>
              <p>Don't wait to level up your government contracting game. Our team is ready to show you how Prop Shop AI can transform your business.</p>
              <div className="contact-methods">
                <div className="contact-method">
                  <strong>Email:</strong>
                  <p>demo@propshop.ai</p>
                </div>
                <div className="contact-method">
                  <strong>Response Time:</strong>
                  <p>Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
