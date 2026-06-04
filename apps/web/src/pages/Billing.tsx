import { useState } from 'react';
import { Check, Zap, Building2, Crown, ArrowRight, Shield, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free', name: 'Free', icon: '🌱', monthly: 0, annual: 0, color: 'sage',
    features: ['5 polls/month', '50 participants/poll', '5 poll types', 'Basic analytics', 'Community support', 'Join links + QR codes'],
    missing: ['Real-time live conducting', 'AI analytics', 'Custom branding', 'Team collaboration', 'API access', 'Priority support'],
  },
  {
    id: 'pro', name: 'Pro', icon: '⚡', monthly: 19, annual: 14, color: 'terracotta', popular: true,
    features: ['Unlimited polls', '500 participants/poll', 'All 20 poll types', 'Advanced analytics', 'AI insights', 'Real-time live mode', 'Custom branding', 'CSV/PDF export', 'Templates library', 'Priority email support'],
    missing: ['Team workspaces', 'SSO/SAML', 'Dedicated account manager'],
  },
  {
    id: 'team', name: 'Team', icon: '🏢', monthly: 49, annual: 38, color: 'blue',
    features: ['Everything in Pro', 'Up to 10 seats', '5,000 participants/poll', 'Team workspaces', 'Shared templates', 'Role-based access', 'Advanced moderation', 'Webhooks & API', 'Slack integration', 'Priority chat support'],
    missing: ['SSO/SAML', 'Dedicated account manager'],
  },
  {
    id: 'enterprise', name: 'Enterprise', icon: '🏛️', monthly: null, annual: null, color: 'charcoal',
    features: ['Everything in Team', 'Unlimited seats', 'Unlimited participants', 'SSO / SAML', 'Custom domain', 'White-labeling', 'SLA guarantee', 'Dedicated account manager', 'Custom integrations', '24/7 priority support'],
    missing: [],
  },
];

const ADDONS = [
  { name: 'Extra Participants Pack', desc: '1,000 additional participants per poll', price: 9 },
  { name: 'White-Label Domain', desc: 'Use your own domain for join links', price: 29 },
  { name: 'AI Analytics Pro', desc: 'Advanced sentiment analysis + custom reports', price: 19 },
];

export default function Billing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [currentPlan] = useState('free');

  const handleUpgrade = (planId: string) => {
    if (planId === 'enterprise') {
      window.open('mailto:sales@omnipoll.io?subject=Enterprise Inquiry', '_blank');
      return;
    }
    if (planId === currentPlan) return;
    toast.info('Stripe checkout coming soon — this is a demo build');
  };

  return (
    <div className="min-h-screen bg-parchment dark:bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-charcoal dark:text-white mb-3">
            Simple, <span className="text-terracotta">transparent</span> pricing
          </h1>
          <p className="text-slate dark:text-gray-400 max-w-xl mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 mt-6 bg-white dark:bg-gray-900 rounded-xl p-1 border border-clay/20 dark:border-gray-700">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-terracotta text-white' : 'text-slate dark:text-gray-400 hover:text-charcoal dark:hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${billing === 'annual' ? 'bg-terracotta text-white' : 'text-slate dark:text-gray-400 hover:text-charcoal dark:hover:text-white'}`}
            >
              Annual <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${billing === 'annual' ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>-27%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-12">
          {PLANS.map(plan => {
            const price = billing === 'annual' ? plan.annual : plan.monthly;
            const isCurrent = plan.id === currentPlan;
            return (
              <div
                key={plan.id}
                className={`card p-6 relative flex flex-col ${plan.popular ? 'border-2 border-terracotta ring-4 ring-terracotta/10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-3xl mb-2">{plan.icon}</div>
                <h3 className="text-xl font-bold text-charcoal dark:text-white">{plan.name}</h3>
                <div className="my-4">
                  {price !== null ? (
                    <>
                      <span className="text-4xl font-black text-charcoal dark:text-white">${price}</span>
                      <span className="text-slate dark:text-gray-400 text-sm">/mo{billing === 'annual' ? ', billed annually' : ''}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-charcoal dark:text-white">Custom</span>
                  )}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold mb-5 transition-all ${
                    isCurrent
                      ? 'bg-gray-100 dark:bg-gray-800 text-slate dark:text-gray-400 cursor-default'
                      : plan.popular
                      ? 'bg-terracotta text-white hover:bg-terracotta/90'
                      : 'border border-clay dark:border-gray-600 text-charcoal dark:text-white hover:bg-white dark:hover:bg-gray-800'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                  {!isCurrent && <ArrowRight className="inline w-4 h-4 ml-1" />}
                </button>

                <div className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                      <span className="text-charcoal dark:text-gray-200">{f}</span>
                    </div>
                  ))}
                  {plan.missing.slice(0, 3).map(f => (
                    <div key={f} className="flex items-start gap-2 text-sm opacity-40">
                      <div className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center text-slate">—</div>
                      <span className="text-slate dark:text-gray-500">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-5">Add-ons</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {ADDONS.map(addon => (
              <div key={addon.name} className="card p-5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-charcoal dark:text-white text-sm">{addon.name}</div>
                  <div className="text-xs text-slate dark:text-gray-400 mt-1">{addon.desc}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-black text-terracotta">${addon.price}</div>
                  <div className="text-xs text-slate dark:text-gray-400">/mo</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Shield, title: '30-day money back', desc: 'Not satisfied? Get a full refund within 30 days, no questions asked.' },
            { icon: CreditCard, title: 'Secure payments', desc: 'All payments processed by Stripe. We never store your card details.' },
            { icon: Zap, title: 'Instant activation', desc: 'Your plan upgrades instantly. No waiting, no provisioning delay.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <div className="font-semibold text-charcoal dark:text-white text-sm mb-1">{title}</div>
                <div className="text-xs text-slate dark:text-gray-400">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I change plans anytime?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately and we prorate the difference.' },
              { q: 'What happens to my data if I downgrade?', a: "Your polls and analytics are preserved. If you exceed free plan limits, older polls become read-only until you either upgrade or delete some." },
              { q: 'Do you offer nonprofit or education discounts?', a: 'Yes — email us at billing@omnipoll.io with proof of status and we\'ll apply a 50% discount.' },
              { q: 'Is there a self-hosted option?', a: 'Enterprise customers can request a self-hosted deployment. Contact our sales team for details.' },
            ].map(({ q, a }) => (
              <div key={q} className="card p-5">
                <div className="font-semibold text-charcoal dark:text-white mb-2">{q}</div>
                <div className="text-sm text-slate dark:text-gray-400">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
