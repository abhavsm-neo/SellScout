import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MoreVertical, ChevronLeft, ChevronRight, Mail, Upload, Users, Sparkles, Play, Pause, BarChart3, Trash2, Copy, Send, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { campaigns as demoCampaigns } from '@/data/demoData';
import type { SequenceStep } from '@/types';

interface DBCampaign {
  id: number;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalSent: number | null;
  totalOpened: number | null;
  totalReplied: number | null;
  meetingsBooked: number | null;
  createdAt: Date;
  launchedAt: Date | null;
  playbook: { name: string } | null;
}

function dbToCampaign(db: DBCampaign) {
  const sent = db.totalSent || 0;
  const replied = db.totalReplied || 0;
  const opened = db.totalOpened || 0;
  return {
    id: String(db.id),
    name: db.name,
    status: db.status,
    sent: db.totalSent,
    replyRate: sent > 0 ? Math.round((replied / sent) * 100 * 10) / 10 : null,
    openRate: sent > 0 ? Math.round((opened / sent) * 100 * 10) / 10 : null,
    meetings: db.meetingsBooked,
    createdAt: db.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    playbookName: db.playbook?.name || 'Unknown',
    lastSent: db.launchedAt ? 'Recently' : undefined,
  };
}

/* ─── Campaign Row ─── */
function CampaignRow({ campaign, index }: { campaign: ReturnType<typeof dbToCampaign>; index: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const replyUp = campaign.replyRate !== null && campaign.replyRate > 30;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.06 }} className="bg-surface border border-white/[0.06] rounded-xl p-5 hover:bg-surface-elevated transition-colors duration-150">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h4 className="text-base font-medium text-white truncate">{campaign.name}</h4>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-white/35 mt-1">{campaign.playbookName}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 lg:gap-x-12">
          <div><p className="text-xs text-white/35 uppercase tracking-wider">Sent</p><p className="text-sm font-mono text-white/60">{campaign.sent?.toLocaleString() || '—'}</p></div>
          <div><p className="text-xs text-white/35 uppercase tracking-wider">Reply Rate</p><p className={`text-sm font-mono flex items-center gap-1 ${replyUp ? 'text-success' : 'text-white/60'}`}>{campaign.replyRate !== null ? `${campaign.replyRate}%` : '—'}{campaign.replyRate !== null && (replyUp ? '↑' : '↓')}</p></div>
          <div><p className="text-xs text-white/35 uppercase tracking-wider">Meetings</p><p className="text-sm font-mono text-white/60">{campaign.meetings ?? '—'}</p></div>
          <div><p className="text-xs text-white/35 uppercase tracking-wider">Created</p><p className="text-xs text-white/35">{campaign.createdAt}</p></div>
        </div>
        <div className="relative self-end lg:self-center">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-white/[0.06]"><MoreVertical className="w-4 h-4 text-white/35" /></button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-8 z-20 bg-surface-elevated border border-white/[0.06] rounded-xl py-1.5 min-w-[160px] shadow-card">
                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] text-left"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] text-left">{campaign.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}{campaign.status === 'active' ? 'Pause' : 'Resume'}</button>
                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] text-left"><BarChart3 className="w-3.5 h-3.5" /> View Analytics</button>
                  <div className="border-t border-white/[0.06] my-1" />
                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger/70 hover:text-danger hover:bg-white/[0.04] text-left"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Campaign Builder Wizard ─── */
function CampaignBuilder({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedPlaybook, setSelectedPlaybook] = useState<number | null>(null);
  const [prospectCount] = useState(247);
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([
    { id: '1', day: 0, type: 'email', label: 'Introduction', subject: "Quick question about {{company}}'s outbound", body: "Hi {{first_name}},\n\nI noticed {{company}} has been growing fast in the {{industry}} space. I help teams like yours increase outbound reply rates by 3x using AI-personalized emails.\n\nWorth a quick chat?\n\nBest" },
    { id: '2', day: 3, type: 'email', label: 'Follow-up', subject: 'Following up: {{value_prop_1}} for {{company}}', body: "Hi {{first_name}},\n\nJust following up on my last note. {{company}}'s {{pain_point}} is something we solve for 200+ teams.\n\nOne of our clients in {{industry}} saw a 40% increase in meetings booked within 30 days.\n\nOpen to a 10-min call this week?\n\nBest" },
    { id: '3', day: 7, type: 'email', label: 'Break-up', subject: 'Should I close the loop?', body: "Hi {{first_name}},\n\nI don't want to clutter your inbox. I'll assume timing isn't right and close the loop on this.\n\nIf AI-powered outreach ever becomes a priority for {{company}}, feel free to reach out.\n\nBest of luck!\n\nBest" },
  ]);
  const [launched, setLaunched] = useState(false);

  const playbookQuery = trpc.playbook.list.useQuery();
  const createCampaign = trpc.campaign.create.useMutation();

  const canProceed = () => {
    if (step === 1) return !!selectedPlaybook;
    if (step === 2) return prospectCount > 0;
    if (step === 3) return sequenceSteps.every(s => s.subject && s.body);
    return true;
  };

  const goNext = () => { if (step < 4) { setDirection(1); setStep(step + 1); } };
  const goBack = () => { if (step > 1) { setDirection(-1); setStep(step - 1); } };
  const updateStep = (id: string, field: keyof SequenceStep, value: string | number) => {
    setSequenceSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleLaunch = () => {
    if (selectedPlaybook) {
      createCampaign.mutate({ playbookId: selectedPlaybook, name: 'New Campaign' }, {
        onSuccess: () => setLaunched(true),
      });
    } else {
      setLaunched(true);
    }
  };

  if (launched) {
    return (
      <div className="px-[8vw] pb-20 pt-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-[500px] mx-auto text-center">
          <div className="w-20 h-20 bg-success/12 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-4">Campaign Launched!</h2>
          <p className="text-white/60 mb-8">Your campaign is now live. AI will personalize every email for each of your {prospectCount} prospects.</p>
          <button onClick={onBack} className="bg-gold text-[#050505] px-8 py-3 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:scale-[1.02] transition-all">Back to Campaigns</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-[8vw] pb-20">
      <div className="sticky top-[72px] z-30 bg-[#050505]/95 backdrop-blur-lg -mx-[8vw] px-[8vw] py-4 border-b border-white/[0.06] mb-8">
        <div className="flex items-center justify-center gap-0 max-w-[600px] mx-auto">
          {[{ num: 1, label: 'Playbook' }, { num: 2, label: 'Prospects' }, { num: 3, label: 'Sequence' }, { num: 4, label: 'Launch' }].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${step > s.num ? 'bg-success text-[#050505]' : step === s.num ? 'bg-gold text-[#050505]' : 'bg-surface border border-white/[0.06] text-white/35'}`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-[11px] mt-1.5 ${step >= s.num ? 'text-white/60' : 'text-white/35'}`}>{s.label}</span>
              </div>
              {i < 3 && <div className="w-16 sm:w-24 h-px mx-2 mb-5"><div className="h-full transition-all duration-400" style={{ background: step > s.num ? '#4CAF7D' : 'rgba(255,255,255,0.06)', width: step > s.num ? '100%' : '0%' }} /></div>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={step} custom={direction} initial={{ x: direction * 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: direction * -30, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="max-w-[900px] mx-auto min-h-[500px]">
          {step === 1 && (
            <div>
              <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-2">Choose a Playbook</h2>
              <p className="text-white/60 mb-8">Select the product playbook that this campaign will promote.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(playbookQuery.data || []).map(pb => (
                  <button key={pb.id} onClick={() => setSelectedPlaybook(pb.id)} className={`text-left p-5 rounded-2xl border transition-all duration-200 ${selectedPlaybook === pb.id ? 'border-gold bg-gold/[0.04]' : 'border-white/[0.06] bg-surface hover:border-white/[0.12]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pb.color || '#C8A45E' }} />
                        <span className="font-medium text-white">{pb.name}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlaybook === pb.id ? 'border-gold' : 'border-white/20'}`}>{selectedPlaybook === pb.id && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}</div>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{pb.description}</p>
                  </button>
                ))}
                {(!playbookQuery.data || playbookQuery.data.length === 0) && (
                  <div className="col-span-2 text-center py-8 text-white/35">No playbooks found. Create one first.</div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-2">Add Your Prospects</h2>
              <p className="text-white/60 mb-8">Upload a CSV file or add prospects manually.</p>
              <div className="border-2 border-dashed border-white/[0.06] rounded-2xl p-12 text-center hover:border-gold/30 transition-colors">
                <Upload className="w-12 h-12 text-white/35 mx-auto mb-4" />
                <p className="text-lg font-medium text-white/60 mb-1">Drag & drop your CSV file here</p>
                <p className="text-sm text-gold underline cursor-pointer">or click to browse</p>
                <p className="text-xs text-white/35 mt-3">Supports .csv, .xlsx up to 10MB</p>
              </div>
              <div className="flex items-center gap-4 my-6"><div className="flex-1 h-px bg-white/[0.06]" /><span className="text-xs text-white/35 uppercase">or</span><div className="flex-1 h-px bg-white/[0.06]" /></div>
              <div className="bg-surface border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-white/60" /><span className="text-sm font-medium text-white/60">Bulk paste emails or LinkedIn URLs</span></div>
                <textarea className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors min-h-[120px] resize-none text-sm" placeholder="Paste emails or LinkedIn URLs, one per line..." defaultValue={"sarah.chen@stripe.com\ndavid.park@notion.so\nlisa.wong@figma.com\nalex.rivera@linear.app\nemma.thompson@shopify.com\nmichael.chen@airtable.com\nrachel.kim@datadog.com\ntom.harris@twilio.com"} />
              </div>
              <div className="mt-6 bg-surface-elevated border border-gold/20 rounded-2xl p-4 flex items-center justify-between max-w-[300px] ml-auto">
                <div><p className="text-lg font-medium text-white">{prospectCount} prospects</p><p className="text-xs text-white/35">Estimated delivery: ~3 days</p></div>
                <Users className="w-8 h-8 text-gold/60" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-2">Build Your Sequence</h2>
              <p className="text-white/60 mb-8">Create a multi-step email sequence. AI will personalize each email for every prospect.</p>
              <div className="space-y-6">
                {sequenceSteps.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium ${i === 0 ? 'bg-gold text-[#050505]' : 'bg-surface border border-white/[0.06] text-white/60'}`}>{i + 1}</div>
                      {i < sequenceSteps.length - 1 && <div className="w-px flex-1 bg-white/[0.06] my-1" />}
                    </div>
                    <div className="flex-1 bg-surface border border-white/[0.06] rounded-2xl p-5 mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-gold">{s.label}</span>
                          <select value={s.day} onChange={e => updateStep(s.id, 'day', parseInt(e.target.value))} className="bg-surface-elevated border border-white/[0.06] rounded-lg px-2 py-1 text-xs text-white">
                            {[0, 1, 2, 3, 5, 7, 10, 14].map(d => <option key={d} value={d}>Day {d}</option>)}
                          </select>
                        </div>
                        {sequenceSteps.length > 1 && <button onClick={() => setSequenceSteps(prev => prev.filter(x => x.id !== s.id))} className="p-1 text-white/25 hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-white/35 mb-1 block">Subject *</label>
                          <div className="relative">
                            <input type="text" value={s.subject} onChange={e => updateStep(s.id, 'subject', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none transition-colors" />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Suggest</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-white/35 mb-1 block">Email Body</label>
                          <textarea value={s.body} onChange={e => updateStep(s.id, 'body', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:border-gold/50 focus:outline-none transition-colors min-h-[160px] resize-none" />
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-white/25">Tokens:</span>
                            {['{{first_name}}', '{{company}}', '{{title}}', '{{industry}}'].map(token => (
                              <button key={token} onClick={() => updateStep(s.id, 'body', s.body + ' ' + token)} className="text-[11px] px-2 py-0.5 bg-white/[0.04] rounded text-white/40 hover:text-gold hover:bg-gold/10 transition-colors">{token}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                        <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"><Sparkles className="w-3 h-3" /> Rewrite with AI</button>
                        <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"><Copy className="w-3 h-3" /> A/B Test Variant</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {sequenceSteps.length < 5 && <button onClick={() => setSequenceSteps(prev => [...prev, { id: Math.random().toString(36).slice(2), day: (prev[prev.length - 1]?.day || 0) + 3, type: 'email', label: 'Follow-up', subject: '', body: '' }])} className="flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/[0.06] border-dashed rounded-xl px-4 py-3 mt-4 ml-11 transition-colors"><Plus className="w-4 h-4" /> Add Step</button>}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-2">Review & Launch</h2>
              <p className="text-white/60 mb-8">Review your campaign before launching.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mb-3">Playbook</p>
                  <p className="text-lg font-medium text-white">{playbookQuery.data?.find(p => p.id === selectedPlaybook)?.name || 'Not selected'}</p>
                </div>
                <div className="bg-surface border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mb-3">Prospects</p>
                  <p className="text-3xl font-light text-white font-mono">{prospectCount}</p>
                  <p className="text-sm text-white/60 mt-1">prospects ready</p>
                </div>
                <div className="bg-surface border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mb-3">Sequence</p>
                  <p className="text-lg font-medium text-white">{sequenceSteps.length} steps</p>
                  <p className="text-sm text-white/60 mt-1">{Math.max(...sequenceSteps.map(s => s.day))} days total</p>
                </div>
              </div>
              <div className="bg-surface border border-white/[0.06] rounded-2xl p-5 mb-8">
                <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35 mb-4">Preview</p>
                <div className="space-y-4">
                  {sequenceSteps.map((s, i) => (
                    <div key={s.id} className="bg-surface-elevated rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2"><Mail className="w-3.5 h-3.5 text-white/35" /><span className="text-xs text-white/35">Step {i + 1} — Day {s.day}</span></div>
                      <p className="text-sm font-medium text-white">{s.subject}</p>
                      <p className="text-sm text-white/60 mt-1 line-clamp-2">{s.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gold/[0.05] border border-gold/20 rounded-3xl p-10 text-center">
                <Send className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-3xl font-normal tracking-[-0.02em] text-white mb-3">Ready to launch?</h3>
                <p className="text-white/60 max-w-[480px] mx-auto mb-6">Your campaign will start sending immediately. AI will personalize every email for each prospect.</p>
                <button onClick={handleLaunch} className="bg-gold text-[#050505] px-10 py-4 rounded-xl text-[13px] font-medium tracking-[0.06em] uppercase hover:scale-[1.02] animate-pulse-glow transition-all">Launch Campaign</button>
                <p className="text-xs text-white/35 mt-4">You will send ~{prospectCount} emails over ~{Math.max(...sequenceSteps.map(s => s.day))} days</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 z-30 bg-[#050505]/95 backdrop-blur-lg border-t border-white/[0.06] -mx-[8vw] px-[8vw] py-4 mt-12 flex items-center justify-between">
        {step > 1 ? <button onClick={goBack} className="flex items-center gap-2 border border-white/[0.06] text-white/60 px-5 py-2.5 rounded-xl text-sm hover:bg-surface-elevated hover:border-white/[0.12] transition-all"><ChevronLeft className="w-4 h-4" /> Back</button> : <button onClick={onBack} className="flex items-center gap-2 border border-white/[0.06] text-white/60 px-5 py-2.5 rounded-xl text-sm hover:bg-surface-elevated hover:border-white/[0.12] transition-all"><ChevronLeft className="w-4 h-4" /> Cancel</button>}
        {step < 4 ? <button onClick={goNext} disabled={!canProceed()} className="flex items-center gap-2 bg-gold text-[#050505] px-6 py-2.5 rounded-xl text-sm font-medium hover:scale-[1.02] transition-all disabled:opacity-30 disabled:hover:scale-100">Next <ChevronRight className="w-4 h-4" /></button> : <div />}
      </div>
    </div>
  );
}

/* ─── Main Campaigns Page ─── */
export default function Campaigns() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  const campaignQuery = trpc.campaign.list.useQuery(undefined, { enabled: !!user });

  const rawCampaigns = user && campaignQuery.data
    ? campaignQuery.data.map(dbToCampaign)
    : demoCampaigns.map(c => ({ ...c, lastSent: undefined }));

  const filtered = rawCampaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = rawCampaigns.filter(c => c.status === 'active').length;
  const totalSent = rawCampaigns.reduce((acc, c) => acc + (c.sent || 0), 0);
  const avgReply = rawCampaigns.filter(c => c.replyRate !== null).reduce((acc, c) => acc + (c.replyRate || 0), 0) / Math.max(rawCampaigns.filter(c => c.replyRate !== null).length, 1);
  const totalMeetings = rawCampaigns.reduce((acc, c) => acc + (c.meetings || 0), 0);

  if (builderOpen) {
    return (
      <PageLayout>
        <CampaignBuilder onBack={() => setBuilderOpen(false)} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader overline="OUTREACH" title="Campaigns" subtitle="Build multi-step email sequences, launch them to your prospects, and let AI optimize every touchpoint for maximum replies." />

      <div className="px-[8vw] pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[{ label: 'Active Campaigns', value: activeCount }, { label: 'Total Sent', value: totalSent.toLocaleString() }, { label: 'Avg. Reply Rate', value: `${avgReply.toFixed(1)}%` }, { label: 'Meetings Booked', value: totalMeetings }].map(stat => (
            <div key={stat.label} className="bg-surface border border-white/[0.06] rounded-xl p-4">
              <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">{stat.label}</p>
              <p className="text-2xl font-light text-white font-mono mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="w-[260px] bg-surface border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white appearance-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button onClick={() => setBuilderOpen(true)} className="flex items-center gap-2 bg-gold text-[#050505] px-5 py-2.5 rounded-xl text-[13px] font-medium tracking-[0.04em] hover:scale-[1.02] transition-all"><Plus className="w-4 h-4" /> New Campaign</button>
        </div>

        <div className="space-y-2">
          {filtered.map((campaign, i) => <CampaignRow key={campaign.id} campaign={campaign} index={i} />)}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="w-[120px] h-[120px] bg-surface-elevated border border-dashed border-white/[0.06] rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-16 h-16 text-white/35" /></div>
              <h3 className="text-xl font-medium text-white/60 mb-2">No campaigns yet</h3>
              <p className="text-sm text-white/35 mb-6">Create your first campaign to start reaching prospects</p>
              <button onClick={() => setBuilderOpen(true)} className="bg-gold text-[#050505] px-6 py-2.5 rounded-xl text-[13px] font-medium tracking-[0.04em]"><Plus className="w-4 h-4 inline mr-2" /> Create Campaign</button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
