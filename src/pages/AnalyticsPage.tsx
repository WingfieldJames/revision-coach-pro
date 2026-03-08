import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Users,
  TrendingUp,
  CreditCard,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Crown,
  Calendar,
  Shield,
} from "lucide-react";

const CHART_COLORS = [
  "hsl(271, 81%, 56%)",
  "hsl(211, 90%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(30, 90%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(190, 80%, 45%)",
  "hsl(60, 70%, 50%)",
  "hsl(0, 70%, 55%)",
];

interface AnalyticsData {
  overview: {
    totalUsers: number;
    signupsToday: number;
    signupsThisWeek: number;
    signupsThisMonth: number;
    totalPaying: number;
    conversionRate: number;
    estimatedMRR: number;
    activeSubscriptions: number;
    monthlyCount: number;
    lifetimeCount: number;
    manualCount: number;
  };
  dailySignups: { date: string; count: number }[];
  weeklySignups: { weekOf: string; count: number }[];
  productUsage: {
    id: string;
    name: string;
    subject: string;
    examBoard: string;
    totalPrompts: number;
    uniqueUsers: number;
    subscribers: number;
  }[];
  dailyPrompts: { date: string; count: number }[];
  dailyPromptsByProduct: Record<string, Record<string, number>>;
  toolUsage: { tool: string; count: number }[];
  subsByProduct: {
    id: string;
    name: string;
    count: number;
    monthly: number;
    lifetime: number;
    manual: number;
  }[];
  recentSubscriptions: {
    product_name: string;
    payment_type: string;
    tier: string;
    active: boolean;
    created_at: string;
    subscription_end: string;
  }[];
  products: { id: string; name: string }[];
}

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        setError("Please log in");
        setLoading(false);
        return;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke(
        "get-analytics"
      );

      if (fnError) {
        setError(fnError.message || "Failed to load analytics");
        setLoading(false);
        return;
      }

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setData(result);
      setLoading(false);
    };

    fetchAnalytics();
  }, [user]);

  // Get filtered daily prompts for selected product
  const getFilteredDailyPrompts = () => {
    if (!data) return [];
    if (selectedProduct === "all") return data.dailyPrompts;

    const productDays = data.dailyPromptsByProduct[selectedProduct] || {};
    return Object.entries(productDays)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // 7-day moving average for signups
  const getSignupsWithMA = () => {
    if (!data) return [];
    return data.dailySignups.map((item, i) => {
      const slice = data.dailySignups.slice(Math.max(0, i - 6), i + 1);
      const ma = slice.reduce((sum, s) => sum + s.count, 0) / slice.length;
      return { ...item, ma: Math.round(ma * 10) / 10 };
    });
  };

  const paymentPieData = data
    ? [
        { name: "Monthly", value: data.overview.monthlyCount },
        { name: "Lifetime", value: data.overview.lifetimeCount },
        { name: "Manual", value: data.overview.manualCount },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const selectedProductName =
    selectedProduct === "all"
      ? "All Products"
      : data.products.find((p) => p.id === selectedProduct)?.name || "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              A* AI Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Internal dashboard · {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            Admin
          </Badge>
        </div>

        {/* ============ SECTION 1: KPI CARDS ============ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={Users} label="Total Users" value={data.overview.totalUsers.toLocaleString()} />
          <KPICard icon={Calendar} label="Today" value={`+${data.overview.signupsToday}`} sub={`This week: +${data.overview.signupsThisWeek}`} />
          <KPICard icon={TrendingUp} label="This Month" value={`+${data.overview.signupsThisMonth}`} />
          <KPICard icon={CreditCard} label="Paying Users" value={data.overview.totalPaying.toLocaleString()} sub={`${data.overview.conversionRate}% conversion`} accent />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard icon={Crown} label="Lifetime / ESP" value={data.overview.lifetimeCount.toString()} />
          <KPICard icon={Activity} label="Monthly" value={data.overview.monthlyCount.toString()} />
          <KPICard icon={Zap} label="Manual" value={data.overview.manualCount.toString()} />
          <KPICard icon={BarChart3} label="Est. MRR" value={`£${data.overview.estimatedMRR}`} accent />
        </div>

        {/* ============ SECTION 2: USER GROWTH ============ */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            User Growth
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Daily signups line chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Signups (90 days)</CardTitle>
                <CardDescription>With 7-day moving average</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getSignupsWithMA()}>
                      <defs>
                        <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v.slice(5)} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="count" stroke="hsl(271, 81%, 56%)" fill="url(#signupGradient)" strokeWidth={1.5} name="Signups" />
                      <Line type="monotone" dataKey="ma" stroke="hsl(211, 90%, 50%)" strokeWidth={2} dot={false} name="7d MA" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly signups bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weeklySignups}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="weekOf" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v.slice(5)} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(271, 81%, 56%)" radius={[4, 4, 0, 0]} name="Signups" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============ SECTION 3: PRODUCT ANALYTICS ============ */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Product Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Product usage ranked bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Prompt Usage by Product (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.productUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="totalPrompts" fill="hsl(271, 81%, 56%)" radius={[0, 4, 4, 0]} name="Prompts" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Subscribers by product */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Subscribers by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.subsByProduct.filter((s) => s.count > 0)}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        label={({ name, count }) => `${name}: ${count}`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {data.subsByProduct
                          .filter((s) => s.count > 0)
                          .map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily prompts with product filter */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Daily Prompts — {selectedProductName}</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </div>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {data.products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getFilteredDailyPrompts()}>
                    <defs>
                      <linearGradient id="promptGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(211, 90%, 50%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(211, 90%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(211, 90%, 50%)" fill="url(#promptGradient)" strokeWidth={2} name="Prompts" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product breakdown table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Product Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Prompts (30d)</TableHead>
                    <TableHead className="text-right">Active Users</TableHead>
                    <TableHead className="text-right">Subscribers</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productUsage.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.totalPrompts.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{p.uniqueUsers}</TableCell>
                      <TableCell className="text-right">{p.subscribers}</TableCell>
                      <TableCell className="text-right">
                        {p.uniqueUsers > 0
                          ? `${((p.subscribers / p.uniqueUsers) * 100).toFixed(0)}%`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Feature / Tool usage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Feature Usage (All Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.toolUsage}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="tool" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} name="Uses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============ SECTION 4: REVENUE & SUBSCRIPTIONS ============ */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Revenue & Subscriptions
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment type pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Payment Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        label={({ name, value }) => `${name}: ${value}`}
                        fontSize={12}
                      >
                        <Cell fill="hsl(211, 90%, 50%)" />
                        <Cell fill="hsl(271, 81%, 56%)" />
                        <Cell fill="hsl(150, 60%, 45%)" />
                      </Pie>
                      <Legend />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue summary cards */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Total Paying Users</p>
                    <p className="text-4xl font-bold text-primary">{data.overview.totalPaying}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.overview.conversionRate}% of {data.overview.totalUsers} total users
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-2xl font-bold">{data.overview.monthlyCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Lifetime</p>
                    <p className="text-2xl font-bold">{data.overview.lifetimeCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">Manual</p>
                    <p className="text-2xl font-bold">{data.overview.manualCount}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Recent subscriptions table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentSubscriptions.map((sub, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{sub.product_name}</TableCell>
                      <TableCell>
                        <Badge variant={sub.payment_type === "lifetime" ? "default" : "secondary"} className="text-xs">
                          {sub.payment_type || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.tier}</TableCell>
                      <TableCell>
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${sub.active ? "bg-green-500" : "bg-red-500"}`} />
                        {sub.active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell className="text-xs">{sub.created_at ? new Date(sub.created_at).toLocaleDateString("en-GB") : "—"}</TableCell>
                      <TableCell className="text-xs">{sub.subscription_end ? new Date(sub.subscription_end).toLocaleDateString("en-GB") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-8">
          A* AI Internal Analytics · Data refreshed on page load
        </p>
      </div>
    </div>
  );
};

// KPI Card component
function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
