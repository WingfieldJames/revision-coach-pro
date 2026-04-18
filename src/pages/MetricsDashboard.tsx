import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/AdminGuard";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { RefreshCw, AlertTriangle } from "lucide-react";

const PIE_COLORS = ["hsl(var(--primary))", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const fmtGbp = (n: number) => `£${(n * 0.78).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

function MetricsContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.functions.invoke("get-metrics-dashboard");
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      setData(result);
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading metrics…</div>;
  }
  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">{error}</p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }
  if (!data) return null;

  const { stripe, supabase: sb, ai, derived, alerts, generated_at } = data;

  const subjectData = Object.entries(sb.subs_by_subject || {})
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);
  const qualData = Object.entries(sb.subs_by_qualification || {})
    .map(([name, value]) => ({ name, value: value as number }));
  const boardData = Object.entries(sb.subs_by_board || {})
    .map(([name, value]) => ({ name, value: value as number }));
  const tierRows = Object.entries(sb.subs_by_tier || {})
    .map(([tier, count]) => ({ tier, count: count as number }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">A* AI · Founder Metrics</h1>
            <p className="text-sm text-muted-foreground">
              Last refreshed {lastFetch?.toLocaleTimeString()} · auto-refresh every 5 min
            </p>
          </div>
          <Button onClick={load} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stripe error banner */}
        {stripe.stripe_error && (
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="pt-6 text-sm">
              <strong>Stripe data unavailable:</strong> {stripe.stripe_error}
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${a.level === "red" ? "text-destructive" : "text-yellow-500"}`} />
                  <span>{a.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="MRR" value={fmtUsd(stripe.mrr_usd)} sub={fmtGbp(stripe.mrr_usd) + " GBP"} />
          <KpiCard label="Daily Revenue" value={fmtUsd(stripe.daily_revenue_usd)} sub={`${stripe.new_subs_today} new today`} />
          <KpiCard label="Active Subscribers" value={String(sb.active_subscribers)} sub={`${sb.conversion_rate_pct}% conv.`} />
          <KpiCard label="Gross Margin" value={`${derived.gross_margin_pct}%`} sub={`AI ${derived.ai_cost_pct_of_revenue}% of rev`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue (last 30d)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stripe.revenue_30d}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmtUsd(Number(v))} />
                  <Line type="monotone" dataKey="usd" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">AI Cost (last 30d)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ai.cost_by_day}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmtUsd(Number(v))} />
                  <Line type="monotone" dataKey="usd" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">
                Total 30d: {fmtUsd(ai.cost_30d_usd)} · {ai.logged_calls_30d.toLocaleString()} logged calls · estimated days use {fmtUsd(ai.avg_cost_per_prompt_usd)}/prompt
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tiers + engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Subscribers by tier</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tierRows.length === 0 && <p className="text-sm text-muted-foreground">No active subs.</p>}
                {tierRows.map(r => (
                  <div key={r.tier} className="flex justify-between text-sm border-b border-border pb-2">
                    <span>{r.tier}</span>
                    <Badge variant="secondary">{r.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Engagement (last 30d)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Stat label="DAU" value={sb.dau} />
              <Stat label="WAU" value={sb.wau} />
              <Stat label="MAU" value={sb.mau} />
              <Stat label="Total prompts" value={sb.total_prompts_30d} />
              <Stat label="Avg sessions / user" value={sb.avg_sessions_per_user} />
              <Stat label="Avg msgs / session" value={sb.avg_messages_per_session} />
              <Stat label="New subs (week)" value={stripe.new_subs_week} />
              <Stat label="Avg time-to-paid" value={`${sb.avg_time_to_conversion_days}d`} />
            </CardContent>
          </Card>
        </div>

        {/* Product mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Subjects</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">A-Level vs GCSE</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={qualData} dataKey="value" nameKey="name" outerRadius={80} label>
                    {qualData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Exam boards</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={boardData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI cost detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Cost & tokens by feature</CardTitle></CardHeader>
            <CardContent>
              {ai.cost_by_feature.length === 0 && <p className="text-sm text-muted-foreground">No logged AI calls yet. Estimates shown in chart use prompt counts.</p>}
              <div className="space-y-2">
                {ai.cost_by_feature.sort((a: any, b: any) => b.cost_usd - a.cost_usd).map((f: any) => (
                  <div key={f.feature} className="flex justify-between text-sm border-b border-border pb-2">
                    <span className="capitalize">{f.feature}</span>
                    <span className="text-muted-foreground">
                      {fmtUsd(f.cost_usd)} · {f.tokens.toLocaleString()} tok · {f.calls} calls
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 heaviest users (by cost)</CardTitle></CardHeader>
            <CardContent>
              {ai.heaviest_users.length === 0 && <p className="text-sm text-muted-foreground">No user-attributed costs yet.</p>}
              <div className="space-y-2">
                {ai.heaviest_users.map((u: any) => (
                  <div key={u.user_id} className="flex justify-between text-sm border-b border-border pb-2">
                    <span className="truncate max-w-[200px]">{u.email}</span>
                    <span>{fmtUsd(u.cost_usd)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Generated {new Date(generated_at).toLocaleString()} · Internal use only
        </p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export const MetricsDashboard = () => (
  <AdminGuard>
    <MetricsContent />
  </AdminGuard>
);
