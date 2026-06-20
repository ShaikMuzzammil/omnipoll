import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { useApp } from '@/context/AppContext';

export default function Settings() {
  const { user, refreshUser, logout } = useApp();
  const [tab, setTab] = useState<'profile'|'notifications'|'security'>('profile');

  const [name,    setName]    = useState(user?.name ?? '');
  const [inst,    setInst]    = useState(user?.institution ?? '');
  const [curPw,   setCurPw]   = useState('');
  const [newPw,   setNewPw]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  const [notifs, setNotifs] = useState({
    resultReleased: true, pollStarted: true, pollClosed: false,
    classroomInvite: true, quizGraded: true, weeklyDigest: false,
  });

  const profileMut = useMutation({
    mutationFn: () => authApi.update({ name, institution: inst }),
    onSuccess: () => { refreshUser(); toast.success('Profile updated!'); },
    onError: (e:Error) => toast.error(e.message),
  });

  const pwMut = useMutation({
    mutationFn: () => authApi.update({ currentPassword: curPw, newPassword: newPw }),
    onSuccess: () => { toast.success('Password changed!'); setCurPw(''); setNewPw(''); },
    onError: (e:Error) => toast.error(e.message),
  });

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() ?? 'OP';

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter">
      <h1 className="font-display text-2xl font-bold text-slate-800">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 p-1 rounded-xl">
        {[
          { id:'profile' as const,       label:'👤 Profile',       icon: User },
          { id:'notifications' as const, label:'🔔 Notifications', icon: Bell },
          { id:'security' as const,      label:'🔒 Security',      icon: Shield },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-terracotta-700' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <motion.div key="profile" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="op-card p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-terracotta-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold font-display">
              {initials}
            </div>
            <div>
              <p className="font-display font-semibold text-slate-800 text-lg">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="inline-block mt-1 text-xs bg-terracotta-100 text-terracotta-700 px-2 py-0.5 rounded-full font-medium capitalize">{user?.role}</span>
            </div>
          </div>

          <div className="border-t border-cream-200 pt-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email <span className="text-slate-400 font-normal">(read-only)</span></label>
              <input value={user?.email ?? ''} readOnly
                className="w-full px-3.5 py-2.5 border border-cream-200 rounded-xl text-sm bg-cream-100 text-slate-500 cursor-not-allowed"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Institution / School</label>
              <input value={inst} onChange={e => setInst(e.target.value)} placeholder="e.g. MIT, Acme Corp"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
            </div>
            <button onClick={() => profileMut.mutate()} disabled={profileMut.isPending}
              className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
              {profileMut.isPending ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Save Changes
            </button>
          </div>

          <div className="border-t border-cream-200 pt-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Danger Zone</p>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-400 px-4 py-2 rounded-xl transition-colors">
              Sign Out of All Devices
            </button>
          </div>
        </motion.div>
      )}

      {tab === 'notifications' && (
        <motion.div key="notifs" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="op-card p-6">
          <h3 className="font-display font-semibold text-slate-800 mb-5">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key:'resultReleased' as const, label:'Results released',    desc:'When your teacher releases quiz results and key sheets' },
              { key:'pollStarted' as const,    label:'Poll started',        desc:'When a new poll or quiz goes live in your classroom' },
              { key:'pollClosed' as const,     label:'Poll closed',         desc:'When a poll you participated in closes' },
              { key:'classroomInvite' as const,label:'Classroom invites',   desc:'When you\'re added to a new classroom' },
              { key:'quizGraded' as const,     label:'Quiz graded',         desc:'When your quiz attempt is graded' },
              { key:'weeklyDigest' as const,   label:'Weekly digest',       desc:'Weekly summary of your activity' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-2.5 border-b border-cream-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{n.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                </div>
                <button onClick={() => setNotifs(p => ({...p, [n.key]: !p[n.key]}))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${notifs[n.key] ? 'bg-terracotta-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[n.key] ? 'translate-x-5' : ''}`}/>
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => toast.success('Notification preferences saved!')}
            className="mt-5 flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
            <Check size={14}/> Save Preferences
          </button>
        </motion.div>
      )}

      {tab === 'security' && (
        <motion.div key="security" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="op-card p-6 space-y-5">
          <h3 className="font-display font-semibold text-slate-800">Change Password</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={curPw} onChange={e => setCurPw(e.target.value)}
                  placeholder="Current password"
                  className="w-full px-3.5 py-2.5 pr-10 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
                <button type="button" onClick={() => setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta-200"/>
            </div>
            <button onClick={() => { if(newPw.length < 6){toast.error('Min 6 chars'); return;} pwMut.mutate(); }}
              disabled={!curPw || !newPw || pwMut.isPending}
              className="flex items-center gap-2 bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
              {pwMut.isPending ? <Loader2 size={14} className="animate-spin"/> : <Shield size={14}/>} Update Password
            </button>
          </div>

          <div className="border-t border-cream-200 pt-5">
            <h3 className="font-display font-semibold text-slate-800 mb-3">Session Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-cream-100">
                <span className="text-slate-500">Account type</span>
                <span className="font-medium text-slate-700 capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Member since</span>
                <span className="font-medium text-slate-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : '—'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
