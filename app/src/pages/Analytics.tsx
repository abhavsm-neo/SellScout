import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Eye, MousePointer, MessageSquare, AlertCircle, Sparkles, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import PageHeader from '@/components/PageHeader';
import { useCountUp } from '@/hooks/useCountUp';
import { useInView } from '@/hooks/useInView';
import { campaigns as demoCampaigns, activityFeed, insights, prospectBreakdown } from '@/data/demoData';
import type { Insight } from '@/types';

/* ─── Metric Card ─── */
function MetricCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const { ref, value: displayValue } = useCountUp(value, 1000);
  return (
    <motion.div ref={ref} whileHover={{ borderColor: 'rgba(255,255,255,0.1)' }} className="bg-surface border border-white/[0.06] rounded-2xl p-6 cursor-pointer transition-colors">
      <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">{label}</span>
      <p className="text-4xl font-light text-white font-mono mt-3">{displayValue.toLocaleString()}{suffix}</p>
    </motion.div>
  );
}

/* ─── Insight Card ─── */
function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const iconColors: Record<string, { bg: string; iconCls: string; Icon: React.ElementType }> = {
    opportunity: { bg: 'bg-success/12', iconCls: 'text-success', Icon: TrendingUp },
    optimization: { bg: 'bg-gold/12', iconCls: 'text-gold', Icon: Zap },
    trend: { bg: 'bg-info/12', iconCls: 'text-info', Icon: Activity },
    warning: { bg: 'bg-danger/12', iconCls: 'text-danger', Icon: AlertCircle },
  };
  const style = iconColors[insight.type];
  const Icon = style.Icon;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.12 }} whileHover={{ borderColor: 'rgba(255,255,255,0.1)' }} className="bg-surface border border-white/[0.06] rounded-2xl p-7">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${style.bg} rounded-full flex items-center justify-center`}><Icon className={`w-5 h-5 ${style.iconCls}`} /></div>
        <span className={`text-[13px] font-medium tracking-[0.06em] uppercase ${style.iconCls}`}>{insight.type}</span>
      </div>
      <h4 className="text-lg font-medium text-white">{insight.title}</h4>
      <p className="text-sm text-white/60 leading-relaxed mt-2">{insight.description}</p>
      <button className="text-sm text-gold hover:text-gold/80 mt-4 flex items-center gap-1 transition-colors">{insight.action} &rarr;</button>
    </motion.div>
  );
}

/* ─── Activity Icon ─── */
function ActivityIcon({ type }: { type: string }) {
  const styles: Record<string, { bg: string; iconCls: string; Icon: React.ElementType }> = {
    open: { bg: 'bg-info/12', iconCls: 'text-info', Icon: Eye },
    click: { bg: 'bg-gold/12', iconCls: 'text-gold', Icon: MousePointer },
    reply: { bg: 'bg-success/12', iconCls: 'text-success', Icon: MessageSquare },
    bounce: { bg: 'bg-danger/12', iconCls: 'text-danger', Icon: AlertCircle },
  };
  const s = styles[type] || styles.open;
  const Icon = s.Icon;
  return <div className={`w-9 h-9 ${s.bg} rounded-full flex items-center justify-center flex-shrink-0`}><Icon className={`w-4 h-4 ${s.iconCls}`} /></div>;
}

/* ─── Donut Chart ─── */
function DonutChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <div className="flex flex-col items-center">
      <PieChart width={240} height={240}>
        <Pie data={data} cx={120} cy={120} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none" animationBegin={0} animationDuration={800}>
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
        </Pie>
      </PieChart>
      <div className="text-center -mt-4">
        <p className="text-2xl font-light text-white font-mono">{total.toLocaleString()}</p>
        <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">Total</p>
      </div>
    </div>
  );
}

/* ─── Custom Chart Tooltip ─── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-white/[0.06] rounded-xl px-4 py-3 shadow-card">
      <p className="text-xs text-white/35 mb-1">{label}</p>
      <p className="text-sm font-medium text-white">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

/* ─── Main Analytics Page ─── */
export default function Analytics() {
  const [chartTab, setChartTab] = useState<'opens' | 'clicks' | 'replies' | 'bounces'>('opens');
  const [granularity] = useState<'day' | 'week' | 'month'>('day');
  const [breakdownTab, setBreakdownTab] = useState<'companySize' | 'industry' | 'role'>('companySize');
  const [dateRange, setDateRange] = useState('30d');
  const tableInView = useInView();
  const { user } = useAuth();

  const dashboardQuery = trpc.analytics.dashboard.useQuery(undefined, { enabled: !!user });
  const campaignsQuery = trpc.analytics.campaigns.useQuery(undefined, { enabled: !!user });

  const metrics = user && dashboardQuery.data ? dashboardQuery.data : {
    totalSent: 24328, openRate: 68, replyRate: 34, meetingsBooked: 187, activeCampaigns: 4,
  };

  const campaignList = user && campaignsQuery.data
    ? campaignsQuery.data.map(c => ({
        id: String(c.id), name: c.name,
        status: c.status as 'active' | 'paused' | 'completed' | 'draft',
        sent: c.totalSent, openRate: c.totalSent ? Math.round(((c.totalOpened || 0) / c.totalSent) * 100 * 10) / 10 : 0,
        replyRate: c.totalSent ? Math.round(((c.totalReplied || 0) / c.totalSent) * 100 * 10) / 10 : 0,
        meetings: c.meetingsBooked, playbookName: c.playbook?.name || 'Unknown',
      }))
    : demoCampaigns.filter(c => c.status !== 'draft');

  const chartLabels = { opens: 'Opens', clicks: 'Clicks', replies: 'Replies', bounces: 'Bounces' };
  const breakdownData = prospectBreakdown[breakdownTab];

  return (
    <PageLayout>
      <PageHeader overline="INSIGHTS" title="Analytics" subtitle="Track every metric that matters. From opens to meetings booked, get real-time visibility into your outbound performance." />

      <div className="px-[8vw] pb-20">
        <div className="flex justify-end mb-6">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-surface border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white appearance-none">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="quarter">This quarter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <MetricCard label="Total Emails Sent" value={metrics.totalSent} />
          <MetricCard label="Average Open Rate" value={metrics.openRate} suffix="%" />
          <MetricCard label="Average Reply Rate" value={metrics.replyRate} suffix="%" />
          <MetricCard label="Meetings Booked" value={metrics.meetingsBooked} />
        </div>

        <div ref={tableInView.ref} className="mb-16">
          <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-2">Campaign Performance</h2>
          <p className="text-white/60 mb-6">View detailed breakdown of each campaign</p>
          <div className="bg-surface border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-[13px] font-medium tracking-[0.06em] uppercase text-white/35">
              <div className="col-span-3">Campaign</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Sent</div>
              <div className="col-span-2 text-right">Open Rate</div>
              <div className="col-span-2 text-right">Reply Rate</div>
              <div className="col-span-2 text-right">Meetings</div>
            </div>
            {campaignList.map((campaign, i) => (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 15 }} animate={tableInView.isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: i * 0.05 }} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] hover:bg-surface-elevated transition-colors items-center">
                <div className="col-span-3">
                  <p className="text-sm font-medium text-white">{campaign.name}</p>
                  <p className="text-xs text-white/35">{campaign.playbookName}</p>
                </div>
                <div className="col-span-1">
                  <span className={`text-xs px-2 py-1 rounded-md ${campaign.status === 'active' ? 'bg-success/12 text-success' : campaign.status === 'paused' ? 'bg-gold/12 text-gold' : 'bg-info/12 text-info'}`}>{campaign.status}</span>
                </div>
                <div className="col-span-2 text-right text-sm font-mono text-white/60">{campaign.sent?.toLocaleString()}</div>
                <div className="col-span-2 text-right text-sm font-mono text-white/60">{campaign.openRate}%</div>
                <div className="col-span-2 text-right text-sm font-mono text-success">{campaign.replyRate}% &uarr;</div>
                <div className="col-span-2 text-right text-sm font-mono text-white/60">{campaign.meetings}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-6">Engagement Trends</h2>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              {(['opens', 'clicks', 'replies', 'bounces'] as const).map(tab => (
                <button key={tab} onClick={() => setChartTab(tab)} className={`px-4 py-2 rounded-xl text-sm transition-all ${chartTab === tab ? 'bg-surface-elevated border border-white/[0.06] text-white' : 'text-white/35 hover:text-white/60'}`}>{chartLabels[tab]}</button>
              ))}
            </div>
            <div className="flex items-center bg-surface rounded-xl p-0.5">
              {(['day', 'week', 'month'] as const).map(g => (
                <button key={g} className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${granularity === g ? 'bg-gold text-[#050505]' : 'text-white/60'}`}>{g}</button>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-white/[0.06] rounded-2xl p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({ length: 30 }, (_, i) => ({ day: `Apr ${i + 1}`, opens: 180 + Math.floor(Math.random() * 140) + i * 3, clicks: 60 + Math.floor(Math.random() * 80) + i * 2, replies: 40 + Math.floor(Math.random() * 60) + i, bounces: 5 + Math.floor(Math.random() * 15) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8A45E" stopOpacity={0.15} /><stop offset="100%" stopColor="#C8A45E" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={chartTab} stroke="#C8A45E" strokeWidth={2} fill="url(#areaGradient)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-gold" /><span className="text-xs text-white/35">This period</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-white/15" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0, rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)' }} /><span className="text-xs text-white/35">Previous period</span></div>
          </div>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-4xl font-normal tracking-[-0.02em] text-white">AI Insights</h2>
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight, i) => <InsightCard key={insight.id} insight={insight} index={i} />)}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-4xl font-normal tracking-[-0.02em] text-white mb-6">Prospect Breakdown</h2>
          <div className="flex items-center gap-2 mb-8">
            {[{ key: 'companySize' as const, label: 'By Company Size' }, { key: 'industry' as const, label: 'By Industry' }, { key: 'role' as const, label: 'By Role' }].map(tab => (
              <button key={tab.key} onClick={() => setBreakdownTab(tab.key)} className={`px-4 py-2 rounded-xl text-sm transition-all ${breakdownTab === tab.key ? 'bg-surface-elevated border border-white/[0.06] text-white' : 'text-white/35 hover:text-white/60'}`}>{tab.label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex items-center justify-center"><DonutChart data={breakdownData} /></div>
            <div className="space-y-4">
              {breakdownData.map((item, i) => (
                <motion.div key={item.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4">
                  <span className="text-sm font-mono text-white/35 w-6">{i + 1}</span>
                  <span className="text-sm text-white w-28 truncate">{item.name}</span>
                  <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <span className="text-sm font-mono text-white/60 w-12 text-right">{item.percentage}%</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-4xl font-normal tracking-[-0.02em] text-white">Live Activity</h2>
            <span className="flex items-center gap-1.5 text-xs bg-success/12 text-success px-2.5 py-1 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-success animate-live-dot" />Live</span>
          </div>
          <div className="bg-surface border border-white/[0.06] rounded-2xl max-h-[480px] overflow-y-auto custom-scrollbar">
            {activityFeed.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] hover:bg-surface-elevated transition-colors">
                <ActivityIcon type={event.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white"><span className="font-medium">{event.prospectName}</span> at <span className="font-medium">{event.company}</span> <span className="text-white/60">{event.type === 'open' ? 'opened your email' : event.type === 'click' ? 'clicked a link' : event.type === 'reply' ? 'replied to' : 'bounced'}</span></p>
                  <p className="text-xs text-white/35 italic">{event.campaignName}</p>
                </div>
                <span className="text-xs text-white/35 flex-shrink-0">{event.timeAgo}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
