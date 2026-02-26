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
          <CardHeader><CardTitle>How the Training Portal Works</CardTitle></CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
            <p>The Build Portal follows a strict <strong>Edit → Save → Deploy</strong> lifecycle.</p>

            <h3>1. Edit</h3>
            <p>Make changes to any section — System Prompt, Exam Technique, Specification, Meet the Brain, Past Papers, Custom Sections, or Website Deployment settings. An <em>"unsaved changes"</em> banner will appear when your current form differs from the database.</p>

            <h3>2. Save</h3>
            <p>Click <strong>Save Changes</strong> to persist all your edits to the database. This does <em>not</em> push changes live — students won't see anything different yet. Saving simply stores your work so you can return to it later.</p>

            <h3>3. Deploy</h3>
            <p>Click <strong>Deploy to Website</strong> (or <strong>Deploy Changes</strong> for existing subjects) to push your saved content live. Deployment:</p>
            <ul>
              <li>Creates/updates the product entry</li>
              <li>Embeds your System Prompt, Exam Technique, and Specification into the knowledge base</li>
              <li>Processes custom sections into searchable chunks</li>
              <li>Associates past paper training data with the live product</li>
            </ul>

            <h3>File Uploads &amp; PDF Processing</h3>
            <p>When you upload a PDF file (past paper or specification), it is automatically processed by AI:</p>
            <ul>
              <li><strong>Specifications:</strong> Extracted into structured JSON spec points. You can review, edit, and remove individual points before submitting.</li>
              <li><strong>Past Papers:</strong> Classified as QP or MS with paper number detection. Matching QP+MS pairs for the same year/paper are automatically merged into combined chunks.</li>
            </ul>
            <p>Processing happens in the background — you'll see status indicators (pending → processing → done).</p>

            <h3>Accepted Specification JSON Formats</h3>
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

            <h3>Troubleshooting</h3>
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
