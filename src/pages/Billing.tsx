import { Check, Zap, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

const PLANS = [
  { name:"Free", price:0, icon:"🌱", color:"border-border", btn:"outline" as const, desc:"Perfect for trying out OmniPoll",
    features:["5 polls/month","50 participants/poll","5 poll types","Basic analytics","QR join codes"] },
  { name:"Starter", price:12, icon:"⚡", color:"border-blue-300", btn:"outline" as const, desc:"For regular presenters & educators",
    features:["30 polls/month","250 participants/poll","12 poll types","Full analytics + export","Email support","Templates library"] },
  { name:"Pro", price:29, icon:"🚀", color:"border-terracotta", btn:"default" as const, desc:"For power users and teams", popular:true,
    features:["200 polls/month","2,000 participants/poll","All 20 poll types","AI moderation","Custom branding","API access","Priority support"] },
  { name:"Enterprise", price:99, icon:"🏢", color:"border-purple-300", btn:"outline" as const, desc:"For large organisations",
    features:["Unlimited polls","Unlimited participants","All 20 poll types","SSO / SAML","Dedicated support","SLA","On-premise option"] },
];

export default function Billing() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-playfair font-bold text-foreground">Simple, transparent pricing</h1>
          <p className="text-muted-foreground mt-2">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative bg-card rounded-2xl border-2 ${plan.color} p-6 flex flex-col shadow-sm ${plan.popular ? "shadow-lg scale-[1.02]" : ""}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</div>}
              <div className="text-3xl mb-2">{plan.icon}</div>
              <h2 className="text-xl font-playfair font-bold text-foreground">{plan.name}</h2>
              <div className="my-3">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/month</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-5">{plan.desc}</p>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button variant={plan.btn} className={plan.popular ? "bg-terracotta hover:bg-terracotta/90 text-white" : ""}>
                {plan.price === 0 ? "Current plan" : plan.name === "Enterprise" ? "Contact us" : "Upgrade"}
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-2xl p-8 text-center border border-border">
          <h3 className="text-xl font-playfair font-bold text-foreground mb-2">Need a custom solution?</h3>
          <p className="text-muted-foreground mb-4">We offer custom plans for large organisations, universities, and government bodies.</p>
          <Button variant="outline" className="gap-2"><Building2 className="w-4 h-4" />Talk to sales</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
