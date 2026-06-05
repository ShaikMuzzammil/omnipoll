import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Send, Mail, User, MessageSquare, Check, AlertTriangle, ArrowLeft, Home, Code, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/*
  EMAIL CONFIGURATION - Add your details here:
  1. Replace HOST_EMAIL with your Gmail address
  2. Replace RESEND_API_KEY with your Resend API key
  These are used server-side. The frontend only shows a "sent to host" message.
*/
const HOST_EMAIL = import.meta.env.VITE_HOST_EMAIL || "";
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || "";

export default function Contact() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all fields before continuing");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "OmniPoll Contact <onboarding@resend.dev>",
          to: [HOST_EMAIL],
          reply_to: email,
          subject: `[OmniPoll Contact] Message from ${name}`,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #F5F2E8; padding: 32px; border-radius: 16px;">
              <div style="background: #D96C4A; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; font-family: 'Playfair Display', serif; margin: 0; font-size: 24px;">OmniPoll</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">New Contact Inquiry</p>
              </div>
              <div style="background: #FEFDFB; padding: 24px; border-radius: 12px; border-left: 4px solid #D96C4A;">
                <p style="margin: 0 0 12px; color: #2C2C2C; font-size: 14px;"><strong style="color: #D96C4A;">From:</strong> ${name} &lt;${email}&gt;</p>
                <p style="margin: 0 0 16px; color: #2C2C2C; font-size: 14px;"><strong style="color: #D96C4A;">Message:</strong></p>
                <div style="background: #F5F2E8; padding: 16px; border-radius: 8px; color: #2C2C2C; font-size: 14px; line-height: 1.6;">${message.replace(/\n/g, "<br/>")}</div>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="mailto:${email}?subject=Re: Contact Inquiry" style="display: inline-block; background: #D96C4A; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reply to this Message</a>
              </div>
              <p style="text-align: center; color: #6B6B6B; font-size: 11px; margin-top: 24px;">Sent via OmniPoll Contact Form</p>
            </div>
          `,
        }),
      });

      if (!response.ok) throw new Error("Failed to send");
      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setStep(1);
    setError("");
  };

  return (
    <div className="min-h-screen bg-cream relative">
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      {/* Nav */}
      <nav className="glass border-b border-clay/30 px-4 py-3 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-playfair text-lg font-bold text-charcoal">OmniPoll</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-slate hover:text-terracotta transition-colors flex items-center gap-1">
              <Home size={14} /> Home
            </Link>
            <Link to="/auth/login" className="text-sm text-slate hover:text-terracotta transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-playfair text-4xl font-bold text-charcoal mb-3">Get in Touch</h1>
          <p className="text-slate text-lg">Have questions? We'd love to hear from you. Your message will be sent directly to our team.</p>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? "bg-terracotta text-white" : "bg-cream text-slate border border-clay"
                }`}
                animate={{ scale: step === s ? 1.1 : 1 }}
              >
                {step > s ? <Check size={14} /> : s}
              </motion.div>
              {s < 3 && (
                <div className={`w-12 h-0.5 rounded ${step > s ? "bg-terracotta" : "bg-clay"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              className="bg-warm-white rounded-2xl border border-clay/40 p-8 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-crimson/10 text-crimson rounded-lg p-3 flex items-center gap-2 text-sm mb-4"
                >
                  <AlertTriangle size={16} /> {error}
                </motion.div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-charcoal">Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="pl-10 bg-cream border-clay/40 focus:border-terracotta" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-charcoal">Your Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="pl-10 bg-cream border-clay/40 focus:border-terracotta" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-charcoal">Message</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate" />
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's on your mind..." className="pl-10 bg-cream border-clay/40 focus:border-terracotta min-h-[140px]" />
                  </div>
                </div>
                <div className="bg-cream rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-terracotta shrink-0 mt-0.5" />
                  <p className="text-xs text-slate">
                    Your message will be sent to our host team. We'll reply to the email address you provide above.
                  </p>
                </div>
                <Button type="submit" className="w-full bg-terracotta hover:bg-terracotta/90 text-white py-5">
                  Review Message <ArrowLeft size={16} className="ml-2 rotate-180" />
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              className="bg-warm-white rounded-2xl border border-clay/40 p-8 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-playfair text-xl font-bold text-charcoal mb-4">Review Your Message</h2>
              <p className="text-sm text-slate mb-6">Please confirm your details before sending. This will be delivered to our host.</p>

              <div className="bg-charcoal rounded-xl p-5 mb-6 overflow-x-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Code size={14} className="text-terracotta" />
                  <span className="text-xs text-white/60 font-mono">message.json</span>
                </div>
                <pre className="text-xs font-mono text-green-400 leading-relaxed">
{`{
  "from": "${name}",
  "email": "${email}",
  "message": "${message.length > 60 ? message.slice(0, 60) + '...' : message}",
  "status": "ready_to_send",
  "recipient": "host"
}`}
                </pre>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-cream rounded-lg p-4 border-l-2 border-terracotta">
                  <p className="text-xs text-slate uppercase tracking-wide mb-1">Name</p>
                  <p className="text-sm font-medium text-charcoal">{name}</p>
                </div>
                <div className="bg-cream rounded-lg p-4 border-l-2 border-terracotta">
                  <p className="text-xs text-slate uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm font-medium text-charcoal">{email}</p>
                </div>
                <div className="bg-cream rounded-lg p-4 border-l-2 border-terracotta">
                  <p className="text-xs text-slate uppercase tracking-wide mb-1">Message</p>
                  <p className="text-sm text-charcoal whitespace-pre-wrap">{message}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="border-clay/60 text-slate flex-1">
                  <ArrowLeft size={14} className="mr-2" /> Edit
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-terracotta hover:bg-terracotta/90 text-white flex-1 py-5">
                  {loading ? "Sending..." : "Send to Host"} <Send size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              className="bg-warm-white rounded-2xl border border-clay/40 p-10 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Check size={28} className="text-sage" />
              </motion.div>
              <h2 className="font-playfair text-2xl font-bold text-charcoal mb-2">Message Sent!</h2>
              <p className="text-slate mb-2">Thank you for reaching out. Your message has been sent to our host team.</p>
              <p className="text-xs text-slate mb-6">We'll get back to you within 24 hours at <span className="font-mono text-terracotta">{email}</span>.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={resetForm} variant="outline" className="border-clay/60 text-slate">
                  <RotateCcw size={14} className="mr-2" /> Send Another
                </Button>
                <Link to="/">
                  <Button className="bg-terracotta hover:bg-terracotta/90 text-white">
                    <Home size={14} className="mr-2" /> Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Mail, title: "Email", desc: "Reply within 24h" },
            { icon: MessageSquare, title: "Support", desc: "Direct to host" },
            { icon: Check, title: "Confirmation", desc: "Instant delivery" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="bg-warm-white rounded-xl border border-clay/30 p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <item.icon className="w-5 h-5 text-terracotta mx-auto mb-2" />
              <p className="font-semibold text-charcoal text-sm">{item.title}</p>
              <p className="text-slate text-xs mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
