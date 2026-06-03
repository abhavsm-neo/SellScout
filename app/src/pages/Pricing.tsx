import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, ShieldCheck, Lock, Server, Star,
  ChevronDown, ArrowRight
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/PageHeader';
import { pricingComparison, faqData } from '@/data/demoData';
import { useInView } from '@/hooks/useInView';

/* ─── Pricing Card ─── */
function PricingCard({
  name, price, period, description, features, cta, ctaLink, popular
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ borderColor: popular ? 'rgba(200,164,94,0.4)' : 'rgba(255,255,255,0.1)' }}
      className={`relative bg-surface border rounded-2xl p-8 lg:p-10 transition-all ${
        popular
          ? 'border-gold/40 shadow-glow animate-pulse-soft'
          : 'border-white/[0.06]'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 right-6 bg-gold text-[#050505] text-[13px] font-medium tracking-[0.04em] px-3.5 py-1.5 rounded-md">
          Most Popular
        </div>
      )}

      <h3 className="text-2xl font-medium text-white">{name}</h3>
      <div className="flex items-baseline gap-1 mt-4">
        <span className="text-5xl font-light text-white">{price}</span>
        {period && <span className="text-white/35">{period}</span>}
      </div>
      <p className="text-sm text-white/60 mt-3">{description}</p>

      <div className="border-t border-white/[0.06] my-6" />

      <ul className="space-y-3">
        {features.map(f => (
          <li key={f} className="flex items-start gap-3 text-sm text-white/60">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        to={ctaLink}
        className={`block text-center w-full mt-8 py-3 rounded-xl text-[13px] font-medium tracking-[0.04em] transition-all ${
          popular
            ? 'bg-gold text-[#050505] hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(200,164,94,0.25)]'
            : 'border border-white/[0.06] text-white/60 hover:bg-surface-elevated hover:border-white/[0.12]'
        }`}
      >
        {cta}
      </Link>

      {popular && (
        <p className="text-xs text-white/35 text-center mt-3">
          14-day free trial &middot; No credit card required
        </p>
      )}
    </motion.div>
  );
}

/* ─── FAQ Item ─── */
function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <h4 className="text-base font-medium text-white pr-4">{question}</h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="w-5 h-5 text-white/35 flex-shrink-0" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5 border-t border-white/[0.06]">
          <p className="text-sm text-white/60 leading-relaxed pt-4">{answer}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Pricing Page ─── */
export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ctaRef = useInView();

  const starterFeatures = [
    '1 active playbook',
    '50 emails per month',
    '1-step campaigns only',
    'Basic AI personalization',
    'Open & click tracking',
    'Email support',
  ];

  const proFeatures = [
    'Unlimited playbooks',
    '2,000 emails per month',
    'Multi-step sequences (up to 5)',
    'Advanced AI personalization',
    'A/B testing',
    'Priority AI insights',
    'CRM integrations (Salesforce, HubSpot)',
    'Priority support',
  ];

  const enterpriseFeatures = [
    'Everything in Professional',
    'Unlimited emails',
    'Unlimited sequences',
    'Custom AI training',
    'Dedicated account manager',
    'SSO & advanced security',
    'Custom integrations',
    'SLA guarantee',
    'Onboarding & training',
  ];

  return (
    <PageLayout>
      <PageHeader
        overline="PRICING"
        title="Simple, Transparent Pricing"
        subtitle="Start free, scale as you grow. No hidden fees, no surprises. Every plan includes our core AI features."
      />

      <div className="px-[8vw] pb-20">
        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center bg-surface border border-white/[0.06] rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                billing === 'monthly' ? 'bg-gold text-[#050505]' : 'text-white/60'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'annual' ? 'bg-gold text-[#050505]' : 'text-white/60'
              }`}
            >
              Annual
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-md">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto mb-24">
          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-2 lg:order-1"
          >
            <PricingCard
              name="Starter"
              price="$0"
              period="/mo"
              description="Perfect for individuals and small teams getting started with AI outbound."
              features={starterFeatures}
              cta="Get Started Free"
              ctaLink="/campaigns"
            />
          </motion.div>

          {/* Professional */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            className="order-1 lg:order-2"
          >
            <PricingCard
              name="Professional"
              price={billing === 'annual' ? '$39' : '$49'}
              period="/mo"
              description="For growing sales teams that need scale and advanced AI features."
              features={proFeatures}
              cta="Start Free Trial"
              ctaLink="/campaigns"
              popular
            />
          </motion.div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-3"
          >
            <PricingCard
              name="Enterprise"
              price="Custom"
              description="For large teams with high-volume needs and custom requirements."
              features={enterpriseFeatures}
              cta="Contact Sales"
              ctaLink="#"
            />
          </motion.div>
        </div>

        {/* Feature Comparison */}
        <div className="max-w-[1000px] mx-auto mb-24">
          <h2 className="text-4xl font-normal tracking-[-0.02em] text-white text-center mb-10">Compare Plans</h2>

          <div className="bg-surface border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/[0.06]">
              <div />
              <div className="text-center">
                <h4 className="text-base font-medium text-white">Starter</h4>
              </div>
              <div className="text-center">
                <h4 className="text-base font-medium text-white">Professional</h4>
                <p className="text-[11px] text-gold mt-1">Most Popular</p>
              </div>
              <div className="text-center">
                <h4 className="text-base font-medium text-white">Enterprise</h4>
              </div>
            </div>

            {/* Categories */}
            {pricingComparison.map((cat, catIdx) => (
              <div key={cat.category}>
                <div className="bg-surface-elevated px-6 py-3">
                  <span className="text-[13px] font-medium tracking-[0.08em] uppercase text-white/35">
                    {cat.category}
                  </span>
                </div>
                {cat.features.map((feature, fIdx) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: catIdx * 0.05 + fIdx * 0.03 }}
                    className="grid grid-cols-4 gap-4 px-6 py-3.5 border-b border-white/[0.04] hover:bg-surface-elevated transition-colors"
                  >
                    <span className="text-sm text-white">{feature.name}</span>
                    {[feature.starter, feature.professional, feature.enterprise].map((val, i) => (
                      <div key={i} className="flex items-center justify-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <span className="text-sm text-white/20">—</span>
                          )
                        ) : (
                          <span className="text-sm text-white/60">{val}</span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-[720px] mx-auto mb-24">
          <h2 className="text-4xl font-normal tracking-[-0.02em] text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqData.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Band */}
        <div className="bg-surface-elevated border-y border-white/[0.06] -mx-[8vw] px-[8vw] py-12 mb-24">
          <div className="max-w-[1000px] mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-success" />
              <p className="text-white/60">14-day money-back guarantee on all paid plans. No questions asked.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
              {[
                { icon: ShieldCheck, label: 'SOC 2 Compliant' },
                { icon: Lock, label: '256-bit Encryption' },
                { icon: Server, label: 'GDPR Ready' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-white/35" />
                  <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-gold fill-gold" />
              ))}
              <span className="text-sm text-white/60 ml-2">Rated 4.9/5 by 12,000+ users</span>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          ref={ctaRef.ref}
          className="text-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(200,164,94,0.03) 0%, transparent 70%)' }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={ctaRef.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[48px] font-normal tracking-[-0.02em] leading-[1.15] text-white"
          >
            Ready to Transform Your Outreach?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={ctaRef.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-white/60 leading-relaxed mt-4 max-w-[500px] mx-auto"
          >
            Join 12,000+ sales professionals using SellScout to book more meetings and close more deals.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={ctaRef.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9"
          >
            <Link
              to="/campaigns"
              className="flex items-center gap-2 bg-gold text-[#050505] px-8 py-3.5 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(200,164,94,0.25)] transition-all duration-200"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 border border-white/[0.06] text-white/60 px-8 py-3.5 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:bg-surface-elevated hover:border-white/[0.12] transition-all duration-200"
            >
              View Pricing
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={ctaRef.isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mt-5"
          >
            No credit card required &middot; 14-day free trial &middot; Cancel anytime
          </motion.p>
        </div>
      </div>
    </PageLayout>
  );
}
