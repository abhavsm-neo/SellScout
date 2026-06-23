import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MoreVertical, ChevronLeft, Sparkles, Wand2, Copy, Trash2, Edit } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { playbooks as demoPlaybooks } from '@/data/demoData';
import type { Playbook } from '@/types';

/* ─── Types ─── */
interface DBPlaybook {
  id: number;
  userId: number;
  name: string;
  color: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  description: string | null;
  productName: string | null;
  tagline: string | null;
  website: string | null;
  category: string | null;
  valuePropositions: string[] | null;
  icpTitle: string | null;
  companySizes: string[] | null;
  industries: string[] | null;
  painPoints: string[] | null;
  keyFeatures: Array<{ name: string; description: string }> | null;
  pricing: string | null;
  competitors: string[] | null;
  differentiator: string | null;
  tone: string | null;
  maxLength: number | null;
  includeCTA: boolean | null;
  ctaText: string | null;
  signature: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function dbToPlaybook(db: DBPlaybook): Playbook {
  return {
    id: String(db.id),
    name: db.name,
    color: db.color,
    status: db.status,
    description: db.description || '',
    productName: db.productName || undefined,
    tagline: db.tagline || undefined,
    category: db.category || undefined,
    valuePropositions: db.valuePropositions || undefined,
    icpTitle: db.icpTitle || undefined,
    companySizes: db.companySizes || undefined,
    industries: db.industries || undefined,
    painPoints: db.painPoints || undefined,
    keyFeatures: db.keyFeatures || undefined,
    pricing: db.pricing || undefined,
    competitors: db.competitors || undefined,
    differentiator: db.differentiator || undefined,
    tone: db.tone || undefined,
    maxLength: db.maxLength || undefined,
    includeCTA: db.includeCTA || undefined,
    ctaText: db.ctaText || undefined,
    signature: db.signature || undefined,
    updatedAt: 'Recently',
    templateCount: 0,
    campaignCount: 0,
  };
}

/* ─── Playbook Card ─── */
function PlaybookCard({ playbook, onEdit, onDelete }: { playbook: Playbook; onEdit: (p: Playbook) => void; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.1)' }}
      transition={{ duration: 0.25 }}
      className="bg-surface border border-white/[0.06] rounded-2xl p-6 relative group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: playbook.color }} />
          <h4
            className="text-lg font-medium tracking-[-0.01em] text-white cursor-pointer hover:text-gold transition-colors"
            onClick={() => onEdit(playbook)}
          >
            {playbook.name}
          </h4>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-white/35" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 z-20 bg-surface-elevated border border-white/[0.06] rounded-xl py-1.5 min-w-[160px] shadow-card"
                >
                  <button onClick={() => { onEdit(playbook); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors text-left">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors text-left">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <div className="border-t border-white/[0.06] my-1" />
                  <button onClick={() => { onDelete(playbook.id); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-danger/70 hover:text-danger hover:bg-white/[0.04] transition-colors text-left">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <StatusBadge status={playbook.status} />

      <p className="text-sm text-white/60 leading-relaxed mt-3 line-clamp-2">{playbook.description}</p>

      <div className="flex items-center gap-4 mt-4 text-xs text-white/35">
        <span>Updated {playbook.updatedAt}</span>
        <span>{playbook.templateCount} templates</span>
        <span>{playbook.campaignCount} campaigns</span>
      </div>
    </motion.div>
  );
}

/* ─── Playbook Editor ─── */
function PlaybookEditor({ playbook, onBack }: { playbook: Playbook; onBack: () => void }) {
  const [form, setForm] = useState({ ...playbook });
  const [isDirty, setIsDirty] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const { addToast } = useToast();
  const updateMutation = trpc.playbook.update.useMutation({
    onSuccess: () => {
      addToast('success', 'Playbook saved successfully');
      setIsDirty(false);
    },
    onError: (err) => addToast('error', err.message),
  });
  const createMutation = trpc.playbook.create.useMutation({
    onSuccess: () => {
      addToast('success', 'Playbook created successfully');
      setIsDirty(false);
    },
    onError: (err) => addToast('error', err.message),
  });

  const updateField = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (playbook.id === 'new') {
      createMutation.mutate({
        name: form.name,
        description: form.description || undefined,
        productName: form.productName || undefined,
        tagline: form.tagline || undefined,
        category: form.category || undefined,
        valuePropositions: form.valuePropositions || undefined,
        icpTitle: form.icpTitle || undefined,
        companySizes: form.companySizes || undefined,
        industries: form.industries || undefined,
        painPoints: form.painPoints || undefined,
        tone: form.tone || undefined,
        differentiator: form.differentiator || undefined,
      });
      return;
    }
    updateMutation.mutate({
      id: Number(playbook.id),
      data: {
        name: form.name,
        description: form.description || undefined,
        productName: form.productName || undefined,
        tagline: form.tagline || undefined,
        category: form.category || undefined,
        valuePropositions: form.valuePropositions || undefined,
        icpTitle: form.icpTitle || undefined,
        companySizes: form.companySizes || undefined,
        industries: form.industries || undefined,
        painPoints: form.painPoints || undefined,
        tone: form.tone || undefined,
        differentiator: form.differentiator || undefined,
      },
    });
  };

  const generateAI = () => {
    setShowGenerate(true);
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        valuePropositions: [
          'Increase reply rates by 3x with AI-personalized outreach',
          'Save 10+ hours per week on email writing and research',
          'Book 40% more meetings with smart multi-step sequences',
        ],
        painPoints: [
          'Low reply rates on cold outreach',
          'Manual email personalization takes too long',
          'No visibility into what messaging works',
        ],
      }));
      setIsDirty(true);
      setShowGenerate(false);
    }, 2000);
  };

  const scoreFields = [
    !!(form.productName || form.name),
    (form.valuePropositions?.length || 0) >= 3,
    !!form.icpTitle,
    !!form.tone,
  ];
  const score = Math.round((scoreFields.filter(Boolean).length / scoreFields.length) * 100);

  return (
    <div className="px-[8vw] pb-20">
      <div className="sticky top-[72px] z-30 bg-[#050505]/95 backdrop-blur-lg border-b border-white/[0.06] -mx-[8vw] px-[8vw] py-3 flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Playbooks
        </button>
        <div className="flex items-center gap-3">
          <StatusBadge status={form.status} />
          <button
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
            className={`px-5 py-2 rounded-xl text-[13px] font-medium tracking-[0.04em] transition-all duration-200 ${
              isDirty ? 'bg-gold text-[#050505] hover:scale-[1.02]' : 'bg-white/[0.06] text-white/60'
            }`}
          >
            {updateMutation.isPending ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 lg:w-[60%] space-y-8">
          <div className="bg-surface border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-2xl font-medium tracking-[-0.01em] text-white mb-6">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Product Name *</label>
                <input type="text" value={form.productName || form.name} onChange={e => updateField('productName', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors" placeholder="e.g., SellScout AI Platform" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">One-line Description</label>
                <input type="text" value={form.tagline || ''} onChange={e => updateField('tagline', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors" placeholder="e.g., AI-powered outbound sales that converts" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Category</label>
                  <select value={form.category || ''} onChange={e => updateField('category', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors appearance-none">
                    <option value="">Select category</option>
                    {['SaaS', 'Fintech', 'HealthTech', 'EdTech', 'E-commerce', 'DevTools', 'AI/ML', 'Security', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Tone</label>
                  <select value={form.tone || ''} onChange={e => updateField('tone', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors appearance-none">
                    <option value="">Select tone</option>
                    {['Professional', 'Casual', 'Enthusiastic', 'Direct', 'Consultative', 'Witty'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-medium tracking-[-0.01em] text-white">Value Propositions</h3>
                <p className="text-xs text-white/35 mt-1">AI can generate these from your description</p>
              </div>
              <button onClick={generateAI} disabled={showGenerate} className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors disabled:opacity-50">
                <Sparkles className={`w-4 h-4 ${showGenerate ? 'animate-spin' : ''}`} />
                {showGenerate ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <div className="space-y-3">
              {(form.valuePropositions || []).map((vp, i) => (
                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3">
                  <textarea value={vp} onChange={e => { const newVps = [...(form.valuePropositions || [])]; newVps[i] = e.target.value; updateField('valuePropositions', newVps); }} className="flex-1 bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors min-h-[60px] resize-none text-sm" placeholder={`Value proposition ${i + 1}`} />
                  <button onClick={() => { const newVps = (form.valuePropositions || []).filter((_, idx) => idx !== i); updateField('valuePropositions', newVps); }} className="p-2 text-white/25 hover:text-danger transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
              <button onClick={() => updateField('valuePropositions', [...(form.valuePropositions || []), ''])} className="flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/[0.06] border-dashed rounded-xl px-4 py-3 w-full justify-center transition-colors">
                <Plus className="w-4 h-4" /> Add Value Proposition
              </button>
            </div>
          </div>

          <div className="bg-surface border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-2xl font-medium tracking-[-0.01em] text-white mb-6">Target Audience</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ideal Customer Profile</label>
                <input type="text" value={form.icpTitle || ''} onChange={e => updateField('icpTitle', e.target.value)} className="w-full bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors" placeholder="e.g., VP of Sales at Series A-C SaaS companies" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-3 block">Company Size</label>
                <div className="flex flex-wrap gap-2">
                  {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(size => (
                    <button key={size} onClick={() => { const current = form.companySizes || []; const next = current.includes(size) ? current.filter(s => s !== size) : [...current, size]; updateField('companySizes', next); }} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${(form.companySizes || []).includes(size) ? 'bg-gold/15 border border-gold/30 text-gold' : 'bg-surface-elevated border border-white/[0.06] text-white/60 hover:border-white/[0.12]'}`}>{size}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Pain Points</label>
                <div className="space-y-2">
                  {(form.painPoints || []).map((pp, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <textarea value={pp} onChange={e => { const newPps = [...(form.painPoints || [])]; newPps[i] = e.target.value; updateField('painPoints', newPps); }} className="flex-1 bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors min-h-[60px] resize-none text-sm" placeholder={`Pain point ${i + 1}`} />
                      <button onClick={() => { const newPps = (form.painPoints || []).filter((_, idx) => idx !== i); updateField('painPoints', newPps); }} className="p-2 text-white/25 hover:text-danger transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => updateField('painPoints', [...(form.painPoints || []), ''])} className="flex items-center gap-2 text-sm text-white/60 hover:text-white border border-white/[0.06] border-dashed rounded-xl px-4 py-3 w-full justify-center transition-colors">
                    <Plus className="w-4 h-4" /> Add Pain Point
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-[40%] space-y-6">
          <div className="lg:sticky lg:top-[130px]">
            <div className="bg-surface-elevated border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-gold" />
                <h4 className="text-lg font-medium text-white">AI Assistant</h4>
                <div className="w-2 h-2 rounded-full bg-success animate-live-dot ml-auto" />
              </div>
              <div className="flex items-center gap-4 mb-6 p-4 bg-surface rounded-xl">
                <div className="relative w-[60px] h-[60px]">
                  <svg className="w-[60px] h-[60px] -rotate-90" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle cx="30" cy="30" r="26" fill="none" stroke="#C8A45E" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`} strokeLinecap="round" className="transition-all duration-800" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-mono text-white">{score}</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/60">Playbook Strength</p>
                  <p className="text-xs text-white/35 mt-1">{score >= 75 ? 'Strong' : score >= 50 ? 'Good' : 'Needs work'}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[{ label: 'Product name set', done: !!(form.productName || form.name) }, { label: '3+ value props', done: (form.valuePropositions?.length || 0) >= 3 }, { label: 'ICP defined', done: !!form.icpTitle }, { label: 'Tone selected', done: !!form.tone }].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 text-sm">
                    {item.done ? <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-success" /></div> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                    <span className={item.done ? 'text-white/60' : 'text-white/35'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-white/[0.06] rounded-2xl p-6 mt-6">
              <h4 className="text-sm font-medium text-white/60 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button onClick={generateAI} disabled={showGenerate} className="w-full flex items-center justify-center gap-2 bg-gold text-[#050505] py-2.5 rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50">
                  <Wand2 className="w-4 h-4" /> {showGenerate ? 'Generating...' : 'Generate All with AI'}
                </button>
                <button className="w-full flex items-center justify-center gap-2 border border-white/[0.06] text-white/60 py-2.5 rounded-xl text-sm hover:bg-surface-elevated hover:border-white/[0.12] transition-all">
                  <Copy className="w-4 h-4" /> Import from Website
                </button>
                <button className="w-full flex items-center justify-center gap-2 border border-white/[0.06] text-white/60 py-2.5 rounded-xl text-sm hover:bg-surface-elevated hover:border-white/[0.12] transition-all">
                  <Sparkles className="w-4 h-4" /> Use Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Playbooks Page ─── */
export default function Playbooks() {
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const { addToast } = useToast();

  const playbookQuery = trpc.playbook.list.useQuery(undefined, { enabled: !!user });
  const deleteMutation = trpc.playbook.delete.useMutation({
    onSuccess: () => {
      addToast('success', 'Playbook deleted');
      playbookQuery.refetch();
    },
    onError: (err) => addToast('error', err.message),
  });

  const rawPlaybooks = user && playbookQuery.data
    ? playbookQuery.data.map(dbToPlaybook)
    : demoPlaybooks;

  const filtered = rawPlaybooks.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (editingPlaybook) {
    return (
      <PageLayout>
        <PlaybookEditor playbook={editingPlaybook} onBack={() => setEditingPlaybook(null)} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader overline="PRODUCT" title="Your Playbooks" subtitle="Document your products, value propositions, and ideal customer profiles. The AI learns from these playbooks to generate highly personalized outreach." />

      <div className="px-[8vw] pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search playbooks..." className="w-[280px] sm:w-[320px] bg-surface border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/50 focus:outline-none transition-colors" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white appearance-none">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button onClick={() => setEditingPlaybook({ id: 'new', name: 'New Playbook', color: '#C8A45E', status: 'draft', description: '', updatedAt: 'Just now', templateCount: 0, campaignCount: 0 })} className="flex items-center gap-2 bg-gold text-[#050505] px-5 py-2.5 rounded-xl text-[13px] font-medium tracking-[0.04em] hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4" /> Create Playbook
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.button whileHover={{ borderColor: 'rgba(200,164,94,0.3)', backgroundColor: 'rgba(200,164,94,0.03)' }} onClick={() => setEditingPlaybook({ id: 'new', name: 'New Playbook', color: '#C8A45E', status: 'draft', description: '', updatedAt: 'Just now', templateCount: 0, campaignCount: 0 })} className="border border-dashed border-white/[0.06] rounded-2xl min-h-[220px] flex flex-col items-center justify-center gap-3 transition-all">
            <Plus className="w-12 h-12 text-white/35" />
            <span className="text-lg font-medium text-white/60">Create New Playbook</span>
            <span className="text-xs text-white/35">Add a new product playbook</span>
          </motion.button>

          {filtered.map((playbook, i) => (
            <motion.div key={playbook.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <PlaybookCard playbook={playbook} onEdit={setEditingPlaybook} onDelete={(id) => deleteMutation.mutate({ id: Number(id) })} />
            </motion.div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
