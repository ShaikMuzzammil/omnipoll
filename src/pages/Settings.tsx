import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, LogOut, Trash2, Save, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut, updateUser } = useApp();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) setName(user.name || '');
  }, [user, authLoading, navigate]);

  const save = () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    setTimeout(() => { updateUser({ name: name.trim() }); toast.success('Profile updated'); setSaving(false); }, 600);
  };

  const PLANS = {
    free:    ['5 polls/month','Multiple choice, Q&A, Quiz, Rating, Word cloud','100 participants'],
    starter: ['Unlimited polls','All free types + 7 more','500 participants'],
    pro:     ['Unlimited everything','All 20 poll types','Unlimited participants','Advanced analytics','CSV export'],
  };

  if (authLoading) return <DashboardLayout title="Settings"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin"/></div></DashboardLayout>;

  return (
    <DashboardLayout title="Settings">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/><h2 className="font-playfair font-semibold text-foreground">Profile</h2></div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-xl">{user?.name?.[0]?.toUpperCase()||'U'}</div>
              <div><p className="font-semibold text-foreground">{user?.name}</p><p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full mt-1 inline-block capitalize">{user?.plan||'free'} plan</span></div>
            </div>
            <div className="space-y-1.5"><Label>Display name</Label><Input value={name} onChange={e=>setName(e.target.value)}/></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={user?.email||''} disabled className="bg-muted cursor-not-allowed"/><p className="text-xs text-muted-foreground">Email cannot be changed</p></div>
            <Button onClick={save} disabled={saving} size="sm" className="gap-1.5"><Save className="w-3.5 h-3.5"/>{saving?'Saving…':'Save changes'}</Button>
          </div>
        </motion.div>

        {/* Plan */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground"/><h2 className="font-playfair font-semibold text-foreground">Plan & Billing</h2></div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['free','starter','pro'] as const).map(plan=>(
                <div key={plan} className={`p-4 rounded-xl border-2 ${user?.plan===plan?'border-terracotta bg-terracotta/5':'border-border'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold capitalize text-foreground">{plan}</span>
                    {user?.plan===plan&&<span className="text-xs bg-terracotta text-white px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                  <ul className="space-y-1.5">
                    {PLANS[plan].map(f=><li key={f} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-terracotta mt-0.5">✓</span>{f}</li>)}
                  </ul>
                  {user?.plan!==plan&&<Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={()=>toast.info('Billing coming soon!')}>Upgrade</Button>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2"><Bell className="w-4 h-4 text-muted-foreground"/><h2 className="font-playfair font-semibold text-foreground">Preferences</h2></div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Email notifications</p><p className="text-xs text-muted-foreground">Receive summaries when polls close</p></div>
              <Switch checked={notifs} onCheckedChange={setNotifs}/>
            </div>
          </div>
        </motion.div>

        {/* Danger */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-card border border-destructive/30 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-destructive/20 flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive"/><h2 className="font-playfair font-semibold text-destructive">Danger zone</h2></div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Sign out</p><p className="text-xs text-muted-foreground">Log out on this device</p></div>
              <Button variant="outline" size="sm" onClick={()=>{signOut();navigate('/');}} className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"><LogOut className="w-3.5 h-3.5"/>Logout</Button>
            </div>
            <Separator/>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Delete account</p><p className="text-xs text-muted-foreground">Permanently remove all data</p></div>
              <Button variant="destructive" size="sm" onClick={()=>toast.error('Contact support to delete your account')}>Delete</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
