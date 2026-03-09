import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Star, MessageSquare, Mail, TrendingUp, Users, Crown } from "lucide-react";

interface FeedbackData {
  stats: {
    total: number;
    avgRating: number;
    freeCount: number;
    deluxeCount: number;
    freeAvg: number;
    deluxeAvg: number;
    emailsSent: number;
    withText: number;
  };
  distribution: { rating: number; count: number }[];
  dailyTrend: { date: string; count: number; avgRating: number }[];
  responses: {
    id: string;
    user_id: string;
    email: string;
    rating: number;
    feedback_text: string | null;
    feedback_type: string;
    created_at: string;
  }[];
}

export const FeedbackResultsPage = () => {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `https://xoipyycgycmpflfnrlty.supabase.co/functions/v1/get-feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXB5eWNneWNtcGZsZm5ybHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzkzMjUsImV4cCI6MjA2OTM1NTMyNX0.pU8Ej1aAvGoAQ6CuVZwvcCvWBxSGo61X16cfQxW7_bI",
            },
          }
        );
        const result = await response.json();
        if (response.ok) {
          setData(result);
        } else {
          setError(result?.error || "Failed to load feedback data");
        }
      } catch {
        setError("Network error");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredResponses = data?.responses.filter(r => {
    if (filterType !== "all" && r.feedback_type !== filterType) return false;
    if (filterRating !== "all" && r.rating !== parseInt(filterRating)) return false;
    return true;
  }) || [];

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-10 space-y-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Feedback Results</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const CHART_COLORS = {
    primary: "hsl(271, 81%, 56%)",
    secondary: "hsl(211, 90%, 50%)",
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground tracking-tight font-['DM_Sans']">
          Feedback Results
        </h1>
        <Badge variant="secondary" className="text-xs">
          {data.stats.total} responses
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.stats.avgRating}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.stats.withText}</p>
                <p className="text-xs text-muted-foreground">With Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Mail className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.stats.emailsSent}</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {data.stats.total > 0 ? Math.round((data.stats.withText / data.stats.total) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Comment Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free vs Deluxe comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Free Users</p>
                <p className="text-xl font-bold text-foreground">{data.stats.freeAvg} avg · {data.stats.freeCount} responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Deluxe Users</p>
                <p className="text-xl font-bold text-foreground">{data.stats.deluxeAvg} avg · {data.stats.deluxeCount} responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="rating" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Feedback Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    color: 'hsl(var(--foreground))',
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
                <Line type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ r: 3 }} name="Responses" />
                <Line type="monotone" dataKey="avgRating" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} name="Avg Rating" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Responses</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="min-w-[300px]">Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No feedback responses yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResponses.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-foreground">
                        {r.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.feedback_type === 'deluxe' ? 'default' : 'secondary'}>
                          {r.feedback_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderStars(r.rating)}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {r.feedback_text || <span className="text-muted-foreground italic">No comment</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Showing {filteredResponses.length} of {data.responses.length} responses
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
