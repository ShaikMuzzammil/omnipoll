import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Bell, Shield, Palette, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

type SettingsTab = "profile" | "notifications" | "security" | "appearance";

export default function Settings() {
  const { user, setUser, logout } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [resultsNotifs, setResultsNotifs] = useState(true);
  const [digestNotifs, setDigestNotifs] = useState(false);

  // Appearance
  const [theme] = useState<"warm" | "light" | "dark">("warm");

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    try {
      // Update local session
      if (user) {
        const updated = { ...user, name, email };
        setUser(updated);
        localStorage.setItem("omnipoll_auth", JSON.stringify(updated));
      }
      toast.success("Profile updated");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Signed out successfully");
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile",       label: "Profile",       icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security",      label: "Security",      icon: Shield },
    { id: "appearance",    label: "Appearance",    icon: Palette },
  ];

  const fieldClass = "bg-warm-white border-clay/40 focus:border-terracotta";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-charcoal">Settings</h1>
          <p className="text-slate text-sm mt-1">Manage your account preferences</p>
        </div>

        <div className="flex gap-1 bg-warm-white rounded-xl border border-clay/30 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-terracotta text-white" : "text-slate hover:text-charcoal hover:bg-parchment"
              }`}>
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          {activeTab === "profile" && (
            <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Profile Information</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-terracotta/10 flex items-center justify-center text-2xl font-bold text-terracotta">
                  {(name || user?.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-charcoal">{user?.name}</p>
                  <p className="text-sm text-slate">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-charcoal">Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-charcoal">Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-terracotta hover:bg-orange-600 text-white">
                  <Save size={14} className="mr-1.5" />{saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Notification Preferences</h2>
              {[
                { label: "Email notifications", desc: "Receive emails for poll activity", value: emailNotifs, onChange: setEmailNotifs },
                { label: "Results alerts",       desc: "Get notified when results milestone hit", value: resultsNotifs, onChange: setResultsNotifs },
                { label: "Weekly digest",        desc: "Summary of your polls every week", value: digestNotifs, onChange: setDigestNotifs },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-parchment rounded-xl">
                  <div>
                    <p className="font-medium text-charcoal text-sm">{item.label}</p>
                    <p className="text-xs text-slate mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.onChange(!item.value)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? "bg-terracotta" : "bg-clay/40"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${item.value ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
              <Button onClick={() => toast.success("Preferences saved")} className="bg-terracotta hover:bg-orange-600 text-white">
                <Save size={14} className="mr-1.5" /> Save Preferences
              </Button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Security</h2>
              <div className="space-y-4">
                <div className="p-4 bg-parchment rounded-xl">
                  <p className="font-medium text-charcoal text-sm mb-1">Change Password</p>
                  <p className="text-xs text-slate mb-3">Choose a strong password to protect your account</p>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Current password" className={fieldClass} />
                    <Input type="password" placeholder="New password" className={fieldClass} />
                    <Input type="password" placeholder="Confirm new password" className={fieldClass} />
                  </div>
                  <Button className="mt-3 bg-terracotta hover:bg-orange-600 text-white" size="sm"
                    onClick={() => toast.success("Password updated")}>Update Password</Button>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="font-medium text-red-700 text-sm mb-1">Danger Zone</p>
                  <p className="text-xs text-red-600 mb-3">Sign out of all devices</p>
                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <LogOut size={13} className="mr-1.5" /> Sign Out Everywhere
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-warm-white rounded-2xl border border-clay/30 p-6 space-y-5">
              <h2 className="font-playfair text-xl font-bold text-charcoal">Appearance</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "warm",  label: "Warm",  bg: "bg-[hsl(42,33%,93%)]",  accent: "bg-[#D96C4A]" },
                  { id: "light", label: "Light", bg: "bg-white",               accent: "bg-blue-500" },
                  { id: "dark",  label: "Dark",  bg: "bg-gray-900",             accent: "bg-purple-500" },
                ].map((t) => (
                  <button key={t.id}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${theme === t.id ? "border-terracotta" : "border-clay/30"}`}
                    onClick={() => toast.info("Theme switching coming soon!")}>
                    <div className={`${t.bg} h-16 relative`}>
                      <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-lg ${t.accent}`} />
                    </div>
                    <div className="bg-warm-white px-3 py-2 text-xs font-medium text-charcoal">{t.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate">More theme options coming soon.</p>
            </div>
          )}

        </motion.div>

        {/* Sign out */}
        <div className="flex justify-end">
          <Button variant="ghost" className="text-slate hover:text-crimson" onClick={handleLogout}>
            <LogOut size={14} className="mr-1.5" /> Sign Out
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
