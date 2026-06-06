import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { User, Bell, Palette, Shield } from "lucide-react";

export default function Settings() {
  const user = (() => { try { return JSON.parse(localStorage.getItem("omnipoll_auth")||"null")?.user||null; } catch { return null; } })();
  const [name, setName] = useState(user?.name||"");
  const [email, setEmail] = useState(user?.email||"");
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const save = () => { toast.success("Settings saved!"); };
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(d => !d);
    toast.success(dark ? "Light mode enabled" : "Dark mode enabled");
  };

  const SECTIONS = [
    { icon: User, title: "Profile", content: (
      <div className="space-y-4">
        <div><Label>Display name</Label><Input value={name} onChange={e=>setName(e.target.value)} className="mt-1" /></div>
        <div><Label>Email address</Label><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="mt-1" /></div>
        <div><Label>New password</Label><Input type="password" placeholder="Leave blank to keep current" className="mt-1" /></div>
        <Button onClick={save} className="bg-terracotta hover:bg-terracotta/90">Save profile</Button>
      </div>
    )},
    { icon: Palette, title: "Appearance", content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
          <div><p className="font-medium text-foreground">Dark Mode</p><p className="text-sm text-muted-foreground">Switch between light and dark interface</p></div>
          <button onClick={toggleDark} className={`relative w-12 h-6 rounded-full transition-colors ${dark?"bg-terracotta":"bg-muted"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${dark?"left-6":"left-0.5"}`} />
          </button>
        </div>
      </div>
    )},
    { icon: Bell, title: "Notifications", content: (
      <div className="space-y-3">
        {["New participant joins","Poll response received","Poll expires soon","Weekly analytics digest"].map(n=>(
          <div key={n} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <span className="text-sm text-foreground">{n}</span>
            <button className="relative w-10 h-5 rounded-full bg-terracotta">
              <div className="absolute top-0.5 left-5 w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </div>
        ))}
      </div>
    )},
    { icon: Shield, title: "Danger Zone", content: (
      <div className="space-y-3">
        <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
          <p className="font-medium text-red-700 dark:text-red-400 mb-1">Delete all polls</p>
          <p className="text-sm text-red-600/80 dark:text-red-500 mb-3">This will permanently delete all your polls and data.</p>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Delete all polls</Button>
        </div>
        <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
          <p className="font-medium text-red-700 dark:text-red-400 mb-1">Delete account</p>
          <p className="text-sm text-red-600/80 dark:text-red-500 mb-3">Permanently remove your account and all associated data.</p>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Delete account</Button>
        </div>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-playfair font-bold text-foreground">Settings</h1>
        {SECTIONS.map(({ icon: Icon, title, content }) => (
          <div key={title} className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Icon className="w-5 h-5 text-terracotta" />
              <h2 className="font-semibold text-foreground">{title}</h2>
            </div>
            {content}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
