import { useState } from 'react';
import { User, Bell, Palette, Key, Globe, Trash2, Save } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

type Tab = 'profile' | 'appearance' | 'notifications' | 'api' | 'danger';

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile');
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', bio: '', website: '' });
  const [notifications, setNotifications] = useState({ email: true, browser: true, newVote: false, liveStart: true, weeklyReport: true });
  const [apiKey] = useState('op_live_sk_••••••••••••••••••••••••••••••••');

  const saveProfile = () => toast.success('Profile saved!');

  const TABS: { id: Tab; icon: any; label: string }[] = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'api', icon: Key, label: 'API Keys' },
    { id: 'danger', icon: Trash2, label: 'Danger Zone' },
  ];

  return (
    <div className="min-h-screen bg-parchment dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-charcoal dark:text-white mb-8">Settings</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-terracotta/10 text-terracotta'
                      : 'text-slate dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-charcoal dark:hover:text-white'
                  } ${id === 'danger' ? 'text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {tab === 'profile' && (
              <div className="card p-6 space-y-5">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Profile Information</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-terracotta/20 text-terracotta font-black text-2xl flex items-center justify-center">
                    {(user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <button className="text-sm text-terracotta font-medium hover:text-terracotta/80">Change avatar</button>
                    <p className="text-xs text-slate dark:text-gray-400 mt-0.5">JPG, PNG, or GIF. Max 2MB.</p>
                  </div>
                </div>

                {[
                  { label: 'Display Name', key: 'name', type: 'text', placeholder: 'Your name' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                  { label: 'Bio', key: 'bio', type: 'textarea', placeholder: 'A short bio about yourself' },
                  { label: 'Website', key: 'website', type: 'url', placeholder: 'https://your-website.com' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-1.5">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={(profile as any)[field.key]}
                        onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                        className="input-field resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={(profile as any)[field.key]}
                        onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}

                <button onClick={saveProfile} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="card p-6 space-y-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Appearance</h2>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: '☀️ Light', bg: 'bg-white', border: 'border-gray-200' },
                      { value: 'dark', label: '🌙 Dark', bg: 'bg-gray-900', border: 'border-gray-700' },
                      { value: 'system', label: '💻 System', bg: 'bg-gradient-to-br from-white to-gray-900', border: 'border-gray-300' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setTheme(opt.value as any); toast.success(`Theme set to ${opt.label}`); }}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          theme === opt.value ? 'border-terracotta' : `${opt.border} hover:border-terracotta/50`
                        }`}
                      >
                        <div className={`w-full h-12 rounded-lg ${opt.bg} mb-2 border border-gray-200`} />
                        <span className={`text-sm font-medium ${theme === opt.value ? 'text-terracotta' : 'text-charcoal dark:text-white'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Language</label>
                  <select className="input-field">
                    <option>English (US)</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Japanese</option>
                  </select>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="card p-6 space-y-5">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Notification Preferences</h2>
                {[
                  { key: 'email', label: 'Email notifications', desc: 'Receive email digests and alerts' },
                  { key: 'browser', label: 'Browser notifications', desc: 'Desktop push notifications' },
                  { key: 'newVote', label: 'New vote alerts', desc: 'Alert on each new vote (live polls)' },
                  { key: 'liveStart', label: 'Live poll started', desc: 'Notify when a poll goes live' },
                  { key: 'weeklyReport', label: 'Weekly analytics report', desc: 'Summary of your polls every Monday' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-charcoal dark:text-white">{label}</div>
                      <div className="text-xs text-slate dark:text-gray-400">{desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(notifications as any)[key] ? 'bg-terracotta' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${(notifications as any)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'api' && (
              <div className="card p-6 space-y-5">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">API Keys</h2>
                <p className="text-sm text-slate dark:text-gray-400">Use API keys to access OmniPoll programmatically.</p>
                <div className="bg-parchment dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate dark:text-gray-400 uppercase tracking-wider">Live Key</span>
                    <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('Copied!'); }} className="text-xs text-terracotta hover:text-terracotta/80">Copy</button>
                  </div>
                  <code className="text-sm font-mono text-charcoal dark:text-gray-200">{apiKey}</code>
                </div>
                <div className="text-sm text-slate dark:text-gray-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  ⚠️ Never share your secret API key. Treat it like a password.
                </div>
                <button onClick={() => toast.info('Key regeneration coming soon')} className="btn-primary flex items-center gap-2">
                  <Key className="w-4 h-4" /> Regenerate Key
                </button>
              </div>
            )}

            {tab === 'danger' && (
              <div className="card p-6 border-2 border-red-200 dark:border-red-800 space-y-5">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h2>
                <div className="space-y-4">
                  {[
                    { title: 'Delete all polls', desc: 'Permanently delete all your polls and their data.', action: 'Delete All Polls' },
                    { title: 'Delete account', desc: 'Permanently delete your account and all associated data. This cannot be undone.', action: 'Delete Account' },
                  ].map(({ title, desc, action }) => (
                    <div key={title} className="flex items-center justify-between py-3 border-t border-red-100 dark:border-red-900/30">
                      <div>
                        <div className="text-sm font-semibold text-charcoal dark:text-white">{title}</div>
                        <div className="text-xs text-slate dark:text-gray-400 mt-0.5">{desc}</div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure? This cannot be undone.`)) toast.error('Action would be permanent in production');
                        }}
                        className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap ml-4"
                      >
                        {action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
