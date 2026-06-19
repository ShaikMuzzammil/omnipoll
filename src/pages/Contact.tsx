import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Home, User, Mail, MessageSquare,
  Send, CheckCircle, Shield, ArrowRight, ChevronRight,
} from 'lucide-react';

const SUBJECTS = [
  'General Question', 'Feature Request', 'Bug Report',
  'Partnership', 'Billing', 'Other',
];

export default function Contact() {
  const [step, setStep]    = useState(1);
  const [form, setForm]    = useState({ name:'', email:'', message:'', subject:'General Question' });
  const [sending, setSend] = useState(false);
  const [sent, setSent]    = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const step1Valid = form.name.trim() && form.email.trim() && form.message.trim();

  const handleSend = async () => {
    setSend(true);
    await new Promise(r => setTimeout(r, 1400));
    setSend(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-cream-100 font-body">
      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/90 backdrop-blur border-b border-cream-300">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center shadow-sm">
              <BarChart3 size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold text-lg text-slate-800">OmniPoll</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors">
              <Home size={13}/> Home
            </Link>
            <Link to="/login" className="text-slate-500 hover:text-slate-700 transition-colors">Log in</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-slate-800 mb-3">Get in Touch</h1>
          <p className="text-slate-500 leading-relaxed">
            Have questions? We'd love to hear from you. Your message will be sent directly to our team.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[1,2,3].map((s, i) => (
            <div key={s} className="flex items-center">
              <motion.div
                animate={{
                  backgroundColor: step >= s ? '#D96C4A' : '#E4CC94',
                  color: step >= s ? '#fff' : '#94a3b8',
                  scale: step === s ? 1.1 : 1,
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-transparent"
                style={{ borderColor: step >= s ? '#D96C4A' : '#E4CC94' }}
              >
                {step > s ? <CheckCircle size={16}/> : s}
              </motion.div>
              {i < 2 && (
                <div className="w-20 h-0.5 mx-1" style={{ backgroundColor: step > s ? '#D96C4A' : '#E4CC94' }}/>
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="bg-white border border-cream-300 rounded-2xl shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {sent ? (
              /* ── Success ── */
              <motion.div key="sent"
                initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                className="p-10 text-center">
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, delay:0.1 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={36} className="text-green-500"/>
                </motion.div>
                <h3 className="font-display text-2xl font-bold text-slate-800 mb-2">Message Sent!</h3>
                <p className="text-slate-500 mb-1">We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
                <p className="text-sm text-slate-400 mb-6">Topic: {form.subject}</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => { setSent(false); setStep(1); setForm({ name:'', email:'', message:'', subject:'General Question' }); }}
                    className="px-5 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-colors">
                    Send another
                  </button>
                  <Link to="/" className="flex items-center gap-1.5 px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-colors">
                    <Home size={14}/> Go home
                  </Link>
                </div>
              </motion.div>

            ) : step === 1 ? (
              /* ── Step 1: Details ── */
              <motion.div key="s1" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="p-7">
                <h2 className="font-display font-semibold text-slate-800 text-lg mb-5">Your details</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Your Name
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input value={form.name} onChange={update('name')} placeholder="Enter your name"
                        className="w-full pl-9 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Your Email
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all"/>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3 top-3.5 text-slate-400"/>
                    <textarea value={form.message} onChange={update('message')} rows={5}
                      placeholder="Tell us what's on your mind..."
                      className="w-full pl-9 pr-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 transition-all resize-none"/>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-5">
                  <Shield size={14} className="flex-shrink-0 mt-0.5"/>
                  Your message will be sent to our host team. We'll reply to the email address you provide above.
                </div>
                <button onClick={() => step1Valid && setStep(2)} disabled={!step1Valid}
                  className="w-full flex items-center justify-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all">
                  Review Message <ArrowRight size={15}/>
                </button>
              </motion.div>

            ) : step === 2 ? (
              /* ── Step 2: Topic ── */
              <motion.div key="s2" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="p-7">
                <h2 className="font-display font-semibold text-slate-800 text-lg mb-1">Select a topic</h2>
                <p className="text-sm text-slate-500 mb-5">Help us route your message to the right team</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {SUBJECTS.map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, subject:s }))}
                      className={`px-3.5 py-3 rounded-xl text-sm font-medium border-2 text-left transition-all ${
                        form.subject === s
                          ? 'border-terracotta-400 bg-terracotta-50 text-terracotta-700'
                          : 'border-cream-300 text-slate-600 hover:border-terracotta-200 hover:bg-cream-50'
                      }`}>
                      {form.subject === s && <span className="mr-1.5">✓</span>}{s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-all">
                    ← Back
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-sm font-semibold transition-all">
                    Continue →
                  </button>
                </div>
              </motion.div>

            ) : (
              /* ── Step 3: Confirm ── */
              <motion.div key="s3" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="p-7">
                <h2 className="font-display font-semibold text-slate-800 text-lg mb-1">Confirm &amp; Send</h2>
                <p className="text-sm text-slate-500 mb-5">Review your message before sending</p>
                <div className="space-y-3 p-4 bg-cream-50 rounded-xl mb-5 text-sm border border-cream-200">
                  {[
                    ['Name',    form.name],
                    ['Email',   form.email],
                    ['Topic',   form.subject],
                  ].map(([k,v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-slate-500 w-16">{k}</span>
                      <span className="font-medium text-slate-800 text-right">{v}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-cream-200">
                    <p className="text-slate-500 mb-1.5">Message</p>
                    <p className="text-slate-700 leading-relaxed">{form.message}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-cream-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-cream-100 transition-all">
                    ← Edit
                  </button>
                  <button onClick={handleSend} disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-70 text-white rounded-xl text-sm font-semibold transition-all">
                    {sending
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Sending…</>
                      : <><Send size={14}/> Send Message</>
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact options */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="grid grid-cols-3 gap-3 mt-5">
          {[
            { icon: Mail,         label:'Email',    val:'hello@omnipoll.app' },
            { icon: Shield,       label:'Response', val:'Within 24 hours' },
            { icon: CheckCircle,  label:'Support',  val:'Mon – Sat' },
          ].map(c => (
            <div key={c.label} className="text-center p-3.5 bg-white border border-cream-200 rounded-xl">
              <c.icon size={16} className="text-terracotta-500 mx-auto mb-1.5"/>
              <p className="text-xs font-semibold text-slate-700">{c.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{c.val}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
