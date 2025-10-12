import React, { useState } from "react";
import { ContactMessage } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Check, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", subject: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Save to database
      await ContactMessage.create({
        name: form.name.trim(),
        email: String(form.email).trim().toLowerCase(),
        message: form.message.trim(),
        subject: form.subject.trim()
      });

      // Send email notification using Resend
      await SendEmail({
        to: "stuartr@doubleclick.work", // Replace with your actual email
        subject: `New Contact Form Submission${form.subject ? ': ' + form.subject : ''}`,
        body: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${form.name}</p>
          <p><strong>Email:</strong> ${form.email}</p>
          <p><strong>Subject:</strong> ${form.subject || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${form.message.replace(/\n/g, '<br>')}</p>
        `
      });

      setSubmitted(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Contact Us</h1>
          <p className="text-lg text-slate-600">Have a question or want to work with us on DoubleClick? Send us a message and we'll get back to you.</p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-900 mb-2">Message Sent!</h3>
            <p className="text-slate-600">Thanks! We'll be in touch shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" 
                placeholder="Your name"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">Email</Label>
              <Input 
                id="email" 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" 
                placeholder="your@email.com"
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="subject" className="text-slate-700 font-medium mb-2 block">Subject (optional)</Label>
              <Input 
                id="subject" 
                name="subject" 
                value={form.subject} 
                onChange={handleChange} 
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500" 
                placeholder="What's this about?"
              />
            </div>
            
            <div>
              <Label htmlFor="message" className="text-slate-700 font-medium mb-2 block">Message</Label>
              <Textarea 
                id="message" 
                name="message" 
                value={form.message} 
                onChange={handleChange} 
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 min-h-[150px]" 
                placeholder="Tell us more..."
                required 
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}