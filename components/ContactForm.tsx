'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    topic: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          source: 'contact_form',
          topic: formData.topic,
          message: formData.message
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          topic: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <section className="contact-form-section">
      <div className="container">
        <div className="contact-form-wrapper">
          <div className="contact-form-left">
            <h2>Have a Question?</h2>
            <p className="contact-intro">
              We&apos;re here to help! Fill out the form and we&apos;ll get back to you as soon as possible.
            </p>
            
            <div className="contact-info">
              <div className="contact-info-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.16667L9.16667 9.16667L15.8333 4.16667M2.5 15.8333H17.5V4.16667H2.5V15.8333Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Fill out the form and we&apos;ll be in touch</span>
              </div>
            </div>
          </div>

          <div className="contact-form-right">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="*First Name"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="*Last Name"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="*Email"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number (optional)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  required
                  className="form-input form-select"
                >
                  <option value="">*Select your topic</option>
                  <option value="General Enquiry">General Enquiry</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="*Message"
                  required
                  rows={5}
                  className="form-input form-textarea"
                />
              </div>

              {submitStatus === 'success' && (
                <div className="form-message form-success">
                  ✓ Thank you! We&apos;ll get back to you soon.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="form-message form-error">
                  ✗ Something went wrong. Please try again or email us directly.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="form-submit-btn"
              >
                {isSubmitting ? 'Sending...' : 'SUBMIT'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

