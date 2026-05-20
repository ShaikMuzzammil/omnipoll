import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Mail, Bell, User, Check, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";

/*
  EMAIL CONFIGURATION - Add your details here:
  1. Replace HOST_EMAIL with your Gmail address for contact form replies
  2. Replace RESEND_API_KEY with your Resend API key
  These values are used internally. The UI only asks for display name and reply email.
*/
const HOST_EMAIL = import.meta.env.VITE_HOST_EMAIL || "";
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || "";

export default function Settings() {
  const { state, dispatch } = useApp();
  const [name, setName] = useState(state.user?.name || "");
  const [email, setEmail] = useState(state.user?.email || "");
  const [replyName, setReplyName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);

  const handleSave = () => {
    if (state.user) {
      dispatch({
        type: "SET_USER",
        payload: {
          ...state.user,
          name: name || state.user.name,
          email: email || state.user.email,
        },
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl font-bold text-charcoal">Settings</h1>
          <p className="text-slate mt-1">Manage your profile and platform preferences</p>
        </motion.div>

        {/* Profile */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <User size={18} className="text-terracotta" />
            <h2 className="font-semibold text-charcoal">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-charcoal">Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  className="bg-cream border-clay/40 focus:border-terracotta"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-charcoal">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="bg-cream border-clay/40 focus:border-terracotta"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Email Reply Configuration */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Mail size={18} className="text-terracotta" />
            <h2 className="font-semibold text-charcoal">Contact Reply Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-charcoal">Reply Name</Label>
                <Input
                  value={replyName}
                  onChange={(e) => setReplyName(e.target.value)}
                  placeholder="e.g. OmniPoll Support"
                  className="bg-cream border-clay/40 focus:border-terracotta"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-charcoal">Reply Email</Label>
                <Input
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  type="email"
                  placeholder="support@yourdomain.com"
                  className="bg-cream border-clay/40 focus:border-terracotta"
                />
              </div>
            </div>
            <div className="bg-cream rounded-lg p-3 flex items-start gap-2">
              <Info size={14} className="text-terracotta shrink-0 mt-0.5" />
              <p className="text-xs text-slate">
                This name and email will be used as the reply-to address when people contact you through the platform.
                Messages are sent to the host. Update your email credentials in the code file: <code className="text-terracotta font-mono">src/pages/Settings.tsx</code>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Bell size={18} className="text-terracotta" />
            <h2 className="font-semibold text-charcoal">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal">Email Notifications</p>
                <p className="text-xs text-slate">Receive alerts about poll activity and moderation</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal">Marketing Emails</p>
                <p className="text-xs text-slate">Tips, updates, and product announcements</p>
              </div>
              <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
            </div>
          </div>
        </motion.div>

        {/* Hidden Email Config Info */}
        <motion.div
          className="bg-warm-white rounded-xl border border-clay/30 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setShowEmailConfig(!showEmailConfig)}
            className="flex items-center gap-2 w-full text-left"
          >
            <AlertTriangle size={18} className="text-terracotta" />
            <h2 className="font-semibold text-charcoal">Developer Email Configuration</h2>
            <span className="ml-auto text-xs text-slate">{showEmailConfig ? "Hide" : "Show"}</span>
          </button>
          <AnimatePresence>
            {showEmailConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 bg-charcoal rounded-lg p-4">
                  <p className="text-xs text-white/60 font-mono mb-2">// Update these values in Settings.tsx</p>
                  <pre className="text-xs font-mono text-green-400 leading-relaxed">
{`const HOST_EMAIL = "${HOST_EMAIL}";
const RESEND_API_KEY = "${RESEND_API_KEY.substring(0, 6)}...";`}
                  </pre>
                  <p className="text-xs text-white/40 mt-2">Current host email: {HOST_EMAIL}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-terracotta hover:bg-terracotta/90 text-white">
            {saved ? <><Check size={16} className="mr-2" /> Saved</> : <><Save size={16} className="mr-2" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
