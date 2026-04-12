import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, Check, Film, Edit2, Copy } from "lucide-react";

interface ContentScript {
  id: string;
  topic: string;
  exam_board: string;
  subject: string;
  hook_type: string;
  script_text: string;
  hook_line: string | null;
  status: string;
  created_at: string;
}

const HOOK_TYPES = ["question", "myth-bust", "exam-tip"] as const;

const SCRIPT_PROMPT = (topic: string, examBoard: string, subject: string, hookType: string) => `You are a content writer for A* AI, a UK A-Level revision platform. Write a 60-second TikTok/YouTube Shorts script about "${topic}" for ${examBoard} ${subject} students.

TONE: Casual, peer-to-peer, UK student voice. Think "your smart friend explaining it to you." NOT corporate or textbook-y. Use "you" and "we." Keep it punchy and conversational.

HOOK TYPE: ${hookType === "question" ? "Start with a provocative question" : hookType === "myth-bust" ? "Start by busting a common misconception" : "Start with a surprising exam tip"}

STRUCTURE (strict):
[HOOK - 3 seconds] An attention-grabbing opening line that makes someone stop scrolling. Must be specific to the topic, not generic.
[SETUP - 10 seconds] What the concept actually is, in plain English. No jargon without explanation.
[CORE - 30 seconds] The key insight — the thing most students get wrong or don't understand. This is the value. Include a specific example or analogy.
[EXAM TIP - 12 seconds] How this specifically shows up in ${examBoard} ${subject} exams. What the examiner wants to see.
[CTA - 5 seconds] "Link in bio for AI-powered revision that actually knows your mark scheme."

FORMAT your response EXACTLY like this (include the section labels):

[HOOK]
(your hook line here)

[SETUP]
(your setup here)

[CORE]
(your core explanation here)

[EXAM TIP]
(your exam tip here)

[CTA]
Link in bio for AI-powered revision that actually knows your mark scheme.`;

export const AdminContentHooksPage = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<ContentScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // Generate form
  const [genTopic, setGenTopic] = useState("");
  const [genBoard, setGenBoard] = useState("AQA");
  const [genSubject, setGenSubject] = useState("Economics");

  // Bulk topics
  const [bulkTopics, setBulkTopics] = useState("");

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("content_scripts")
      .select("*")
      .order("created_at", { ascending: false });
    setScripts(data || []);
    setLoading(false);
  };

  const generateScript = async (topic: string, board: string, subject: string) => {
    const results: ContentScript[] = [];

    for (const hookType of HOOK_TYPES) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_LOVABLE_API_KEY || ""}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "user", content: SCRIPT_PROMPT(topic, board, subject, hookType) },
            ],
            temperature: 0.8,
            max_tokens: 800,
          }),
        });

        if (!res.ok) throw new Error(`AI request failed: ${res.status}`);

        const data = await res.json();
        const scriptText = data.choices?.[0]?.message?.content || "";
        const hookLine = scriptText.match(/\[HOOK\]\n(.+)/)?.[1] || "";

        const { data: inserted, error } = await (supabase as any)
          .from("content_scripts")
          .insert({
            topic,
            exam_board: board,
            subject,
            hook_type: hookType,
            script_text: scriptText,
            hook_line: hookLine,
            status: "draft",
            created_by: user?.id,
          })
          .select()
          .single();

        if (!error && inserted) results.push(inserted);
      } catch (err) {
        console.error(`Failed to generate ${hookType} script for ${topic}:`, err);
      }
    }

    return results;
  };

  const handleGenerate = async () => {
    if (!genTopic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setGenerating(true);
    const results = await generateScript(genTopic.trim(), genBoard, genSubject);
    toast.success(`Generated ${results.length} scripts for "${genTopic}"`);
    setGenTopic("");
    fetchScripts();
    setGenerating(false);
  };

  const handleBulkGenerate = async () => {
    const topics = bulkTopics.split("\n").map((t) => t.trim()).filter(Boolean);
    if (topics.length === 0) {
      toast.error("Enter at least one topic");
      return;
    }
    setBulkGenerating(true);
    let total = 0;
    for (const topic of topics) {
      const results = await generateScript(topic, genBoard, genSubject);
      total += results.length;
    }
    toast.success(`Generated ${total} scripts across ${topics.length} topics`);
    setBulkTopics("");
    fetchScripts();
    setBulkGenerating(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase as any).from("content_scripts").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const saveEdit = async (id: string) => {
    await (supabase as any).from("content_scripts").update({ script_text: editText, updated_at: new Date().toISOString() }).eq("id", id);
    setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, script_text: editText } : s)));
    setEditingId(null);
    toast.success("Script updated");
  };

  const deleteScript = async (id: string) => {
    await (supabase as any).from("content_scripts").delete().eq("id", id);
    setScripts((prev) => prev.filter((s) => s.id !== id));
    toast.success("Deleted");
  };

  const copyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const filteredScripts = statusFilter === "all" ? scripts : scripts.filter((s) => s.status === statusFilter);

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    approved: "bg-green-100 text-green-700",
    filmed: "bg-blue-100 text-blue-700",
    published: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showNavLinks />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Content Hooks Generator</h1>

        {/* Generate section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Single topic */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generate Scripts (Single Topic)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Topic (e.g. Oligopoly)" value={genTopic} onChange={(e) => setGenTopic(e.target.value)} />
              <div className="flex gap-2">
                <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={genBoard} onChange={(e) => setGenBoard(e.target.value)}>
                  <option>AQA</option><option>Edexcel</option><option>CIE</option><option>OCR</option>
                </select>
                <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={genSubject} onChange={(e) => setGenSubject(e.target.value)}>
                  <option>Economics</option><option>Chemistry</option><option>Physics</option><option>Psychology</option><option>Computer Science</option><option>Mathematics</option>
                </select>
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating 3 scripts...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate 3 Script Variants</>}
              </Button>
            </CardContent>
          </Card>

          {/* Bulk */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bulk Generate (Multiple Topics)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={"One topic per line:\nOligopoly\nFiscal Policy\nMarket Failure"}
                value={bulkTopics}
                onChange={(e) => setBulkTopics(e.target.value)}
              />
              <Button onClick={handleBulkGenerate} disabled={bulkGenerating} variant="outline" className="w-full">
                {bulkGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : "Bulk Generate (3 per topic)"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {["all", "draft", "approved", "filmed", "published"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s} {s !== "all" && `(${scripts.filter((sc) => sc.status === s).length})`}
            </Button>
          ))}
        </div>

        {/* Scripts list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filteredScripts.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No scripts yet. Generate some above.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filteredScripts.map((script) => (
              <Card key={script.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{script.exam_board}</Badge>
                      <Badge variant="secondary" className="text-xs">{script.topic}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{script.hook_type.replace("-", " ")}</Badge>
                      <Badge className={`text-xs capitalize ${statusColor[script.status] || ""}`}>{script.status}</Badge>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => copyScript(script.script_text)} title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(script.id); setEditText(script.script_text); }} title="Edit"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteScript(script.id)} title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>

                  {editingId === script.id ? (
                    <div className="space-y-2">
                      <textarea className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(script.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">{script.script_text}</pre>
                  )}

                  {/* Status actions */}
                  <div className="flex gap-2 mt-3">
                    {script.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(script.id, "approved")} className="text-xs gap-1">
                        <Check className="h-3 w-3" /> Approve
                      </Button>
                    )}
                    {script.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(script.id, "filmed")} className="text-xs gap-1">
                        <Film className="h-3 w-3" /> Mark Filmed
                      </Button>
                    )}
                    {script.status === "filmed" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(script.id, "published")} className="text-xs gap-1">
                        <Check className="h-3 w-3" /> Mark Published
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
