
import React, { useState } from "react";
import { ContactMessage } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Layers, Send, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", subject: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await ContactMessage.create({
      name: form.name.trim(),
      email: String(form.email).trim().toLowerCase(),
      message: form.message.trim(),
      subject: form.subject.trim()
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-neutral-800 text-white">
      <header className="p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">SEWO</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Contact Us</h1>
        <p className="text-slate-300 mb-8">Have a question or want to work with us on SEWO? Send us a message and we’ll get back to you.</p>

        {submitted ? (
          <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-xl p-6 flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-400 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-300">Message sent</h3>
              <p className="text-slate-300 mt-1">Thanks! We’ll be in touch shortly.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} className="bg-white/10 border-white/20" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" value={form.email} onChange={handleChange} className="bg-white/10 border-white/20" required />
            </div>
            <div>
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input id="subject" name="subject" value={form.subject} onChange={handleChange} className="bg-white/10 border-white/20" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" value={form.message} onChange={handleChange} className="bg-white/10 border-white/20 h-32" required />
            </div>
            <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700">
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        )}
      </main>

      <footer className="py-8 border-t border-slate-800">
        <div className="container mx-auto px-6 text-slate-400 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} SEWO</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-white">Privacy Policy</Link>
            <Link to={createPageUrl('TermsOfService')} className="hover:text-white">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
