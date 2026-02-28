import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Circle, Clock, Plus, Trash2, Send, Loader2, Rocket, ChevronDown, BookOpen, User, ImagePlus, Globe, Bot, PenTool, FileText, Timer, BookMarked, BarChart3, Save, AlertTriangle, HelpCircle } from "lucide-react";
import { normalizeSpecifications } from "@/lib/specNormalization";
import { getLegacyConfig } from "@/lib/legacyLiveConfig";
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
  trainer_name: string | null;
  trainer_status: string | null;
  trainer_achievements: string[] | null;
  trainer_bio_submitted: boolean;
  selected_features: string[] | null;
  exam_dates: any[] | null;
  essay_marker_marks: number[] | null;
  updated_at: string;
  last_deployed_at: string | null;
}

const PAPER_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const WEBSITE_FEATURES = [
  { id: "my_ai", label: "My AI", description: "AI-powered chatbot trained on your subject content", icon: Bot },
  { id: "diagram_generator", label: "Diagram Generator", description: "AI diagram finder for visual question support", icon: BarChart3 },
  { id: "essay_marker", label: "Essay Marker", description: "AI-powered essay marking with detailed feedback", icon: PenTool },
  { id: "past_papers", label: "Past Papers", description: "Searchable past paper archive with mark schemes", icon: FileText },
  { id: "exam_countdown", label: "Exam Countdown", description: "Live countdown timer to upcoming exams", icon: Timer },
  { id: "revision_guide", label: "Revision Guide", description: "AI-generated revision notes by topic", icon: BookMarked },
  { id: "my_mistakes", label: "My Mistakes", description: "Spaced repetition tracker for questions students got wrong", icon: Clock },
] as const;

type SectionStatus = "empty" | "unsaved" | "saved" | "deployed";

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

function StatusIndicator({ status }: { status: SectionStatus }) {
  const statusMap = {
    empty: { icon: <Circle className="h-5 w-5 text-muted-foreground" />, label: "Empty" },
    unsaved: { icon: <Clock className="h-5 w-5 text-red-500" />, label: "Unsaved" },
    saved: { icon: <Clock className="h-5 w-5 text-orange-500" />, label: "Saved" },
    deployed: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: "Deployed" },
  };
  const { icon, label } = statusMap[status];
  return (
    <span className="flex items-center gap-1.5 text-sm" title={label}>
      {icon}
    </span>
  );
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
  const [trainerName, setTrainerName] = useState("");
  const [trainerStatus, setTrainerStatus] = useState("");
  const [trainerAchievements, setTrainerAchievements] = useState<string[]>(["", "", ""]);
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

  // Canonical snapshot for dirty tracking
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const hydrationDoneRef = useRef(false);

  // Compute current form state as a stable string for comparison
  const currentFormSnapshot = useMemo(() => {
    return JSON.stringify({
      systemPrompt, examTechnique, customSections, trainerDescription, trainerImageUrl,
      trainerName, trainerStatus, trainerAchievements,
      selectedFeatures, examDates, essayMarkerMarks, stagedSpecData,
    });
  }, [systemPrompt, examTechnique, customSections, trainerDescription, trainerImageUrl,
      trainerName, trainerStatus, trainerAchievements,
      selectedFeatures, examDates, essayMarkerMarks, stagedSpecData]);

  // savedSnapshotParsed for field-level comparison
  const savedSnapshotParsed = useMemo(() => {
    if (!savedSnapshot) return null;
    try { return JSON.parse(savedSnapshot); } catch { return null; }
  }, [savedSnapshot]);

  // Helper: compute section status based on current vs saved vs deployed
  const getSectionStatus = useCallback((fieldName: string, currentValue: string | any, isEmpty: boolean): SectionStatus => {
    if (isEmpty) return "empty";
    if (!savedSnapshotParsed) return "unsaved";
    const savedValue = savedSnapshotParsed[fieldName];
    const currentStr = typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue);
    const savedStr = typeof savedValue === "string" ? savedValue : JSON.stringify(savedValue);
    if (currentStr !== savedStr) return "unsaved";
    if (projectStatus === "deployed" && !hasSavedChangesSinceDeploy) return "deployed";
    return "saved";
  }, [savedSnapshotParsed, projectStatus, hasSavedChangesSinceDeploy]);

  // Derive hasUnsavedChanges from snapshot comparison
  useEffect(() => {
    if (!hydrationDoneRef.current) return;
    setHasUnsavedChanges(currentFormSnapshot !== savedSnapshot);
  }, [currentFormSnapshot, savedSnapshot]);

  // Load project data when selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId || !hasAccess || !user) return;
    const existing = projects.find(p => p.id === selectedProjectId);
    if (!existing) return;

    // Reset hydration flag — prevent dirty tracking until all async loads finish
    hydrationDoneRef.current = false;
    setHasUnsavedChanges(false);
    // Determine if there are saved changes since last deploy
    if (existing.status === "deployed" && existing.last_deployed_at && existing.updated_at) {
      const deployedAt = new Date(existing.last_deployed_at).getTime();
      const updatedAt = new Date(existing.updated_at).getTime();
      // Use 60s tolerance: the deploy process itself bumps updated_at via save + status update
      setHasSavedChangesSinceDeploy(updatedAt - deployedAt > 60000);
    } else {
      setHasSavedChangesSinceDeploy(false);
    }

    setProjectId(existing.id);
    setProjectStatus(existing.status);
    setChatMessages([]);

    const spSubmitted = !!existing.system_prompt_submitted;
    const etSubmitted = !!existing.exam_technique_submitted;
    const bioSubmitted = !!existing.trainer_bio_submitted;
    setSystemPromptSubmitted(spSubmitted);
    setExamTechniqueSubmitted(etSubmitted);
    setTrainerBioSubmitted(bioSubmitted);

    // Set initial values from trainer_projects, with legacy config fallback
    let initialSystemPrompt = existing.system_prompt || "";
    let initialExamTechnique = existing.exam_technique || "";
    const initialCustomSections = (existing.custom_sections as unknown as CustomSection[]) || [];

    // Legacy config fallback for features/dates/marks/bio/image
    const legacy = getLegacyConfig(existing.exam_board, existing.subject);

    const initialTrainerImageUrl = existing.trainer_image_url || legacy?.trainerImageAsset || null;

    const initialTrainerDescription = existing.trainer_description?.trim() ? existing.trainer_description : (legacy?.trainerDescription || "");

    const initialTrainerName = (existing as any).trainer_name?.trim() ? (existing as any).trainer_name : (legacy?.trainerName || "");
    const initialTrainerStatus = (existing as any).trainer_status?.trim() ? (existing as any).trainer_status : (legacy?.trainerStatus || "");
    const dbAchievements = Array.isArray((existing as any).trainer_achievements) ? (existing as any).trainer_achievements as string[] : [];
    const initialTrainerAchievements = dbAchievements.length > 0 && dbAchievements.some((a: string) => a.trim()) ? dbAchievements : ["", "", ""];

    const dbFeatures = Array.isArray(existing.selected_features) ? existing.selected_features as string[] : [];
    const initialSelectedFeatures = dbFeatures.length > 0 ? dbFeatures : (legacy?.selectedFeatures || []);

    const dbDates = Array.isArray(existing.exam_dates) ? existing.exam_dates as Array<{ name: string; date: string }> : [];
    const initialExamDates = dbDates.length > 0 ? dbDates : (legacy?.examDates || []);

    const dbMarks = Array.isArray(existing.essay_marker_marks) ? existing.essay_marker_marks as number[] : [];
    const initialEssayMarkerMarks = dbMarks.length > 0
      ? dbMarks.join(', ')
      : (legacy?.essayMarkerMarks && legacy.essayMarkerMarks.length > 0 ? legacy.essayMarkerMarks.join(', ') : '');

    setCustomSections(initialCustomSections);
    setTrainerImageUrl(initialTrainerImageUrl);
    setTrainerDescription(initialTrainerDescription);
    setTrainerName(initialTrainerName);
    setTrainerStatus(initialTrainerStatus);
    setTrainerAchievements(initialTrainerAchievements);
    setSelectedFeatures(initialSelectedFeatures);
    setExamDates(initialExamDates);
    setEssayMarkerMarks(initialEssayMarkerMarks);

    // Handle specs with normalization
    const savedSpecs = existing.staged_specifications;
    const normalizedSpecs = normalizeSpecifications(savedSpecs);
    if (normalizedSpecs && normalizedSpecs.length > 0) {
      setStagedSpecData(normalizedSpecs);
      setSpecComplete(true);
    } else {
      setStagedSpecData(null);
      setSpecComplete(false);
    }

    // Set text fields initially — will be overridden by async hydration if empty
    setSystemPrompt(initialSystemPrompt);
    setExamTechnique(initialExamTechnique);

    // Async hydration from document_chunks and products for empty fields
    const hydrateAsync = async () => {
      let hydratedSP = initialSystemPrompt;
      let hydratedET = initialExamTechnique;
      let hydratedSpecs = normalizedSpecs;
      let hydratedCustomSections = initialCustomSections;

      if (existing.product_id) {
        const productId = existing.product_id;
        const needsSP = !hydratedSP.trim();
        const needsET = !hydratedET.trim();
        const needsSpecs = !hydratedSpecs || hydratedSpecs.length === 0;
        const needsCustomSections = hydratedCustomSections.length === 0;

        // Fetch from document_chunks if needed
        if (needsSP || needsET || needsSpecs || needsCustomSections) {
          const contentTypes: string[] = [];
          if (needsSP) contentTypes.push("system_prompt");
          if (needsET) contentTypes.push("exam_technique");
          if (needsSpecs) contentTypes.push("specification");
          if (needsCustomSections) contentTypes.push("custom_section");

          const orFilter = contentTypes.map(ct => `metadata->>content_type.eq.${ct}`).join(",");
          const { data: chunks } = await supabase
            .from("document_chunks")
            .select("content, metadata")
            .eq("product_id", productId)
            .or(orFilter)
            .order("created_at", { ascending: true })
            .limit(2000);

          if (chunks && chunks.length > 0) {
            if (needsSP) {
              const spChunks = chunks.filter(c => (c.metadata as any)?.content_type === "system_prompt");
              if (spChunks.length > 0) hydratedSP = spChunks.map(c => c.content).join("\n\n");
            }
            if (needsET) {
              const etChunks = chunks.filter(c => (c.metadata as any)?.content_type === "exam_technique");
              if (etChunks.length > 0) hydratedET = etChunks.map(c => c.content).join("\n\n");
            }
            if (needsSpecs) {
              const specChunks = chunks.filter(c => (c.metadata as any)?.content_type === "specification");
              if (specChunks.length > 0) {
                hydratedSpecs = specChunks.map(c => c.content);
              }
            }
            if (needsCustomSections) {
              const csChunks = chunks.filter(c => (c.metadata as any)?.content_type === "custom_section");
              if (csChunks.length > 0) {
                // Parse "[Section Name]\nContent" format
                const sections: CustomSection[] = [];
                for (const chunk of csChunks) {
                  const match = chunk.content.match(/^\[([^\]]+)\]\n([\s\S]*)$/);
                  if (match) {
                    sections.push({ name: match[1], content: match[2] });
                  } else {
                    sections.push({ name: "Imported Section", content: chunk.content });
                  }
                }
                hydratedCustomSections = sections;
              }
            }
          }
        }

        // Fallback: system prompt from products table
        if (!hydratedSP.trim()) {
          const { data: product } = await supabase
            .from("products")
            .select("system_prompt_deluxe")
            .eq("id", productId)
            .single();
          if (product?.system_prompt_deluxe) {
            hydratedSP = product.system_prompt_deluxe;
          }
        }
      }

      // Apply all hydrated values
      setSystemPrompt(hydratedSP);
      setExamTechnique(hydratedET);
      if (hydratedSpecs && hydratedSpecs.length > 0) {
        setStagedSpecData(hydratedSpecs);
        setSpecComplete(true);
      }
      if (hydratedCustomSections.length > 0 && initialCustomSections.length === 0) {
        setCustomSections(hydratedCustomSections);
      }

      // Now set the baseline snapshot AFTER all hydration is done
      const snapshot = JSON.stringify({
        systemPrompt: hydratedSP,
        examTechnique: hydratedET,
        customSections: hydratedCustomSections.length > 0 ? hydratedCustomSections : initialCustomSections,
        trainerDescription: initialTrainerDescription,
        trainerImageUrl: initialTrainerImageUrl,
        trainerName: initialTrainerName,
        trainerStatus: initialTrainerStatus,
        trainerAchievements: initialTrainerAchievements,
        selectedFeatures: initialSelectedFeatures,
        examDates: initialExamDates,
        essayMarkerMarks: initialEssayMarkerMarks,
        stagedSpecData: hydratedSpecs && hydratedSpecs.length > 0 ? hydratedSpecs : null,
      });
      setSavedSnapshot(snapshot);
      setProjectLoaded(true);
      // Enable dirty tracking after a tick to let React settle
      requestAnimationFrame(() => {
        hydrationDoneRef.current = true;
      });
    };

    hydrateAsync();
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
      // No more submittedYears tracking needed
    };
    loadUploads();
  }, [projectId]);

  // markUnsaved is now a no-op — dirty state is derived from snapshot comparison
  const markUnsaved = useCallback(() => {}, []);

  // Manual Save handler
  const handleSave = async ({ silent = false }: { silent?: boolean } = {}): Promise<boolean> => {
    if (!projectId) return false;
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
          trainer_name: trainerName,
          trainer_status: trainerStatus,
          trainer_achievements: trainerAchievements as unknown as import("@/integrations/supabase/types").Json,
          selected_features: selectedFeatures as unknown as import("@/integrations/supabase/types").Json,
          exam_dates: examDates as unknown as import("@/integrations/supabase/types").Json,
          essay_marker_marks: (parsedMarks.length > 0 ? parsedMarks : []) as unknown as import("@/integrations/supabase/types").Json,
          staged_specifications: stagedSpecData as unknown as import("@/integrations/supabase/types").Json,
          system_prompt_submitted: systemPrompt.trim().length >= 10,
          exam_technique_submitted: examTechnique.trim().length >= 10,
          trainer_bio_submitted: trainerDescription.trim().length >= 10,
        } as any)
        .eq("id", projectId);

      if (error) throw error;
      // Update the saved snapshot to match current state
      setSavedSnapshot(currentFormSnapshot);
      setHasUnsavedChanges(false);
      if (projectStatus === "deployed") setHasSavedChangesSinceDeploy(true);
      if (!silent) toast({ title: "Changes saved" });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      if (!silent) toast({ title: "Save failed", description: message, variant: "destructive" });
      return false;
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
  }, []);

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

  // Year status for progress sidebar
  const getYearStatus = (year: string): SectionStatus => {
    const yearUploads = getUploadsForYear(year);
    if (yearUploads.length === 0) return "empty";
    // Past papers are always "ready" once uploaded — status depends on deploy state
    if (projectStatus === "deployed" && !hasSavedChangesSinceDeploy) return "deployed";
    return "saved";
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
      // Always save current state before deploy to avoid state drift and stale payloads
      const saveSuccessful = await handleSave({ silent: true });
      if (!saveSuccessful) {
        throw new Error("Could not save changes before deployment. Please try again.");
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
      // last_deployed_at is now set server-side by deploy-subject
      setProjectStatus("deployed");
      setHasSavedChangesSinceDeploy(false);
      setSpecComplete(true);
      // Update saved snapshot to match current state so no false "unsaved changes"
      setSavedSnapshot(currentFormSnapshot);
      setHasUnsavedChanges(false);
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
              variant="ghost"
              className="text-xs text-muted-foreground"
              onClick={() => window.open("/build/about", "_blank")}
            >
              <HelpCircle className="h-4 w-4 mr-1" /> How do I use the training portal?
            </Button>
            <Button
              size="sm"
              onClick={() => { void handleSave(); }}
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
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">You have unsaved changes</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { void handleSave(); }} disabled={isSaving}>
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
                <StatusIndicator status={getSectionStatus("trainerDescription", trainerDescription, !trainerDescription.trim() && !trainerImageUrl)} />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Your name</Label>
                    <Input
                      value={trainerName}
                      onChange={e => setTrainerName(e.target.value)}
                      placeholder="e.g. James"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Current status</Label>
                    <Input
                      value={trainerStatus}
                      onChange={e => setTrainerStatus(e.target.value)}
                      placeholder="e.g. LSE Student"
                      className="text-sm"
                    />
                  </div>
                </div>
                <Textarea
                  value={trainerDescription}
                  onChange={e => setTrainerDescription(e.target.value)}
                  placeholder="Tell students about yourself... Your qualifications, teaching experience, what makes you passionate about this subject."
                  className="min-h-[120px] text-sm"
                />
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Top 3 achievements (shown as badges)</Label>
                  <div className="space-y-2">
                    {trainerAchievements.map((achievement, i) => (
                      <Input
                        key={i}
                        value={achievement}
                        onChange={e => {
                          const updated = [...trainerAchievements];
                          updated[i] = e.target.value;
                          setTrainerAchievements(updated);
                        }}
                        placeholder={i === 0 ? "e.g. A* in Economics (90%)" : i === 1 ? "e.g. Straight 9s at GCSE" : "e.g. A*A*A at A-Level"}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Prompt</CardTitle>
                <StatusIndicator status={getSectionStatus("systemPrompt", systemPrompt, !systemPrompt.trim())} />
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
                <StatusIndicator status={getSectionStatus("examTechnique", examTechnique, !examTechnique.trim())} />
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
            statusIcon={<StatusIndicator status={getSectionStatus("stagedSpecData", stagedSpecData, !stagedSpecData || stagedSpecData.length === 0)} />}
            onReplaceDeployed={async () => {
              if (!projectId) return;
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
              <p className="text-xs text-muted-foreground">Upload QPs and Mark Schemes — they'll be auto-paired by paper number.</p>
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
                    initialDeployed={projectStatus === "deployed"}
                    productId={projects.find(p => p.id === selectedProjectId)?.product_id || null}
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
                <ProgressRow label="Meet the Brain" status={getSectionStatus("trainerDescription", trainerDescription, !trainerDescription.trim() && !trainerImageUrl)} />
                <ProgressRow label="System Prompt" status={getSectionStatus("systemPrompt", systemPrompt, !systemPrompt.trim())} />
                <ProgressRow label="Exam Technique" status={getSectionStatus("examTechnique", examTechnique, !examTechnique.trim())} />
                <ProgressRow label="Specification" status={getSectionStatus("stagedSpecData", stagedSpecData, !stagedSpecData || stagedSpecData.length === 0)} />
                {PAPER_YEARS.map(year => (
                  <ProgressRow
                    key={year}
                    label={`Paper ${year}`}
                    status={getYearStatus(year)}
                  />
                ))}
                {customSections.map((s, i) => (
                  <ProgressRow key={i} label={s.name || `Custom ${i + 1}`} status={getSectionStatus(`customSection_${i}`, s.content, !s.content.trim())} />
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
                  trainerBioStatus={getSectionStatus("trainerDescription", trainerDescription, !trainerDescription.trim() && !trainerImageUrl)}
                  systemPromptStatus={getSectionStatus("systemPrompt", systemPrompt, !systemPrompt.trim())}
                  examTechniqueStatus={getSectionStatus("examTechnique", examTechnique, !examTechnique.trim())}
                  specStatus={getSectionStatus("stagedSpecData", stagedSpecData, !stagedSpecData || stagedSpecData.length === 0)}
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
  const deployed = sections.filter(s => s.status === "deployed").length;
  const saved = sections.filter(s => s.status === "saved").length;
  const unsaved = sections.filter(s => s.status === "unsaved").length;
  const pct = Math.round((deployed / total) * 100);

  return (
    <div className="space-y-1.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{pct}% deployed</span>
        <span className="text-xs text-muted-foreground">{deployed}/{total} sections</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {unsaved > 0 && (
        <p className="text-xs text-red-500">{unsaved} section{unsaved > 1 ? "s" : ""} not saved</p>
      )}
      {saved > 0 && (
        <p className="text-xs text-orange-500">{saved} section{saved > 1 ? "s" : ""} ready for deployment</p>
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
  
  // If the path is a static asset (starts with /) or a full URL, use it directly
  const isDirectUrl = filePath.startsWith('/') || filePath.startsWith('http');

  useEffect(() => {
    if (isDirectUrl) {
      setUrl(filePath);
      return;
    }
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from("trainer-uploads")
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) setUrl(data.signedUrl);
    };
    getUrl();
  }, [filePath, isDirectUrl]);

  if (!url) return <div className="w-full h-full bg-muted" />;
  return <img src={url} alt="Trainer" className="w-full h-full object-cover" />;
}
