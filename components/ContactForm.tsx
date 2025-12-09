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
          website: formData.topic,
          message: `Topic: ${formData.topic}\n\n${formData.message}`
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
              We're here to help! Fill out the form and we'll get back to you as soon as possible.
            </p>
            
            <div className="contact-info">
              <div className="contact-info-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.16667L9.16667 9.16667L15.8333 4.16667M2.5 15.8333H17.5V4.16667H2.5V15.8333Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <a href="mailto:hello@sewo.io">hello@sewo.io</a>
              </div>
              
              <div className="contact-info-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H6.66667C7.12691 2.5 7.53024 2.79875 7.66667 3.23333L8.75 7C8.86458 7.38194 8.75694 7.79861 8.46667 8.08333L6.66667 9.88333C7.82639 12.2569 9.74306 14.1736 12.1167 15.3333L13.9167 13.5333C14.2014 13.2431 14.6181 13.1354 15 13.25L18.7667 14.3333C19.2013 14.4698 19.5 14.8731 19.5 15.3333V17.8333C19.5 18.7538 18.7538 19.5 17.8333 19.5H17.5C8.3873 19.5 0.5 11.6127 0.5 2.5V2.16667C0.5 1.24619 1.24619 0.5 2.16667 0.5H4.66667C5.12691 0.5 5.53024 0.79875 5.66667 1.23333L6.75 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>TBA</span>
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
                  <option value="Work with Us">Work with Us</option>
                  <option value="Partnership White Label">Partnership White Label</option>
                  <option value="Consulting">Consulting</option>
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
                  ✓ Thank you! We'll get back to you soon.
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

