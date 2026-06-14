import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Zap, Shield, Users, ChevronRight,
  CheckCircle, Globe, GraduationCap, Play,
} from 'lucide-react';
import { pollTypeLabel, pollTypeIcon } from '@/lib/utils';
import type { PollType } from '@/lib/types';

const POLL_TYPES: PollType[] = [
  'multiple_choice','quiz','word_cloud','qa','nps','rating',
  'slider','ranking','matrix','priority','heatmap','emoji',
  'bracket','fill_blank','matching','true_false','image_choice',
  'countdown','series','open_ended',
];

const FEATURES = [
  { icon: Zap,           title: 'Real-Time Results',   desc: 'Live vote streaming with Pusher Channels. See responses appear instantly on the presenter screen.' },
  { icon: GraduationCap, title: 'Classroom Management',desc: 'Create classrooms, invite students with a code, run quizzes and track every student\'s progress.' },
  { icon: BarChart3,     title: 'Deep Analytics',      desc: 'Item analysis, score distribution, question difficulty ratings and downloadable reports.' },
  { icon: Shield,        title: 'Results & Key Sheets',desc: 'Release results to students with detailed answer-by-answer breakdowns and correct-answer overlays.' },
  { icon: Users,         title: '20+ Poll Types',       desc: 'From simple multiple choice to NPS scores, heatmaps, ranking, matrix grids and live brackets.' },
  { icon: Globe,         title: 'Join Anywhere',        desc: 'Students join via 6-char code or QR. No app download. Works on any device and browser.' },
];

const STATS = [
  { value: '20+', label: 'Poll Types' },
  { value: '∞',   label: 'Participants' },
  { value: '<1s', label: 'Live Latency' },
  { value: '100%', label: 'Free to start' },
];

const fade = { hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0 } };

export default function Index() {
  return (
    <div className="min-h-screen bg-cream-100 font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-800">OmniPoll</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/join" className="text-sm text-slate-600 hover:text-terracotta-600 px-3 py-1.5 rounded-lg hover:bg-cream-200 transition-colors font-medium">
              Join a Poll
            </Link>
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg font-medium">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div initial="hidden" animate="show" variants={{ show:{ transition:{ staggerChildren:0.1 } } }}>
          <motion.div variants={fade} className="inline-flex items-center gap-2 bg-terracotta-50 border border-terracotta-200 rounded-full px-4 py-1.5 text-sm text-terracotta-700 font-medium mb-6">
            <span className="w-2 h-2 bg-terracotta-500 rounded-full animate-pulse" />
            20+ Poll Types · Real-Time · Free Forever
          </motion.div>

          <motion.h1 variants={fade} className="font-display text-5xl md:text-6xl font-bold text-slate-800 mb-5 leading-tight">
            The world's most powerful
            <br />
            <span className="text-gradient">polling platform</span>
          </motion.h1>

          <motion.p variants={fade} className="text-xl text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Create live polls, quizzes, and surveys in seconds. Get real-time responses,
            deep analytics, and detailed key sheets — all in one beautiful platform.
          </motion.p>

          <motion.div variants={fade} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-6 py-3 rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Start for free <ChevronRight size={18} />
            </Link>
            <Link to="/join" className="flex items-center gap-2 bg-white border border-cream-300 hover:border-terracotta-300 text-slate-700 px-6 py-3 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5">
              <Play size={16} className="text-terracotta-500" /> Join a Poll
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="grid grid-cols-4 gap-4 mt-16 max-w-xl mx-auto"
        >
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-display font-bold text-terracotta-600">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Poll types grid */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-slate-800 mb-3">Every poll type you'll ever need</h2>
          <p className="text-slate-500">20 unique interaction types built for every use case</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {POLL_TYPES.map((type, i) => (
            <motion.div
              key={type}
              initial={{ opacity:0, scale:0.8 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ delay: i * 0.03 }}
              className="type-tile flex flex-col items-center gap-1 py-3 px-1"
            >
              <span className="text-2xl">{pollTypeIcon(type)}</span>
              <span className="text-[10px] text-slate-600 font-medium leading-tight text-center">{pollTypeLabel(type)}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-slate-800 mb-3">Built for educators & teams</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Everything you need to engage your audience, run quizzes, and measure learning outcomes.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.08 }}
              className="op-card p-6"
            >
              <div className="w-10 h-10 bg-terracotta-100 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={20} className="text-terracotta-600" />
              </div>
              <h3 className="font-display font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-cream-300 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-slate-800 mb-3">Up and running in 60 seconds</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n:'1', title:'Create', desc:'Pick a poll type, add your questions and settings. 20 types to choose from.' },
              { n:'2', title:'Share',  desc:'Share your 6-char code or QR. Students join on any device instantly.' },
              { n:'3', title:'Analyse',desc:'Watch live results, then deep-dive into analytics and release key sheets to students.' },
            ].map(step => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 bg-terracotta-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-display font-bold text-xl shadow-md">
                  {step.n}
                </div>
                <h3 className="font-display font-semibold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-4xl font-bold text-slate-800 mb-4">Ready to engage your audience?</h2>
        <p className="text-slate-500 mb-8 text-lg">Join thousands of educators and teams using OmniPoll.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/signup" className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Create your first poll <ChevronRight size={18} />
          </Link>
          <Link to="/join" className="text-terracotta-600 hover:text-terracotta-700 font-semibold px-6 py-3.5 underline underline-offset-2">
            Join as a participant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cream-300 py-8 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-terracotta-500 rounded-md flex items-center justify-center">
              <BarChart3 size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-slate-700">OmniPoll</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} OmniPoll. The most powerful live polling platform.
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
            {['Privacy Policy','Terms of Service','Contact'].map(l => (
              <a key={l} href="#" className="hover:text-terracotta-500 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
