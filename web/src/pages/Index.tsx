import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3, MessageSquare, Cloud, Brain, Zap, Shield,
  Users, FileText, Globe, ChevronDown, Check, Star,
  TrendingUp, Clock, Sparkles, ArrowRight, Menu, X,
  Vote, Lightbulb, Share2, BarChart2, Quote, ArrowUpRight,
  Home, Layers, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { getPollByCode } from "@/lib/api";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div ref={ref} initial="initial" animate={isInView ? "animate" : "initial"} variants={staggerContainer} className={className}>
      {children}
    </motion.div>
  );
}

function FloatingIcon({ icon: Icon, delay, x, y, size = 48 }: { icon: typeof BarChart3; delay: number; x: string; y: string; size?: number }) {
  return (
    <motion.div
      className="absolute opacity-[0.08] text-terracotta"
      style={{ left: x, top: y }}
      animate={{ y: [0, -25, 0], rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
      transition={{ duration: 7, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      <Icon size={size} />
    </motion.div>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-terracotta/10"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  useEffect(() => {
    if (state.isAuthenticated) navigate("/dashboard");
  }, [state.isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "demo", "how-it-works", "features", "testimonials", "cta"];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  const joinPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError("Enter a join code");
      return;
    }
    try {
      const response = await getPollByCode(joinCode);
      navigate(`/p/${response.poll.code}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Poll not found");
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Live Polling",
      desc: "Launch instant polls with real-time results. Multiple choice, word clouds, Q&A, and quizzes — all updating live as votes come in.",
    },
    {
      icon: Brain,
      title: "AI Clustering",
      desc: "Our NLP engine automatically groups open-text responses into themes. Discover what your audience really cares about, instantly.",
    },
    {
      icon: Shield,
      title: "Smart Moderation",
      desc: "BERT-powered toxic comment filtering with a moderation queue. Keep your Q&A sessions professional and safe, automatically.",
    },
    {
      icon: TrendingUp,
      title: "Sentiment Tracking",
      desc: "Real-time sentiment gauge and attention drop alerts. Know exactly how your audience feels and when engagement dips.",
    },
    {
      icon: FileText,
      title: "Rich Exports",
      desc: "Export results as branded PDF reports or CSV data. Share insights with stakeholders in beautifully formatted documents.",
    },
    {
      icon: Globe,
      title: "Embeddable Widget",
      desc: "Drop an iframe widget into any website. Customizable, theme-aware, and connected to the same real-time engine.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Event Director, TechConf",
      text: "OmniPoll transformed our keynote Q&As. The AI clustering surfaced questions we never would have caught manually. Engagement tripled.",
      rating: 5,
    },
    {
      name: "Marcus Johnson",
      role: "Head of HR, InnovateCo",
      text: "We use OmniPoll for all-hands meetings. The sentiment gauge tells us exactly when topics need more discussion. Game changer.",
      rating: 5,
    },
    {
      name: "Dr. Elena Rossi",
      role: "Professor, Stanford",
      text: "My students love the interactive quizzes. The word clouds alone make lectures worth attending. Best ed-tech tool I've adopted.",
      rating: 5,
    },
  ];

  const steps = [
    { icon: Lightbulb, title: "Create", desc: "Build your poll in seconds with our intuitive editor. Choose from multiple formats and customize settings." },
    { icon: Share2, title: "Share", desc: "Distribute a simple join code or link. Participants join instantly — no app downloads, no signups required." },
    { icon: BarChart2, title: "Analyze", desc: "Watch results flow in real-time. AI clustering, sentiment analysis, and rich exports deliver instant insights." },
  ];

  const navSections = [
    { id: "hero", label: "Home" },
    { id: "demo", label: "Demo" },
    { id: "how-it-works", label: "How It Works" },
    { id: "features", label: "Features" },
    { id: "testimonials", label: "Testimonials" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-clay/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-playfair text-xl font-bold text-charcoal">OmniPoll</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`text-sm font-medium transition-colors relative ${
                    activeSection === section.id ? "text-terracotta" : "text-slate hover:text-terracotta"
                  }`}
                >
                  {section.label}
                  {activeSection === section.id && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-terracotta rounded-full"
                      layoutId="nav-indicator"
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth/login")} className="text-sm font-medium">Log in</Button>
              <Button onClick={() => navigate("/auth/signup")} className="bg-terracotta hover:bg-terracotta/90 text-white text-sm font-medium px-5">Get Started</Button>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-warm-white border-t border-clay/30"
            >
              <div className="px-4 py-4 space-y-3">
                {navSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block text-sm font-medium py-2 w-full text-left ${activeSection === section.id ? "text-terracotta" : "text-slate"}`}
                  >
                    {section.label}
                  </button>
                ))}
                <Button variant="ghost" className="w-full justify-start" onClick={() => { navigate("/auth/login"); setMobileMenuOpen(false); }}>Log in</Button>
                <Button className="w-full bg-terracotta hover:bg-terracotta/90 text-white" onClick={() => { navigate("/auth/signup"); setMobileMenuOpen(false); }}>Get Started</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-[#F8F4EC] to-[#F0E4D3]" />
        <div className="absolute inset-0 mesh-gradient" />
        <ParticleField />
        <FloatingIcon icon={BarChart3} delay={0} x="10%" y="20%" size={56} />
        <FloatingIcon icon={MessageSquare} delay={1} x="80%" y="15%" size={44} />
        <FloatingIcon icon={Cloud} delay={2} x="70%" y="60%" size={52} />
        <FloatingIcon icon={Zap} delay={0.5} x="15%" y="70%" size={40} />
        <FloatingIcon icon={Users} delay={1.5} x="50%" y="80%" size={48} />
        <FloatingIcon icon={Layers} delay={2.5} x="85%" y="45%" size={36} />
        <FloatingIcon icon={Compass} delay={1.2} x="5%" y="45%" size={42} />
        <motion.div className="relative z-10 max-w-5xl mx-auto px-4 text-center" style={{ opacity: heroOpacity, y: heroY }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-xs font-semibold tracking-wide uppercase mb-6">
              <Sparkles size={14} /> AI-Powered Live Engagement
            </span>
          </motion.div>
          <motion.h1
            className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Ask. Connect.{" "}
            <span className="text-terracotta">Understand.</span>{" "}
            Instantly.
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-slate max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            The live polling platform that feels like paper and thinks like a data scientist.
            Real-time AI clustering, sentiment tracking, and beautiful engagement — for audiences of 10 or 10,000.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth/signup")}
              className="bg-terracotta hover:bg-terracotta/90 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-terracotta/20 hover:shadow-xl hover:shadow-terracotta/30 transition-all hover:-translate-y-0.5"
            >
              Get Started <ArrowRight size={18} className="ml-2" />
            </Button>
            <form onSubmit={joinPoll} className="flex w-full sm:w-auto items-center gap-2 bg-warm-white border border-clay/50 rounded-xl p-1.5 shadow-sm">
              <Input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
                placeholder="Join code"
                className="w-full sm:w-36 border-0 bg-transparent text-center font-mono uppercase focus-visible:ring-0"
              />
              <Button type="submit" size="sm" className="bg-charcoal hover:bg-charcoal/90 text-white rounded-lg">
                Join
              </Button>
            </form>
          </motion.div>
          {joinError && <p className="text-crimson text-sm mt-3">{joinError}</p>}
          <motion.div
            className="mt-16 flex items-center justify-center gap-8 text-sm text-slate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span className="flex items-center gap-1.5"><Check size={14} className="text-sage" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-sage" /> Unlimited polls</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-sage" /> Real-time results</span>
          </motion.div>
        </motion.div>
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={24} className="text-slate/50" />
        </motion.div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-24 px-4 relative">
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="font-playfair text-4xl font-bold text-charcoal mb-4">See It In Action</motion.h2>
            <motion.p variants={fadeInUp} className="text-slate text-lg max-w-2xl mx-auto">Watch as responses flow in real-time. AI clustering groups themes automatically while the sentiment gauge tracks audience mood.</motion.p>
          </AnimatedSection>
          <motion.div
            className="relative bg-warm-white rounded-2xl border border-clay/50 p-8 shadow-xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-charcoal">What should we prioritize next quarter?</h3>
                  <span className="text-xs bg-sage/10 text-sage px-2 py-1 rounded-full font-medium animate-pulse">Live</span>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Product improvements", pct: 42, color: "bg-terracotta" },
                    { label: "Market expansion", pct: 28, color: "bg-[#D4A574]" },
                    { label: "Customer support", pct: 18, color: "bg-sage" },
                    { label: "Team hiring", pct: 12, color: "bg-[#7B9EA8]" },
                  ].map((opt, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal font-medium">{opt.label}</span>
                        <span className="text-slate font-mono">{opt.pct}%</span>
                      </div>
                      <div className="h-3 bg-cream rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${opt.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${opt.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate pt-2">
                  <span className="flex items-center gap-1"><Users size={12} /> 247 participants</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> 2m remaining</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-cream rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-3">Sentiment</h4>
                  <div className="relative h-32 flex items-center justify-center">
                    <svg viewBox="0 0 100 60" className="w-full">
                      <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#E5DDD3" strokeWidth="8" strokeLinecap="round" />
                      <motion.path
                        d="M10,50 A40,40 0 0,1 55,10"
                        fill="none"
                        stroke="#87A878"
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 0.72 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </svg>
                    <div className="absolute bottom-2 text-center">
                      <span className="text-2xl font-bold text-sage">72%</span>
                      <p className="text-xs text-slate">Positive</p>
                    </div>
                  </div>
                </div>
                <div className="bg-cream rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-slate uppercase tracking-wide mb-3">Top Themes</h4>
                  <div className="space-y-2">
                    {["UX improvements", "Global reach", "Support scaling"].map((t, i) => (
                      <motion.div
                        key={t}
                        className="flex items-center gap-2 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <div className="w-2 h-2 rounded-full bg-terracotta" />
                        <span className="text-charcoal">{t}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 bg-warm-white relative">
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="font-playfair text-4xl font-bold text-charcoal mb-4">How It Works</motion.h2>
            <motion.p variants={fadeInUp} className="text-slate text-lg max-w-2xl mx-auto">From idea to insight in three simple steps. No technical setup, no learning curve.</motion.p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative bg-cream rounded-2xl p-8 border border-clay/40 text-center group hover:border-terracotta/30 transition-all duration-300"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.06)" }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-sm shadow-lg">
                  {i + 1}
                </div>
                <div className="mt-4 mb-4 w-14 h-14 rounded-xl bg-terracotta/10 flex items-center justify-center mx-auto group-hover:bg-terracotta/20 transition-colors">
                  <step.icon className="w-7 h-7 text-terracotta" />
                </div>
                <h3 className="font-playfair text-xl font-bold text-charcoal mb-2">{step.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 relative">
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="font-playfair text-4xl font-bold text-charcoal mb-4">Powerful Features</motion.h2>
            <motion.p variants={fadeInUp} className="text-slate text-lg max-w-2xl mx-auto">Everything you need to engage, understand, and act on your audience's input.</motion.p>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-warm-white rounded-xl p-6 border border-clay/30 hover:border-terracotta/20 transition-all duration-300 group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(0,0,0,0.05)" }}
              >
                <div className="w-11 h-11 rounded-lg bg-terracotta/10 flex items-center justify-center mb-4 group-hover:bg-terracotta/20 transition-colors">
                  <f.icon className="w-5 h-5 text-terracotta" />
                </div>
                <h3 className="font-semibold text-charcoal mb-2">{f.title}</h3>
                <p className="text-slate text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-warm-white relative">
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-16">
            <motion.h2 variants={fadeInUp} className="font-playfair text-4xl font-bold text-charcoal mb-4">Loved by Presenters</motion.h2>
            <motion.p variants={fadeInUp} className="text-slate text-lg">Join thousands of event organizers, educators, and team leaders.</motion.p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="bg-cream rounded-xl p-6 border border-clay/30 relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Quote className="w-8 h-8 text-terracotta/20 mb-4" />
                <p className="text-charcoal text-sm leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-terracotta fill-terracotta" />
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-charcoal text-sm">{t.name}</p>
                  <p className="text-slate text-xs">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 px-4 relative">
        <div className="absolute inset-0 mesh-gradient pointer-events-none" />
        <motion.div
          className="max-w-4xl mx-auto bg-gradient-to-br from-terracotta to-[#C25A3A] rounded-3xl p-12 text-center text-white relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 opacity-10">
            <FloatingIcon icon={Vote} delay={0} x="10%" y="20%" size={64} />
            <FloatingIcon icon={BarChart3} delay={1} x="80%" y="30%" size={56} />
            <FloatingIcon icon={Sparkles} delay={0.5} x="50%" y="70%" size={48} />
          </div>
          <div className="relative z-10">
            <h2 className="font-playfair text-3xl sm:text-4xl font-bold mb-4">Ready to Engage Your Audience?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Join thousands of presenters who use OmniPoll to create memorable, data-driven live experiences.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/auth/signup")}
                className="bg-white text-terracotta hover:bg-white/90 px-8 py-6 text-base font-semibold rounded-xl"
              >
                Create Free Account <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/contact")}
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-charcoal text-white/70 py-16 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="font-playfair text-lg font-bold text-white">OmniPoll</span>
              </div>
              <p className="text-sm leading-relaxed">AI-powered live polling that feels like paper and thinks like a data scientist.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection("features")} className="hover:text-terracotta transition-colors">Features</button></li>
                <li><Link to="/dashboard/polls/create" className="hover:text-terracotta transition-colors">Create Poll</Link></li>
                <li><Link to="/join" className="hover:text-terracotta transition-colors">Join Poll</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-terracotta transition-colors">Contact</Link></li>
                <li><Link to="/auth/login" className="hover:text-terracotta transition-colors">Log In</Link></li>
                <li><Link to="/auth/signup" className="hover:text-terracotta transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-terracotta transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-terracotta transition-colors cursor-pointer">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs"> 2026 OmniPoll. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-terracotta transition-colors"><Home size={16} /></Link>
              <Link to="/contact" className="hover:text-terracotta transition-colors"><MessageSquare size={16} /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
