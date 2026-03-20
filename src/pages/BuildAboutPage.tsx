import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BuildAboutPage() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setHasAccess(false); return; }
    const checkRole = async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data || []).map((r: { role: string }) => r.role);
      setHasAccess(roles.includes("trainer") || roles.includes("admin"));
    };
    checkRole();
  }, [user, authLoading]);

  if (authLoading || hasAccess === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              {user ? "You don't have trainer access." : "Please log in."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/build")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Build
          </Button>
          <h1 className="text-xl font-bold">Training Portal Guide</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>🎯 The Goal</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>Your mission is to <strong>clone everything you know about getting an A* into the AI</strong>. Think of it as creating a digital copy of your brain — except it's supercharged by the ability to instantly access every past paper, mark scheme, and specification point at rapid speed.</p>
            <p>Fill out the page section by section, deploy it, and your subject goes live on the website.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🧠 The System Prompt — Your Brain</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>The system prompt is the <strong>first thing the AI reads before answering any question</strong>. It shapes how the AI thinks, reasons, and responds to students. This is the most important section.</p>
            <p>Start with the basics — exam board, qualification code, subject overview. Then teach the AI how to handle different types of student questions. Consider as many scenarios as you can:</p>
            <ul>
              <li><strong>"Explain this topic"</strong> → The AI should find the relevant specification point and provide a precise, tailored explanation.</li>
              <li><strong>"Give me exam technique"</strong> → The AI should supply your exam technique guidance for that question type.</li>
              <li><strong>"Find me past paper questions on X"</strong> → The AI should search through all uploaded past papers — Paper 1 for Paper 1 topics, Paper 2 for Paper 2 topics, etc.</li>
            </ul>
            <p>The more detail you provide, the smarter the AI becomes. Think about how <em>you</em> would coach a student, then write that into the prompt.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📝 Custom Sections — Teach It More</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>Beyond the system prompt, you can create <strong>separate sections</strong> to help the AI think more deeply about specific areas — exam technique breakdowns, common mistakes, topic-specific strategies, or anything else you'd normally teach a student.</p>
            <p>You can also enable additional student-facing features (Essay Marker, Diagram Finder, Exam Countdown, etc.). Most features require only a small amount of data entry, and much of it can be done quickly with AI assistance. Many features work automatically once enabled.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📄 Past Papers — Priority Focus</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>Upload past paper PDFs (question papers and mark schemes) and they'll be automatically processed by AI into structured, searchable chunks. Matching QP + MS pairs for the same year and paper number are merged together.</p>
            <p><strong>To get started, prioritise papers from 2024–2020.</strong> You can always add older papers later. The AI will weight recent papers more heavily when students ask for practice questions.</p>
            <p>Processing happens in the background — you'll see status indicators (pending → processing → done).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🔄 Edit → Save → Deploy</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <h3>1. Edit</h3>
            <p>Make changes to any section. An <em>"unsaved changes"</em> banner will appear when your form differs from the database.</p>

            <h3>2. Save</h3>
            <p>Click <strong>Save Changes</strong> to persist your edits. This does <em>not</em> push changes live — students won't see anything different yet.</p>

            <h3>3. Deploy</h3>
            <p>Click <strong>Deploy to Website</strong> to push your saved content live. Deployment embeds your system prompt, exam technique, specification, custom sections, and past paper data into the AI's knowledge base.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Accepted Specification JSON Formats</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>The JSON editor accepts multiple formats:</p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`// Simple array of strings (recommended)
["Point 1", "Point 2", "Point 3"]

// Wrapped in specifications key
{ "specifications": ["Point 1", "Point 2"] }

// Array of objects with content/text fields
[{ "content": "Point 1" }, { "text": "Point 2" }]

// Nested topics (e.g., Edexcel Maths)
[
  { "topic": "Algebra", "subtopics": ["Quadratics", "Inequalities"] },
  { "topic": "Calculus", "children": [{ "content": "Differentiation" }] }
]`}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Troubleshooting</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr><th className="text-left p-2 border-b">Problem</th><th className="text-left p-2 border-b">Solution</th></tr>
              </thead>
              <tbody>
                <tr><td className="p-2 border-b">Changes not live yet</td><td className="p-2 border-b">Make sure you've clicked <strong>Deploy</strong> after saving.</td></tr>
                <tr><td className="p-2 border-b">Spec JSON won't parse</td><td className="p-2 border-b">Use one of the accepted formats above. The editor normalizes most structures automatically.</td></tr>
                <tr><td className="p-2 border-b">Past paper shows "pending"</td><td className="p-2 border-b">Processing happens in the background. Wait a minute and refresh.</td></tr>
                <tr><td className="p-2 border-b">"Unsaved changes" won't go away</td><td className="p-2 border-b">Click Save Changes. The banner compares your form to the database.</td></tr>
                <tr><td className="p-2 border-b">Chatbot doesn't use new data</td><td className="p-2 border-b">Deploy pushes data live. Save alone only stores it for you.</td></tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
