import React from 'react';
import { Navbar } from '../../../components/marketing/Navbar';
import { Footer } from '../../../components/marketing/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20">
            {/* Left Column: Info */}
            <div>
              <h1 className="font-display text-5xl text-sidebar mb-8 leading-tight">
                Let&apos;s talk about your <span className="text-brand">restaurant.</span>
              </h1>
              <p className="text-muted text-lg mb-12 max-w-md">
                Whether you&apos;re running a single kitchen or a nationwide franchise, 
                our team is ready to help you scale.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="bg-brand/10 p-4 rounded-2xl">
                    <Mail className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sidebar mb-1">Email Us</h4>
                    <p className="text-muted">hello@ordera.app</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="bg-brand/10 p-4 rounded-2xl">
                    <Phone className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sidebar mb-1">Call Support</h4>
                    <p className="text-muted">+234 800 000 0000</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="bg-brand/10 p-4 rounded-2xl">
                    <MapPin className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sidebar mb-1">Visit Us</h4>
                    <p className="text-muted">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-border-light shadow-2xl shadow-brand/5">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-sidebar">Full Name</label>
                    <input className="w-full px-5 py-3 bg-surface border border-border-light rounded-xl outline-none focus:ring-2 focus:ring-brand/20 transition" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-sidebar">Email Address</label>
                    <input className="w-full px-5 py-3 bg-surface border border-border-light rounded-xl outline-none focus:ring-2 focus:ring-brand/20 transition" placeholder="john@company.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-sidebar">Restaurant Name</label>
                  <input className="w-full px-5 py-3 bg-surface border border-border-light rounded-xl outline-none focus:ring-2 focus:ring-brand/20 transition" placeholder="Healthy Meals Ltd" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-sidebar">How can we help?</label>
                  <select className="w-full px-5 py-3 bg-surface border border-border-light rounded-xl outline-none focus:ring-2 focus:ring-brand/20 transition">
                    <option>General Inquiry</option>
                    <option>Schedule a Demo</option>
                    <option>Sales & Pricing</option>
                    <option>Technical Support</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-sidebar">Message</label>
                  <textarea rows={4} className="w-full px-5 py-3 bg-surface border border-border-light rounded-xl outline-none focus:ring-2 focus:ring-brand/20 transition" placeholder="Tell us more about your needs..." />
                </div>

                <button className="w-full py-4 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition shadow-lg shadow-brand/20">
                  Send Message <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
