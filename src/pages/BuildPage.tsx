import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Circle, Clock, Plus, Trash2, Send, Loader2, Rocket } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Available subject/board combos (add more later)
const SUBJECT_OPTIONS = [
  { value: "AQA-Biology", label: "AQA Biology", subject: "Biology", board: "AQA" },
  { value: "OCR-Maths", label: "OCR Maths", subject: "Maths", board: "OCR" },
];

const PAPER_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

type SectionStatus = "empty" | "in_progress" | "complete";

interface TrainerUpload {
  id: string;
  section_type: string;
  year: string | null;
  file_name: string;
  processing_status: string;
  chunks_created: number;
  doc_type?: string | null;
  paper_number?: number | null;
}

interface CustomSection {
  name: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function StatusIndicator({ status, onClick }: { status: SectionStatus; onClick?: () => void }) {
  const statusMap = {
    empty: { icon: <Circle className="h-5 w-5 text-muted-foreground" />, label: "Empty" },
    in_progress: { icon: <Clock className="h-5 w-5 text-orange-500" />, label: "In Progress" },
    complete: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: "Complete" },
  };
  const { icon, label } = statusMap[status];
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity" title={`Click to change: ${label}`}>
      {icon}
    </button>
  );
}

function cycleStatus(s: SectionStatus): SectionStatus {
  if (s === "empty") return "in_progress";
  if (s === "in_progress") return "complete";
  return "empty";
}

export function BuildPage() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECT_OPTIONS[0].value);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState("draft");

  // Content fields
  const [systemPrompt, setSystemPrompt] = useState("");
  const [examTechnique, setExamTechnique] = useState("");
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);

  // Section statuses
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({
    system_prompt: "empty",
    exam_technique: "empty",
    specification: "empty",
  });

  // Uploads
  const [uploads, setUploads] = useState<TrainerUpload[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Deploying
  const [deploying, setDeploying] = useState(false);

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check role access
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setHasAccess(false); return; }

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const roles = (data || []).map((r: { role: string }) => r.role);
      setHasAccess(roles.includes("trainer") || roles.includes("admin"));
    };
    checkRole();
  }, [user, authLoading]);

  // Load or create project when subject changes
  useEffect(() => {
    if (!hasAccess || !user) return;
    const opt = SUBJECT_OPTIONS.find(o => o.value === selectedSubject);
    if (!opt) return;

    const loadProject = async () => {
      // Try to find existing project
      const { data: existing } = await supabase
        .from("trainer_projects")
        .select("*")
        .eq("subject", opt.subject)
        .eq("exam_board", opt.board)
        .limit(1)
        .maybeSingle();

      if (existing) {
        setProjectId(existing.id);
        setSystemPrompt(existing.system_prompt || "");
        setExamTechnique(existing.exam_technique || "");
        setCustomSections((existing.custom_sections as unknown as CustomSection[]) || []);
        setProjectStatus(existing.status);
      } else {
        // Create new project
        const { data: newProj, error } = await supabase
          .from("trainer_projects")
          .insert({
            subject: opt.subject,
            exam_board: opt.board,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (newProj) {
          setProjectId(newProj.id);
          setSystemPrompt("");
          setExamTechnique("");
          setCustomSections([]);
          setProjectStatus("draft");
        }
        if (error) console.error("Failed to create project:", error);
      }
    };
    loadProject();
  }, [hasAccess, user, selectedSubject]);

  // Load uploads when project changes
  useEffect(() => {
    if (!projectId) return;
    const loadUploads = async () => {
      const { data } = await supabase
        .from("trainer_uploads")
        .select("*")
        .eq("project_id", projectId);
      setUploads((data as TrainerUpload[]) || []);
    };
    loadUploads();
  }, [projectId]);

  // Auto-save text fields
  const autoSave = useCallback(() => {
    if (!projectId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("trainer_projects")
        .update({
          system_prompt: systemPrompt,
          exam_technique: examTechnique,
          custom_sections: customSections as unknown as import("@/integrations/supabase/types").Json,
        })
        .eq("id", projectId);
      if (error) console.error("Auto-save failed:", error);
    }, 2000);
  }, [projectId, systemPrompt, examTechnique, customSections]);

  useEffect(() => { autoSave(); }, [systemPrompt, examTechnique, customSections, autoSave]);

  // File upload handler (supports multiple files)
  const handleFileUpload = async (file: File, sectionType: string, year?: string) => {
    if (!projectId) return;
    setUploading(sectionType + (year || "") + file.name);

    try {
      const filePath = `${projectId}/${sectionType}${year ? `_${year}` : ''}_${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("trainer-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: uploadRecord, error: recErr } = await supabase
        .from("trainer_uploads")
        .insert({
          project_id: projectId,
          section_type: sectionType,
          year: year || null,
          file_name: file.name,
          file_url: filePath,
          processing_status: "pending",
        })
        .select("id")
        .single();

      if (recErr) throw recErr;

      // Trigger processing
      const { error: processErr } = await supabase.functions.invoke("process-training-file", {
        body: {
          upload_id: uploadRecord.id,
          project_id: projectId,
          section_type: sectionType,
          file_url: filePath,
          year: year || null,
        },
      });

      if (processErr) {
        console.error("Processing error:", processErr);
        toast({ title: "Processing started", description: "File uploaded. Processing may take a moment.", variant: "default" });
      } else {
        toast({ title: "File processed", description: `${file.name} has been processed successfully.` });
      }

      // Reload uploads
      const { data: updatedUploads } = await supabase
        .from("trainer_uploads")
        .select("*")
        .eq("project_id", projectId);
      setUploads((updatedUploads as TrainerUpload[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleMultiFileUpload = async (files: FileList, year: string) => {
    for (const file of Array.from(files)) {
      await handleFileUpload(file, "past_paper", year);
    }
  };

  // Get all uploads for a given year
  const getUploadsForYear = (year: string) => {
    return uploads.filter(u => u.section_type === "past_paper" && u.year === year);
  };

  // Year status for progress sidebar
  const getYearStatus = (year: string): SectionStatus => {
    const yearUploads = getUploadsForYear(year);
    if (yearUploads.length === 0) return "empty";
    const hasMerged = yearUploads.some(u => u.processing_status === "done" && u.doc_type);
    // Check if any QP+MS pair both done for same paper_number
    const doneUploads = yearUploads.filter(u => u.processing_status === "done" && u.doc_type && u.paper_number);
    const paperNumbers = [...new Set(doneUploads.map(u => u.paper_number))];
    const hasCompletePair = paperNumbers.some(pn => {
      const hasQP = doneUploads.some(u => u.paper_number === pn && u.doc_type === "qp");
      const hasMS = doneUploads.some(u => u.paper_number === pn && u.doc_type === "ms");
      return hasQP && hasMS;
    });
    if (hasCompletePair) return "complete";
    return "in_progress";
  };

  // Chat with mock chatbot
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      // Get the project's product_id for RAG context
      let productId: string | null = null;
      if (projectId) {
        const { data } = await supabase
          .from("trainer_projects")
          .select("product_id")
          .eq("id", projectId)
          .single();
        productId = data?.product_id || null;
      }

      const { data, error } = await supabase.functions.invoke("rag-chat", {
        body: {
          message: chatInput,
          product_id: productId,
          history: chatMessages.map(m => ({ role: m.role, content: m.content })),
          tier: "deluxe",
          user_id: user?.id,
          system_prompt_override: systemPrompt || undefined,
        },
      });

      if (error) throw error;
      const reply = data?.reply || data?.response || "No response received.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to get response. Make sure training data has been uploaded." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Deploy
  const handleDeploy = async () => {
    if (!projectId) return;
    setDeploying(true);
    try {
      const { data, error } = await supabase.functions.invoke("deploy-subject", {
        body: { project_id: projectId },
      });
      if (error) throw error;
      setProjectStatus("deployed");
      toast({ title: "Deployed!", description: data.message || "Subject deployed successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deployment failed";
      toast({ title: "Deploy failed", description: message, variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  // Add custom section
  const addCustomSection = () => {
    setCustomSections(prev => [...prev, { name: "", content: "" }]);
  };

  const updateCustomSection = (index: number, field: "name" | "content", value: string) => {
    setCustomSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeCustomSection = (index: number) => {
    setCustomSections(prev => prev.filter((_, i) => i !== index));
  };

  // Get upload status for a section
  const getUploadForSection = (sectionType: string, year?: string) => {
    return uploads.find(u => u.section_type === sectionType && (year ? u.year === year : true));
  };

  // Access denied / loading states
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
              {user ? "You don't have trainer access. Contact the team to get set up." : "Please log in to access the Build Portal."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentOption = SUBJECT_OPTIONS.find(o => o.value === selectedSubject);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Build Portal</h1>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              projectStatus === "deployed" ? "bg-green-500/20 text-green-600" :
              projectStatus === "review" ? "bg-orange-500/20 text-orange-600" :
              "bg-muted text-muted-foreground"
            }`}>
              {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Content Sections */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mock Chatbot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test Chatbot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg h-[300px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                      Ask a question to test your model...
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="border-t border-border p-2 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Test your model..."
                    onKeyDown={e => e.key === "Enter" && sendChatMessage()}
                    className="text-sm"
                  />
                  <Button size="icon" onClick={sendChatMessage} disabled={chatLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Prompt</CardTitle>
                <StatusIndicator
                  status={sectionStatuses.system_prompt}
                  onClick={() => setSectionStatuses(prev => ({ ...prev, system_prompt: cycleStatus(prev.system_prompt) }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Enter the AI tutor's system prompt... Define its personality, teaching style, and subject expertise."
                className="min-h-[200px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">Auto-saves every 2 seconds</p>
            </CardContent>
          </Card>

          {/* Exam Technique */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Exam Technique</CardTitle>
                <StatusIndicator
                  status={sectionStatuses.exam_technique}
                  onClick={() => setSectionStatuses(prev => ({ ...prev, exam_technique: cycleStatus(prev.exam_technique) }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={examTechnique}
                onChange={e => setExamTechnique(e.target.value)}
                placeholder="Enter exam technique guidance... How to structure answers, common pitfalls, mark scheme tips."
                className="min-h-[150px] text-sm"
              />
            </CardContent>
          </Card>

          {/* Specification */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Specification</CardTitle>
                <StatusIndicator
                  status={sectionStatuses.specification}
                  onClick={() => setSectionStatuses(prev => ({ ...prev, specification: cycleStatus(prev.specification) }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                sectionType="specification"
                existingUpload={getUploadForSection("specification")}
                onUpload={(file) => handleFileUpload(file, "specification")}
                uploading={uploading === "specification"}
              />
            </CardContent>
          </Card>

          {/* Past Papers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Past Papers</CardTitle>
              <p className="text-xs text-muted-foreground">Upload QPs and Mark Schemes — they'll be auto-paired by paper number</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {PAPER_YEARS.map(year => {
                const yearUploads = getUploadsForYear(year);
                return (
                  <div key={year} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{year}</span>
                      <MultiFileUploadButton
                        year={year}
                        onUpload={(files) => handleMultiFileUpload(files, year)}
                        uploading={!!uploading?.startsWith("past_paper" + year)}
                      />
                    </div>
                    {yearUploads.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {yearUploads.map(u => (
                          <UploadChip key={u.id} upload={u} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Custom Sections */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Custom Sections</CardTitle>
                <Button size="sm" variant="outline" onClick={addCustomSection}>
                  <Plus className="h-4 w-4 mr-1" /> Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {customSections.length === 0 && (
                <p className="text-sm text-muted-foreground">No custom sections yet. Add one to include additional training content.</p>
              )}
              {customSections.map((section, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.name}
                      onChange={e => updateCustomSection(i, "name", e.target.value)}
                      placeholder="Section name..."
                      className="text-sm"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeCustomSection(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Textarea
                    value={section.content}
                    onChange={e => updateCustomSection(i, "content", e.target.value)}
                    placeholder="Section content..."
                    className="min-h-[100px] text-sm"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Deploy Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="lg" className="w-full" disabled={projectStatus === "deployed" || deploying}>
                {deploying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Rocket className="h-5 w-5 mr-2" />}
                {projectStatus === "deployed" ? "Already Deployed" : "Deploy Subject"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deploy {currentOption?.label}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will make the subject live and create a new product entry. You'll need to manually add Stripe links and routes afterwards.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeploy}>Deploy</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Right: Info Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ProgressRow label="System Prompt" status={systemPrompt.length > 50 ? "complete" : systemPrompt.length > 0 ? "in_progress" : "empty"} />
                <ProgressRow label="Exam Technique" status={examTechnique.length > 50 ? "complete" : examTechnique.length > 0 ? "in_progress" : "empty"} />
                <ProgressRow label="Specification" status={
                  getUploadForSection("specification")?.processing_status === "done" ? "complete" :
                  getUploadForSection("specification") ? "in_progress" : "empty"
                } />
                {PAPER_YEARS.map(year => (
                  <ProgressRow
                    key={year}
                    label={`Paper ${year}`}
                    status={getYearStatus(year)}
                  />
                ))}
                {customSections.map((s, i) => (
                  <ProgressRow key={i} label={s.name || `Custom ${i + 1}`} status={s.content.length > 20 ? "complete" : s.content.length > 0 ? "in_progress" : "empty"} />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Training Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Uploads: {uploads.length}</p>
                  <p>Processed: {uploads.filter(u => u.processing_status === "done").length}</p>
                  <p>Chunks: {uploads.reduce((sum, u) => sum + (u.chunks_created || 0), 0)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, status }: { label: string; status: SectionStatus }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <StatusIndicator status={status} />
    </div>
  );
}

function FileUploadZone({
  sectionType,
  year,
  existingUpload,
  onUpload,
  uploading,
  compact,
}: {
  sectionType: string;
  year?: string;
  existingUpload?: TrainerUpload;
  onUpload: (file: File) => void;
  uploading: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (existingUpload) {
    const statusColors: Record<string, string> = {
      pending: "text-muted-foreground",
      processing: "text-orange-500",
      done: "text-green-500",
      error: "text-destructive",
    };
    const canReplace = existingUpload.processing_status === "error" || existingUpload.processing_status === "done";
    return (
      <div className={`flex items-center gap-2 ${compact ? '' : 'border border-border rounded-lg p-3'}`}>
        {existingUpload.processing_status === "processing" ? (
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        ) : existingUpload.processing_status === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : existingUpload.processing_status === "error" ? (
          <Circle className="h-4 w-4 text-destructive" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={`text-sm flex-1 ${statusColors[existingUpload.processing_status]}`}>
          {existingUpload.file_name}
          {existingUpload.processing_status === "done" && ` (${existingUpload.chunks_created} chunks)`}
          {existingUpload.processing_status === "processing" && " — Processing..."}
          {existingUpload.processing_status === "error" && " — Error"}
        </span>
        {canReplace && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
            <Button size="sm" variant="outline" className="text-xs" onClick={() => inputRef.current?.click()}>
              <Upload className="h-3 w-3 mr-1" /> Replace
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed border-border rounded-lg ${compact ? 'p-2' : 'p-6'} text-center cursor-pointer hover:border-primary/50 transition-colors`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.json"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      {uploading ? (
        <Loader2 className={`mx-auto ${compact ? 'h-4 w-4' : 'h-6 w-6'} animate-spin text-muted-foreground`} />
      ) : (
        <>
          <Upload className={`mx-auto ${compact ? 'h-4 w-4' : 'h-6 w-6'} text-muted-foreground`} />
          {!compact && <p className="text-sm text-muted-foreground mt-2">Click to upload file</p>}
        </>
      )}
    </div>
  );
}

function MultiFileUploadButton({
  year,
  onUpload,
  uploading,
}: {
  year: string;
  onUpload: (files: FileList) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx"
        multiple
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
            e.target.value = "";
          }
        }}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-xs"
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
        Add files
      </Button>
    </>
  );
}

function UploadChip({ upload }: { upload: TrainerUpload }) {
  const statusIcon = {
    pending: <Clock className="h-3 w-3 text-muted-foreground" />,
    processing: <Loader2 className="h-3 w-3 animate-spin text-orange-500" />,
    done: <CheckCircle2 className="h-3 w-3 text-green-500" />,
    error: <Circle className="h-3 w-3 text-destructive" />,
  }[upload.processing_status] || <Clock className="h-3 w-3 text-muted-foreground" />;

  const label = upload.doc_type && upload.paper_number
    ? `P${upload.paper_number} ${upload.doc_type.toUpperCase()}`
    : upload.file_name.length > 25
    ? upload.file_name.slice(0, 22) + "..."
    : upload.file_name;

  const statusSuffix = upload.processing_status === "done"
    ? ` (${upload.chunks_created})`
    : upload.processing_status === "processing"
    ? " ..."
    : upload.processing_status === "error"
    ? " ✗"
    : "";

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border bg-muted/50">
      {statusIcon}
      <span>{label}{statusSuffix}</span>
    </span>
  );
}
