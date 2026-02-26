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
import { Upload, CheckCircle2, Circle, Clock, Plus, Trash2, Send, Loader2, Rocket, ChevronDown, BookOpen, User, ImagePlus, Globe, Bot, PenTool, FileText, Timer, BookMarked, BarChart3, Save, AlertTriangle } from "lucide-react";
import { PastPaperYearCard } from "@/components/PastPaperYearCard";
import { SpecificationUploader } from "@/components/SpecificationUploader";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const EXAM_BOARDS = ["AQA", "OCR", "Edexcel", "CIE", "WJEC", "SQA"];

interface TrainerProject {
  id: string;
  subject: string;
  exam_board: string;
  status: string;
  created_at: string;
  created_by: string | null;
  system_prompt: string | null;
  exam_technique: string | null;
  custom_sections: any;
  product_id: string | null;
  system_prompt_submitted: boolean;
  exam_technique_submitted: boolean;
  staged_specifications: any;
  trainer_image_url: string | null;
  trainer_description: string | null;
  trainer_bio_submitted: boolean;
  selected_features: string[] | null;
  exam_dates: any[] | null;
  essay_marker_marks: number[] | null;
}

const PAPER_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const WEBSITE_FEATURES = [
  { id: "my_ai", label: "My AI", description: "AI-powered chatbot trained on your subject content", icon: Bot },
  { id: "diagram_generator", label: "Diagram Generator", description: "AI diagram finder for visual question support", icon: BarChart3 },
  { id: "essay_marker", label: "Essay Marker", description: "AI-powered essay marking with detailed feedback", icon: PenTool },
  { id: "past_papers", label: "Past Papers", description: "Searchable past paper archive with mark schemes", icon: FileText },
  { id: "exam_countdown", label: "Exam Countdown", description: "Live countdown timer to upcoming exams", icon: Timer },
  { id: "revision_guide", label: "Revision Guide", description: "AI-generated revision notes by topic", icon: BookMarked },
] as const;

type SectionStatus = "empty" | "in_progress" | "complete";

interface TrainerUpload {
  id: string;
  section_type: string;
  year: string | null;
  file_name: string;
  file_url: string;
  processing_status: string;
  chunks_created: number;
  doc_type?: string | null;
  paper_number?: number | null;
  created_at?: string;
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
  const [projects, setProjects] = useState<TrainerProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState("draft");

  // New Subject dialog
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newExamBoard, setNewExamBoard] = useState("");

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

  // Spec status from SpecificationUploader + initial DB check
  const [specComplete, setSpecComplete] = useState(false);
  const [specStatusFromUploader, setSpecStatusFromUploader] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [stagedSpecData, setStagedSpecData] = useState<string[] | null>(null);

  // Submit states for text sections
  const [systemPromptSubmitted, setSystemPromptSubmitted] = useState(false);
  const [examTechniqueSubmitted, setExamTechniqueSubmitted] = useState(false);

  // Meet the Brain
  const [trainerImageUrl, setTrainerImageUrl] = useState<string | null>(null);
  const [trainerDescription, setTrainerDescription] = useState("");
  const [trainerBioSubmitted, setTrainerBioSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const trainerImageInputRef = useRef<HTMLInputElement>(null);

  // Website Deployment features
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [examDates, setExamDates] = useState<Array<{ name: string; date: string }>>([]);
  const [essayMarkerMarks, setEssayMarkerMarks] = useState<string>("");

  // Uploads
  const [uploads, setUploads] = useState<TrainerUpload[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  // Per-year submission tracking
  const [submittedYears, setSubmittedYears] = useState<Set<string>>(new Set());

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Deploying
  const [deploying, setDeploying] = useState(false);

  // Save & Deploy workflow
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasSavedChangesSinceDeploy, setHasSavedChangesSinceDeploy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track whether project data has been loaded (prevent overwriting on mount)
  const [projectLoaded, setProjectLoaded] = useState(false);

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

  // Load all projects for this trainer
  useEffect(() => {
    if (!hasAccess || !user) return;
    const loadProjects = async () => {
      const { data, error } = await supabase
        .from("trainer_projects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) { console.error("Failed to load projects:", error); return; }
      const all = (data || []) as unknown as TrainerProject[];
      // Deduplicate by board+subject (keep earliest created)
      const seen = new Map<string, TrainerProject>();
      for (const p of all) {
        const key = `${p.exam_board.toLowerCase()}::${p.subject.toLowerCase()}`;
        if (!seen.has(key)) seen.set(key, p);
      }
      const typed = Array.from(seen.values());
      setProjects(typed);
      // Auto-select first project if none selected
      if (!selectedProjectId && typed.length > 0) {
        setSelectedProjectId(typed[0].id);
      }
    };
    loadProjects();
  }, [hasAccess, user]);

  // Load project data when selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId || !hasAccess || !user) return;
    const existing = projects.find(p => p.id === selectedProjectId);
    if (!existing) return;

    setProjectId(existing.id);
    setCustomSections((existing.custom_sections as unknown as CustomSection[]) || []);
    setProjectStatus(existing.status);

    const spSubmitted = !!existing.system_prompt_submitted;
    const etSubmitted = !!existing.exam_technique_submitted;
    const bioSubmitted = !!existing.trainer_bio_submitted;
    setSystemPromptSubmitted(spSubmitted);
    setExamTechniqueSubmitted(etSubmitted);
    setTrainerBioSubmitted(bioSubmitted);
    setSystemPrompt(existing.system_prompt || "");
    setExamTechnique(existing.exam_technique || "");
    setTrainerImageUrl(existing.trainer_image_url || null);
    setTrainerDescription(existing.trainer_description || "");
    setSelectedFeatures(Array.isArray(existing.selected_features) ? existing.selected_features : []);
    setExamDates(Array.isArray(existing.exam_dates) ? existing.exam_dates : []);
    setEssayMarkerMarks(
      Array.isArray(existing.essay_marker_marks) && existing.essay_marker_marks.length > 0
        ? existing.essay_marker_marks.join(', ')
        : ''
    );

    const savedSpecs = existing.staged_specifications;
    if (savedSpecs && Array.isArray(savedSpecs) && savedSpecs.length > 0) {
      setStagedSpecData(savedSpecs);
      setSpecComplete(true);
    } else if (existing.product_id) {
      // Hydrate specs from document_chunks if not in staged_specifications
      supabase
        .from("document_chunks")
        .select("content")
        .eq("product_id", existing.product_id)
        .contains("metadata", { content_type: "specification" } as any)
        .order("created_at", { ascending: true })
        .limit(2000)
        .then(({ data: specChunks }) => {
          if (specChunks && specChunks.length > 0) {
            const specPoints = specChunks.map(c => c.content);
            setStagedSpecData(specPoints);
            setSpecComplete(true);
          } else {
            setStagedSpecData(null);
            setSpecComplete(false);
          }
        });
    } else {
      setStagedSpecData(null);
      setSpecComplete(false);
    }

    // Hydrate empty text fields from document_chunks if product exists
    if (existing.product_id) {
      const productId = existing.product_id;
      const needsExamTechnique = !existing.exam_technique || existing.exam_technique.trim().length === 0;
      const needsSystemPrompt = !existing.system_prompt || existing.system_prompt.trim().length === 0;

      if (needsExamTechnique || needsSystemPrompt) {
        supabase
          .from("document_chunks")
          .select("content, metadata")
          .eq("product_id", productId)
          .or("metadata->>content_type.eq.exam_technique,metadata->>content_type.eq.system_prompt")
          .order("created_at", { ascending: true })
          .then(({ data: chunks }) => {
            if (!chunks || chunks.length === 0) return;
            const etChunks = chunks.filter(c => (c.metadata as any)?.content_type === "exam_technique");
            const spChunks = chunks.filter(c => (c.metadata as any)?.content_type === "system_prompt");

            if (needsExamTechnique && etChunks.length > 0) {
              const etText = etChunks.map(c => c.content).join("\n\n");
              setExamTechnique(etText);
            }
            if (needsSystemPrompt && spChunks.length > 0) {
              const spText = spChunks.map(c => c.content).join("\n\n");
              setSystemPrompt(spText);
            }
          });
      }
    }

    setProjectLoaded(true);
    setHasUnsavedChanges(false);
    setHasSavedChangesSinceDeploy(false);
    setChatMessages([]);
  }, [selectedProjectId, projects]);

  // Create new project
  const handleCreateProject = async () => {
    if (!user || !newSubjectName.trim() || !newExamBoard.trim()) return;

    // Prevent duplicates: check if board+subject already exists
    const duplicate = projects.find(
      p => p.exam_board.toLowerCase() === newExamBoard.trim().toLowerCase() &&
           p.subject.toLowerCase() === newSubjectName.trim().toLowerCase()
    );
    if (duplicate) {
      toast({ title: "Subject already exists", description: `${duplicate.exam_board} ${duplicate.subject} is already in your list.`, variant: "destructive" });
      setSelectedProjectId(duplicate.id);
      setShowNewSubjectDialog(false);
      setNewSubjectName("");
      setNewExamBoard("");
      return;
    }

    const { data, error } = await supabase
      .from("trainer_projects")
      .insert({
        subject: newSubjectName.trim(),
        exam_board: newExamBoard.trim(),
        created_by: user.id,
      })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Failed to create subject", description: error.message, variant: "destructive" });
      return;
    }
    const newProject = data as unknown as TrainerProject;
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setShowNewSubjectDialog(false);
    setNewSubjectName("");
    setNewExamBoard("");
    toast({ title: "Subject created", description: `${newProject.exam_board} ${newProject.subject}` });
  };

  // Load uploads when project changes
  useEffect(() => {
    if (!projectId) return;
    const loadUploads = async () => {
      const { data } = await supabase
        .from("trainer_uploads")
        .select("*")
        .eq("project_id", projectId);
      const loaded = (data as TrainerUpload[]) || [];
      setUploads(loaded);
      // Initialize submitted years: years where all uploads are done
      const yearGroups = new Map<string, TrainerUpload[]>();
      for (const u of loaded) {
        if (u.section_type === "past_paper" && u.year) {
          const arr = yearGroups.get(u.year) || [];
          arr.push(u);
          yearGroups.set(u.year, arr);
        }
      }
      // Restore explicitly submitted years from localStorage (not auto-detected from processing status)
      const storageKey = `submittedYears_${projectId}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as string[];
          setSubmittedYears(new Set(parsed));
        } else {
          setSubmittedYears(new Set());
        }
      } catch {
        setSubmittedYears(new Set());
      }
    };
    loadUploads();
  }, [projectId]);

  // Mark unsaved whenever content changes
  const markUnsaved = useCallback(() => {
    if (projectLoaded) setHasUnsavedChanges(true);
  }, [projectLoaded]);

  // Track text field changes — skip hydration renders (both sync and async from document_chunks)
  const hydratedRef = useRef(0);
  const hydrationCountRef = useRef(2); // Allow up to 2 hydration cycles (initial + async document_chunks fetch)
  useEffect(() => {
    if (!projectLoaded) return;
    if (hydratedRef.current < hydrationCountRef.current) {
      hydratedRef.current += 1;
      return;
    }
    setHasUnsavedChanges(true);
  }, [systemPrompt, examTechnique, customSections, trainerDescription, selectedFeatures, examDates, essayMarkerMarks]);

  // Reset hydration flag when switching projects
  useEffect(() => {
    hydratedRef.current = 0;
    setHasUnsavedChanges(false);
  }, [selectedProjectId]);

  // Manual Save handler
  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const parsedMarks = essayMarkerMarks
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n > 0);

      const { error } = await supabase
        .from("trainer_projects")
        .update({
          system_prompt: systemPrompt,
          exam_technique: examTechnique,
          custom_sections: customSections as unknown as import("@/integrations/supabase/types").Json,
          trainer_description: trainerDescription,
          trainer_image_url: trainerImageUrl,
          selected_features: selectedFeatures as unknown as import("@/integrations/supabase/types").Json,
          exam_dates: examDates as unknown as import("@/integrations/supabase/types").Json,
          essay_marker_marks: (parsedMarks.length > 0 ? parsedMarks : []) as unknown as import("@/integrations/supabase/types").Json,
          staged_specifications: stagedSpecData as unknown as import("@/integrations/supabase/types").Json,
          system_prompt_submitted: systemPrompt.trim().length >= 10,
          exam_technique_submitted: examTechnique.trim().length >= 10,
          trainer_bio_submitted: trainerDescription.trim().length >= 10,
        })
        .eq("id", projectId);

      if (error) throw error;
      setHasUnsavedChanges(false);
      if (projectStatus === "deployed") setHasSavedChangesSinceDeploy(true);
      toast({ title: "Changes saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload trainer image
  const handleTrainerImageUpload = async (file: File) => {
    if (!projectId) return;
    setUploadingImage(true);
    try {
      const filePath = `${projectId}/trainer_image_${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("trainer-uploads")
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("trainer-uploads")
        .getPublicUrl(filePath);

      // Since bucket is private, store the path and we'll use a signed URL or just show the path
      setTrainerImageUrl(filePath);
      await supabase
        .from("trainer_projects")
        .update({ trainer_image_url: filePath })
        .eq("id", projectId);
      toast({ title: "Image uploaded" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({ title: "Image upload failed", description: message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  // Persist submission states to DB
  const persistSubmissionState = useCallback(async (updates: Record<string, unknown>) => {
    if (!projectId) return;
    const { error } = await supabase
      .from("trainer_projects")
      .update(updates as any)
      .eq("id", projectId);
    if (error) console.error("Failed to persist submission state:", error);
  }, [projectId]);

  const handleSpecDataChange = useCallback((specs: string[] | null) => {
    setStagedSpecData(specs);
    if (projectLoaded) {
      markUnsaved();
    }
  }, [projectLoaded, markUnsaved]);

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

      // Trigger processing asynchronously (don't block UI)
      supabase.functions.invoke("process-training-file", {
        body: {
          upload_id: uploadRecord.id,
          project_id: projectId,
          section_type: sectionType,
          file_url: filePath,
          year: year || null,
        },
      }).then(async ({ error: processErr }) => {
        if (processErr) {
          console.error("Processing error:", processErr);
          await supabase
            .from("trainer_uploads")
            .update({ processing_status: "error" })
            .eq("id", uploadRecord.id);
        }

        const { data: refreshedUploads } = await supabase
          .from("trainer_uploads")
          .select("*")
          .eq("project_id", projectId);
        setUploads((refreshedUploads as TrainerUpload[]) || []);
      }).catch(async (processErr) => {
        console.error("Processing invoke failed:", processErr);
        await supabase
          .from("trainer_uploads")
          .update({ processing_status: "error" })
          .eq("id", uploadRecord.id);
      });

      markUnsaved();
      toast({ title: "Upload complete", description: `${file.name} uploaded. Processing in background.` });

      // Reload uploads immediately so new pending item appears
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

  // Delete an upload record (and its storage file) via edge function
  const handleDeleteUpload = async (uploadId: string, deleteChunks = false) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) return;
    try {
      const { error } = await supabase.functions.invoke("delete-training-upload", {
        body: { upload_id: uploadId, delete_chunks: deleteChunks },
      });
      if (error) throw error;
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      markUnsaved();
      toast({ title: "File removed", description: upload.file_name });
    } catch (err) {
      console.error("Delete failed:", err);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  // Get all uploads for a given year
  const getUploadsForYear = (year: string) => {
    return uploads.filter(u => u.section_type === "past_paper" && u.year === year);
  };

  // Year status for progress sidebar — only "complete" if user pressed Submit
  const getYearStatus = (year: string): SectionStatus => {
    const yearUploads = getUploadsForYear(year);
    if (yearUploads.length === 0) return "empty";
    if (submittedYears.has(year)) return "complete";
    return "in_progress";
  };

  // Chat with mock chatbot (uses streaming like the main RAGChat)
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const currentInput = chatInput;
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

      if (!productId) {
        setChatMessages(prev => [...prev, { role: "assistant", content: "No deployed product found. Please deploy first to test the chatbot with training data." }]);
        setChatLoading(false);
        return;
      }

      const CHAT_URL = `https://xoipyycgycmpflfnrlty.supabase.co/functions/v1/rag-chat`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: currentInput,
          product_id: productId,
          history: chatMessages.map(m => ({ role: m.role, content: m.content })),
          tier: "deluxe",
          user_id: user?.id,
          trainer_test: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            // Skip metadata events
            if (parsed.sources_searched) continue;
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              const captured = fullContent;
              setChatMessages(prev => {
                const lastIdx = prev.length - 1;
                if (lastIdx >= 0 && prev[lastIdx]?.role === "assistant") {
                  return prev.map((m, i) => i === lastIdx ? { ...m, content: captured } : m);
                }
                return prev;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (!fullContent) {
        setChatMessages(prev => {
          const lastIdx = prev.length - 1;
          if (lastIdx >= 0 && prev[lastIdx]?.role === "assistant" && !prev[lastIdx].content) {
            return prev.map((m, i) => i === lastIdx ? { ...m, content: "No response received." } : m);
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to get response. Make sure training data has been deployed." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Unified Deploy handler
  const handleDeploy = async () => {
    if (!projectId) return;
    setDeploying(true);
    try {
      // Auto-save first if there are unsaved changes
      if (hasUnsavedChanges) {
        await handleSave();
      }

      const submittedCustomSections = customSections.filter(s => s.content.length > 20);
      const isFirstDeploy = projectStatus !== "deployed";

      const { data, error } = await supabase.functions.invoke("deploy-subject", {
        body: {
          project_id: projectId,
          staged_specifications: stagedSpecData || undefined,
          staged_system_prompt: systemPrompt.trim().length >= 10 ? systemPrompt : undefined,
          staged_exam_technique: examTechnique.trim().length >= 10 ? examTechnique : undefined,
          staged_custom_sections: submittedCustomSections.length > 0 ? submittedCustomSections : undefined,
          // For first deploy, also activate on website
          activate_website: isFirstDeploy ? true : undefined,
        },
      });
      if (error) throw error;
      setProjectStatus("deployed");
      setHasSavedChangesSinceDeploy(false);
      setStagedSpecData(null);
      setSpecComplete(true);
      toast({ title: isFirstDeploy ? "Deployed to website! 🎉" : "Changes deployed!", description: data.message || "Subject deployed successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deployment failed";
      toast({ title: "Deploy failed", description: message, variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  // Remove from Website — deactivates the product so it no longer appears on the site
  const [removingFromWebsite, setRemovingFromWebsite] = useState(false);
  const handleRemoveFromWebsite = async () => {
    if (!projectId) return;
    setRemovingFromWebsite(true);
    try {
      const { data: proj } = await supabase
        .from("trainer_projects")
        .select("product_id, exam_board, subject")
        .eq("id", projectId)
        .single();

      if (!proj?.product_id) {
        toast({ title: "Nothing to remove", description: "This subject hasn't been deployed to the website yet." });
        setRemovingFromWebsite(false);
        return;
      }

      const { error } = await supabase.functions.invoke("deploy-subject", {
        body: { project_id: projectId, deactivate_website: true },
      });
      if (error) throw error;

      toast({ title: "Removed from website", description: `${proj.exam_board} ${proj.subject} is no longer visible to students.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove from website";
      toast({ title: "Remove failed", description: message, variant: "destructive" });
    } finally {
      setRemovingFromWebsite(false);
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

  // Get latest upload status for a section
  const getUploadForSection = (sectionType: string, year?: string) => {
    const candidates = uploads.filter(u => u.section_type === sectionType && (year ? u.year === year : true));
    if (candidates.length === 0) return undefined;
    return candidates.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })[0];
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

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const currentLabel = currentProject ? `${currentProject.exam_board} ${currentProject.subject}` : "Select Subject";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Build Portal</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{currentLabel}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[260px]">
                {projects.map(proj => (
                  <DropdownMenuItem
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className="flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="font-medium">{proj.exam_board} {proj.subject}</span>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${
                      proj.status === "deployed" ? "bg-green-500" : "bg-muted-foreground/40"
                    }`} />
                  </DropdownMenuItem>
                ))}
                {projects.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => setShowNewSubjectDialog(true)}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Create New Subject</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              variant={hasUnsavedChanges ? "default" : "outline"}
              className={!hasUnsavedChanges ? "opacity-60" : ""}
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</>
              ) : hasUnsavedChanges ? (
                <><Save className="h-4 w-4 mr-1" /> Save Changes</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-1" /> Changes Saved</>
              )}
            </Button>
            <Badge variant={projectStatus === "deployed" ? "default" : "secondary"} className={
              projectStatus === "deployed" ? "bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/20" : ""
            }>
              {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {/* New Subject Dialog */}
      <Dialog open={showNewSubjectDialog} onOpenChange={setShowNewSubjectDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>Add a new subject to train your AI tutor on.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                placeholder="e.g. Biology, Mathematics, History..."
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Exam Board</Label>
              <Select value={newExamBoard} onValueChange={setNewExamBoard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam board..." />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_BOARDS.map(board => (
                    <SelectItem key={board} value={board}>{board}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSubjectDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!newSubjectName.trim() || !newExamBoard}>
              Create Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty state — no projects yet */}
      {projects.length === 0 && (
        <div className="max-w-md mx-auto mt-24 text-center space-y-4">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">No subjects yet</h2>
          <p className="text-sm text-muted-foreground">Create your first subject to start training your AI tutor.</p>
          <Button onClick={() => setShowNewSubjectDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Subject
          </Button>
        </div>
      )}

      {!selectedProjectId && projects.length > 0 && (
        <div className="max-w-md mx-auto mt-24 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Select a subject from the dropdown above to get started.</p>
        </div>
      )}

      {/* Main Content */}
      {selectedProjectId && (
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

          {/* Unsaved Changes Banner */}
          {hasUnsavedChanges && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                <p className="text-sm text-orange-600 dark:text-orange-400">You have unsaved changes</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                Save Now
              </Button>
            </div>
          )}

          {/* Meet the Brain */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Meet the Brain
                </CardTitle>
                {trainerDescription.trim().length >= 10
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : (trainerDescription.length > 0 || trainerImageUrl)
                  ? <Clock className="h-5 w-5 text-orange-500" />
                  : <Circle className="h-5 w-5 text-muted-foreground" />
                }
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    ref={trainerImageInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleTrainerImageUpload(file);
                    }}
                  />
                  <div
                    className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden shrink-0"
                    onClick={() => trainerImageInputRef.current?.click()}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : trainerImageUrl ? (
                      <TrainerImage filePath={trainerImageUrl} />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Your photo</p>
                    <p className="text-xs">Click to upload a profile image</p>
                  </div>
                </div>
                <Textarea
                  value={trainerDescription}
                  onChange={e => setTrainerDescription(e.target.value)}
                  placeholder="Tell students about yourself... Your qualifications, teaching experience, what makes you passionate about this subject."
                  className="min-h-[120px] text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Prompt</CardTitle>
                {systemPrompt.trim().length >= 10
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : systemPrompt.length > 0
                  ? <Clock className="h-5 w-5 text-orange-500" />
                  : <Circle className="h-5 w-5 text-muted-foreground" />
                }
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Enter the AI tutor's system prompt... Define its personality, teaching style, and subject expertise."
                className="min-h-[200px] text-sm"
              />
            </CardContent>
          </Card>

          {/* Exam Technique */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Exam Technique</CardTitle>
                {examTechnique.trim().length >= 10
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : examTechnique.length > 0
                  ? <Clock className="h-5 w-5 text-orange-500" />
                  : <Circle className="h-5 w-5 text-muted-foreground" />
                }
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
          <SpecificationUploader
            key={selectedProjectId}
            initialComplete={specComplete}
            initialStagedSpecs={stagedSpecData}
            isDeployed={projectStatus === "deployed"}
            hasChangesSinceDeploy={hasSavedChangesSinceDeploy}
            onStatusChange={setSpecStatusFromUploader}
            onSpecDataChange={handleSpecDataChange}
            onReplaceDeployed={async () => {
              if (!projectId) return;
              // Delete deployed spec chunks via edge function (needs service role)
              const { error } = await supabase.functions.invoke("deploy-subject", {
                body: {
                  project_id: projectId,
                  delete_specifications_only: true,
                },
              });
              if (error) throw error;
              setSpecComplete(false);
              setStagedSpecData(null);
            }}
          />

          {/* Past Papers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Past Papers</CardTitle>
              <p className="text-xs text-muted-foreground">Upload QPs and Mark Schemes — they'll be auto-paired by paper number. Submit each year when ready.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {PAPER_YEARS.map(year => {
                const yearUploads = getUploadsForYear(year);
                return (
                  <PastPaperYearCard
                    key={year}
                    year={year}
                    uploads={yearUploads}
                    onUploadFiles={handleMultiFileUpload}
                    onDeleteUpload={handleDeleteUpload}
                    uploading={!!uploading?.startsWith("past_paper" + year)}
                    initialSubmitted={submittedYears.has(year)}
                    productId={projects.find(p => p.id === selectedProjectId)?.product_id || null}
                    onSubmitYear={(y) => {
                      setSubmittedYears(prev => {
                        const next = new Set(prev).add(y);
                        try { localStorage.setItem(`submittedYears_${projectId}`, JSON.stringify(Array.from(next))); } catch {}
                        return next;
                      });
                      markUnsaved();
                    }}
                    onEditYear={(y) => {
                      setSubmittedYears(prev => {
                        const next = new Set(prev);
                        next.delete(y);
                        try { localStorage.setItem(`submittedYears_${projectId}`, JSON.stringify(Array.from(next))); } catch {}
                        return next;
                      });
                      markUnsaved();
                    }}
                  />
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
          {(() => {
            const isFirstDeploy = projectStatus !== "deployed";
            const deployDisabled = projectStatus === "deployed" && !hasSavedChangesSinceDeploy && !hasUnsavedChanges;
            const deployLabel = isFirstDeploy
              ? "Deploy to Website"
              : deployDisabled
              ? "Model Deployed"
              : "Deploy Changes";
            return (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" className="w-full" disabled={deployDisabled || deploying} variant={deployDisabled ? "outline" : "default"}>
                    {deploying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : deployDisabled ? <CheckCircle2 className="h-5 w-5 mr-2" /> : <Rocket className="h-5 w-5 mr-2" />}
                    {deployLabel}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isFirstDeploy ? `Deploy ${currentLabel} to the website?` : `Re-Deploy ${currentLabel}?`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isFirstDeploy
                        ? <>This will make <strong>{currentLabel}</strong> live on the website, creating chatbot pages, adding it to the subject selection, and enabling your chosen features.</>
                        : "This will update the live product with your latest saved changes. Existing training data will be replaced — no duplicates will be created."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeploy}>
                      {isFirstDeploy ? "Yes, go live!" : "Re-Deploy"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          })()}

          {/* Website Deployment — Feature Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Website Deployment</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Select which features you'd like enabled on your subject's student-facing page. Click a feature to toggle it on or off.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WEBSITE_FEATURES.map(feature => {
                  const isSelected = selectedFeatures.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => {
                        const next = isSelected
                          ? selectedFeatures.filter(f => f !== feature.id)
                          : [...selectedFeatures, feature.id];
                        setSelectedFeatures(next);
                        // Persist immediately
                        if (projectId) {
                          supabase
                            .from("trainer_projects")
                            .update({ selected_features: next as unknown as import("@/integrations/supabase/types").Json })
                            .eq("id", projectId)
                            .then(({ error }) => { if (error) console.error("Failed to save features:", error); });
                        }
                      }}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                        isSelected
                          ? "border-green-500 bg-green-500/10"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${
                        isSelected ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? "text-green-600 dark:text-green-400" : ""}`}>
                          {feature.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 ml-auto mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedFeatures.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">{selectedFeatures.length} feature{selectedFeatures.length !== 1 ? "s" : ""} selected</p>
              )}

              {/* Essay Marker mark options */}
              {selectedFeatures.includes("essay_marker") && (
                <div className="mt-4 p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Essay Marker — Mark Options</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter the mark values students can choose from (comma-separated). e.g. 3, 4, 6, 15</p>
                  <Input
                    value={essayMarkerMarks}
                    onChange={(e) => setEssayMarkerMarks(e.target.value)}
                    placeholder="e.g. 3, 4, 6, 15"
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exam Dates for Countdown */}
          {selectedFeatures.includes("exam_countdown") && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Exam Dates</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">Add your exam dates so students can see a countdown timer.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {examDates.map((ed, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Paper name (e.g. Paper 1)"
                      value={ed.name}
                      onChange={(e) => {
                        const next = [...examDates];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setExamDates(next);
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={ed.date}
                      onChange={(e) => {
                        const next = [...examDates];
                        next[idx] = { ...next[idx], date: e.target.value };
                        setExamDates(next);
                      }}
                      className="w-40"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const next = examDates.filter((_, i) => i !== idx);
                        setExamDates(next);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setExamDates([...examDates, { name: "", date: "" }]);
                  }}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Exam Date
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Remove from Website Button */}
          {projectStatus === "deployed" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive" className="w-full" disabled={removingFromWebsite}>
                  {removingFromWebsite ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Globe className="h-5 w-5 mr-2" />}
                  Remove from Website
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {currentLabel} from the website?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will take <strong>{currentLabel}</strong> offline. Students will no longer be able to access the free or premium chatbot pages. Your training data will remain intact and you can re-deploy at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveFromWebsite} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, remove it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Right: Info Panel */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ProgressRow label="Meet the Brain" status={trainerDescription.trim().length >= 10 ? "complete" : (trainerDescription.length > 0 || trainerImageUrl) ? "in_progress" : "empty"} />
                <ProgressRow label="System Prompt" status={systemPrompt.trim().length >= 10 ? "complete" : systemPrompt.length > 0 ? "in_progress" : "empty"} />
                <ProgressRow label="Exam Technique" status={examTechnique.trim().length >= 10 ? "complete" : examTechnique.length > 0 ? "in_progress" : "empty"} />
                <ProgressRow label="Specification" status={
                  specStatusFromUploader === "success" || specComplete ? "complete" :
                  specStatusFromUploader === "processing" ? "in_progress" : "empty"
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
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Uploads: {uploads.length}</p>
                  <p>Processed: {uploads.filter(u => u.processing_status === "done").length}</p>
                  <p>Chunks: {uploads.reduce((sum, u) => sum + (u.chunks_created || 0), 0)}</p>
                </div>
                <TrainingProgressBar
                  trainerBioStatus={trainerDescription.trim().length >= 10 ? "complete" : (trainerDescription.length > 0 || trainerImageUrl) ? "in_progress" : "empty"}
                  systemPromptStatus={systemPrompt.trim().length >= 10 ? "complete" : systemPrompt.length > 0 ? "in_progress" : "empty"}
                  examTechniqueStatus={examTechnique.trim().length >= 10 ? "complete" : examTechnique.length > 0 ? "in_progress" : "empty"}
                  specStatus={specStatusFromUploader === "success" || specComplete ? "complete" : specStatusFromUploader === "processing" ? "in_progress" : "empty"}
                  paperYears={PAPER_YEARS}
                  getYearStatus={getYearStatus}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function TrainingProgressBar({
  trainerBioStatus,
  systemPromptStatus,
  examTechniqueStatus,
  specStatus,
  paperYears,
  getYearStatus,
}: {
  trainerBioStatus: SectionStatus;
  systemPromptStatus: SectionStatus;
  examTechniqueStatus: SectionStatus;
  specStatus: SectionStatus;
  paperYears: string[];
  getYearStatus: (year: string) => SectionStatus;
}) {
  const sections: { label: string; status: SectionStatus }[] = [
    { label: "Meet the Brain", status: trainerBioStatus },
    { label: "System Prompt", status: systemPromptStatus },
    { label: "Exam Technique", status: examTechniqueStatus },
    { label: "Specification", status: specStatus },
    ...paperYears.map(y => ({ label: y, status: getYearStatus(y) })),
  ];

  const total = sections.length;
  const complete = sections.filter(s => s.status === "complete").length;
  const inProgress = sections.filter(s => s.status === "in_progress").length;
  const pct = Math.round((complete / total) * 100);

  return (
    <div className="space-y-1.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{pct}% trained</span>
        <span className="text-xs text-muted-foreground">{complete}/{total} sections</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {inProgress > 0 && (
        <p className="text-xs text-orange-500">{inProgress} section{inProgress > 1 ? "s" : ""} in progress</p>
      )}
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
    const canReplace = true;
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
            <Button size="sm" variant="outline" className="text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="h-3 w-3 mr-1" /> {existingUpload.processing_status === "processing" ? "Replace now" : "Replace"}
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

function TrainerImage({ filePath }: { filePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from("trainer-uploads")
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) setUrl(data.signedUrl);
    };
    getUrl();
  }, [filePath]);

  if (!url) return <div className="w-full h-full bg-muted" />;
  return <img src={url} alt="Trainer" className="w-full h-full object-cover" />;
}
