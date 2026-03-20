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
import { Upload, CheckCircle2, Circle, Clock, Plus, Trash2, Send, Loader2, Rocket, BookOpen, User, ImagePlus, Globe, Bot, PenTool, FileText, Timer, BookMarked, BarChart3, Save, AlertTriangle, HelpCircle, RefreshCw } from "lucide-react";
import { normalizeSpecifications } from "@/lib/specNormalization";
import { getLegacyConfig } from "@/lib/legacyLiveConfig";
import { diagrams } from "@/data/diagrams";
import { csDiagrams } from "@/data/csDiagrams";
import { PastPaperYearCard } from "@/components/PastPaperYearCard";
import { RefreshIndexButton } from "@/components/RefreshIndexButton";
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
const QUALIFICATION_TYPES = ["A Level", "GCSE"];
const AVAILABLE_SUBJECTS = [
  "Economics", "Computer Science", "Physics",
  "Chemistry", "Psychology", "Mathematics",
  "Biology"
];

interface TrainerProject {
  id: string;
  subject: string;
  exam_board: string;
  qualification_type: string;
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
  diagram_library: Array<{ id: string; title: string; imagePath: string }> | null;
}

const PAPER_YEARS = ["2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const WEBSITE_FEATURES = [
  { id: "my_ai", label: "My AI", description: "AI-powered chatbot trained on your subject content", icon: Bot },
  { id: "diagram_generator", label: "Diagram Generator", description: "AI diagram finder for visual question support", icon: BarChart3 },
  { id: "essay_marker", label: "Essay Marker", description: "AI-powered essay marking with detailed feedback", icon: PenTool },
  { id: "past_papers", label: "Past Papers", description: "Searchable past paper archive with mark schemes", icon: FileText },
  { id: "exam_countdown", label: "Exam Countdown", description: "Live countdown timer to upcoming exams", icon: Timer },
  { id: "revision_guide", label: "Revision Guide", description: "AI-generated revision notes by topic", icon: BookMarked },
  { id: "grade_boundaries", label: "Grade Boundaries", description: "View grade boundary data for the subject", icon: BarChart3 },
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
  const [selectedProjectId, setSelectedProjectIdRaw] = useState<string | null>(() => {
    return localStorage.getItem('build_selected_project_id') || null;
  });
  const setSelectedProjectId = (id: string | null) => {
    setSelectedProjectIdRaw(id);
    if (id) localStorage.setItem('build_selected_project_id', id);
    else localStorage.removeItem('build_selected_project_id');
  };
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState("draft");

  // New Subject dialog
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);
  const [newQualificationType, setNewQualificationType] = useState("A Level");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newExamBoard, setNewExamBoard] = useState("");
  
  // Add New Subject (custom subject name flow)
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState("");

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
  const [suggestedPrompts, setSuggestedPrompts] = useState<Array<{ text: string; usesPersonalization?: boolean }>>([]);
  const [gradeBoundaries, setGradeBoundaries] = useState<Record<string, { aStar: string; a: string; b: string }>>({});
  const [diagramLibrary, setDiagramLibrary] = useState<Array<{ id: string; title: string; imagePath: string }>>([]);
  const [uploadingDiagram, setUploadingDiagram] = useState(false);
  const diagramImageInputRef = useRef<HTMLInputElement>(null);

  // Uploads
  const [uploads, setUploads] = useState<TrainerUpload[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  // Chunk counts from document_chunks (covers legacy + processed uploads)
  const [chunkStats, setChunkStats] = useState<{ pastPaperChunks: number; specChunks: number }>({ pastPaperChunks: 0, specChunks: 0 });

  // Track files currently processing (for tab-close warning + polling)
  const hasProcessingFiles = useMemo(
    () => uploads.some(u => u.processing_status === "processing" || u.processing_status === "pending"),
    [uploads]
  );

  // Warn user before closing tab if files are processing
  useEffect(() => {
    if (!hasProcessingFiles) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasProcessingFiles]);

  // Auto-poll uploads while files are processing
  useEffect(() => {
    if (!hasProcessingFiles || !projectId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("trainer_uploads")
        .select("*")
        .eq("project_id", projectId);
      if (data) setUploads(data as TrainerUpload[]);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasProcessingFiles, projectId]);


  

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
      // Deduplicate by qual+board+subject — keep the BEST project (deployed > has product_id > most recently updated)
      const grouped = new Map<string, TrainerProject[]>();
      for (const p of all) {
        const key = `${p.qualification_type.toLowerCase()}::${p.exam_board.toLowerCase()}::${p.subject.toLowerCase()}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(p);
      }
      const typed: TrainerProject[] = [];
      for (const group of grouped.values()) {
        group.sort((a, b) => {
          if (a.status === 'deployed' && b.status !== 'deployed') return -1;
          if (b.status === 'deployed' && a.status !== 'deployed') return 1;
          if (a.product_id && !b.product_id) return -1;
          if (b.product_id && !a.product_id) return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        typed.push(group[0]);
      }
      setProjects(typed);
      // Auto-select: use stored preference if valid, otherwise first project
      if (typed.length > 0) {
        const stored = localStorage.getItem('build_selected_project_id');
        const storedExists = stored && typed.some(p => p.id === stored);
        if (!selectedProjectId || !typed.some(p => p.id === selectedProjectId)) {
          setSelectedProjectId(storedExists ? stored : typed[0].id);
        }
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
      selectedFeatures, examDates, essayMarkerMarks, stagedSpecData, suggestedPrompts, diagramLibrary,
    });
  }, [systemPrompt, examTechnique, customSections, trainerDescription, trainerImageUrl,
      trainerName, trainerStatus, trainerAchievements,
      selectedFeatures, examDates, essayMarkerMarks, stagedSpecData, suggestedPrompts, diagramLibrary]);

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

    const dbSuggestedPrompts = Array.isArray((existing as any).suggested_prompts) ? (existing as any).suggested_prompts as Array<{ text: string; usesPersonalization?: boolean }> : [];
    const hasValidDbPrompts = dbSuggestedPrompts.filter(p => p.text?.trim()).length > 0;
    const initialSuggestedPrompts = hasValidDbPrompts ? dbSuggestedPrompts : (legacy?.suggestedPrompts || []);

    const dbDiagramLibrary = Array.isArray((existing as any).diagram_library) ? (existing as any).diagram_library as Array<{ id: string; title: string; imagePath: string }> : [];
    // Fallback: populate from static diagram libraries for legacy subjects
    let initialDiagramLibrary = dbDiagramLibrary;
    if (dbDiagramLibrary.length === 0) {
      const subjectLower = existing.subject.toLowerCase();
      if (subjectLower === 'computer science') {
        initialDiagramLibrary = csDiagrams.map(d => ({ id: d.id, title: d.title, imagePath: d.imagePath }));
      } else if (subjectLower === 'economics') {
        initialDiagramLibrary = diagrams.map(d => ({ id: d.id, title: d.title, imagePath: d.imagePath }));
      }
    }

    setCustomSections(initialCustomSections);
    setTrainerImageUrl(initialTrainerImageUrl);
    setTrainerDescription(initialTrainerDescription);
    setTrainerName(initialTrainerName);
    setTrainerStatus(initialTrainerStatus);
    setTrainerAchievements(initialTrainerAchievements);
    setSelectedFeatures(initialSelectedFeatures);
    setExamDates(initialExamDates);
    setEssayMarkerMarks(initialEssayMarkerMarks);
    setSuggestedPrompts(initialSuggestedPrompts);
    setDiagramLibrary(initialDiagramLibrary);

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
        suggestedPrompts: initialSuggestedPrompts,
        diagramLibrary: initialDiagramLibrary,
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
           p.subject.toLowerCase() === newSubjectName.trim().toLowerCase() &&
           p.qualification_type.toLowerCase() === newQualificationType.toLowerCase()
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
        qualification_type: newQualificationType,
        created_by: user.id,
      } as any)
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
    setNewQualificationType("A Level");
    toast({ title: "Subject created", description: `${newQualificationType} · ${newProject.exam_board} ${newProject.subject}` });
  };

  // Load uploads + chunk stats when project changes
  const loadChunkStats = useCallback(async () => {
    const currentProduct = projects.find(p => p.id === selectedProjectId);
    const pid = currentProduct?.product_id;
    if (!pid) { setChunkStats({ pastPaperChunks: 0, specChunks: 0 }); return; }
    // Count past paper chunks (content_type contains 'paper' or 'mark_scheme' or 'combined')
    const { count: ppCount } = await supabase
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("product_id", pid)
      .or("metadata->>content_type.ilike.%paper%,metadata->>content_type.ilike.%mark_scheme%,metadata->>content_type.eq.combined");
    const { count: specCount } = await supabase
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("product_id", pid)
      .eq("metadata->>content_type", "specification");
    setChunkStats({ pastPaperChunks: ppCount || 0, specChunks: specCount || 0 });
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!projectId) return;
    const loadUploads = async () => {
      const { data } = await supabase
        .from("trainer_uploads")
        .select("*")
        .eq("project_id", projectId);
      const loaded = (data as TrainerUpload[]) || [];
      setUploads(loaded);
    };
    loadUploads();
    loadChunkStats();
  }, [projectId, loadChunkStats]);

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
          suggested_prompts: suggestedPrompts as unknown as import("@/integrations/supabase/types").Json,
          diagram_library: diagramLibrary as unknown as import("@/integrations/supabase/types").Json,
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
      toast({ title: "Processing started", description: `${file.name} is being analysed by AI. This may take 1-3 minutes — please don't close this tab.`, duration: 8000 });

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

  // Direct text entry — submit text straight into document_chunks AND create a trainer_upload record so it appears in the UI
  const handleAddText = async (title: string, content: string, year: string) => {
    const product = projects.find(p => p.id === selectedProjectId);
    if (!product?.product_id) {
      toast({ title: "Deploy first", description: "Deploy the subject at least once before adding direct text.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.functions.invoke("ingest-content", {
        body: {
          product_id: product.product_id,
          chunks: [{
            content: `[${title}]\n${content}`,
            metadata: { content_type: "past_paper", source: "direct_text", title, year },
          }],
        },
      });
      if (error) throw error;

      // Create a trainer_upload record so the text entry appears alongside AI-processed files
      if (projectId) {
        const { error: insertErr } = await supabase
          .from("trainer_uploads")
          .insert({
            project_id: projectId,
            section_type: "past_paper",
            year,
            file_name: title,
            file_url: `direct_text_${Date.now()}`,
            processing_status: "done",
            doc_type: "text",
            chunks_created: 1,
          });
        if (insertErr) console.error("Failed to create upload record:", insertErr);

        // Refresh uploads list so the new entry appears immediately
        const { data: updatedUploads } = await supabase
          .from("trainer_uploads")
          .select("*")
          .eq("project_id", projectId);
        setUploads((updatedUploads as TrainerUpload[]) || []);
      }

      markUnsaved();
      toast({ title: "Text added ✓", description: `"${title}" added to training data and will appear in the file list.` });
    } catch (err) {
      console.error("Text entry failed:", err);
      toast({ title: "Failed to add text", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      throw err;
    }
  };



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
  const currentLabel = currentProject ? `${currentProject.qualification_type} · ${currentProject.exam_board} ${currentProject.subject}` : "Select Subject";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Build Portal</h1>
            {/* Cascading subject selector */}
            {(() => {
              // Derive unique qualification types from projects
              const qualTypes = Array.from(new Set(projects.map(p => p.qualification_type))).sort();
              const selectedQualType = currentProject ? currentProject.qualification_type : (qualTypes[0] || 'A Level');

              // Filter projects by selected qualification type
              const filteredByQual = projects.filter(p => p.qualification_type === selectedQualType);

              // Derive unique subjects for the selected qualification type
              const subjects = Array.from(new Set(filteredByQual.map(p => p.subject))).sort();
              const selectedSubject = currentProject && currentProject.qualification_type === selectedQualType
                ? currentProject.subject
                : (subjects[0] || '');

              // Filter projects by subject to get available boards
              const filteredBySubject = filteredByQual.filter(p => p.subject === selectedSubject);
              const boards = filteredBySubject.map(p => p.exam_board).sort();

              return (
                <div className="flex items-center gap-2">
                  {/* 1. Qualification Type */}
                  <Select
                    value={selectedQualType}
                    onValueChange={(val) => {
                      const first = projects.find(p => p.qualification_type === val);
                      if (first) setSelectedProjectId(first.id);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qualTypes.map(qt => (
                        <SelectItem key={qt} value={qt}>{qt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* 2. Subject */}
                  <Select
                    value={selectedSubject}
                    onValueChange={(val) => {
                      const match = filteredByQual.find(p => p.subject === val);
                      if (match) setSelectedProjectId(match.id);
                    }}
                  >
                    <SelectTrigger className="w-[160px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* 3. Board */}
                  <Select
                    value={currentProject?.exam_board || boards[0] || ''}
                    onValueChange={(val) => {
                      const match = filteredBySubject.find(p => p.exam_board === val) 
                        || filteredByQual.find(p => p.subject === selectedSubject && p.exam_board === val);
                      if (match) setSelectedProjectId(match.id);
                    }}
                  >
                    <SelectTrigger className="w-[120px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map(board => {
                        const proj = filteredBySubject.find(p => p.exam_board === board);
                        return (
                          <SelectItem key={board} value={board}>
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span>{board}</span>
                              {proj && (
                                <span className={`h-2 w-2 rounded-full shrink-0 ${
                                  proj.status === "deployed" ? "bg-green-500" : "bg-muted-foreground/40"
                                }`} />
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* 4. Create New Subject */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => setShowNewSubjectDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Subject</span>
                  </Button>
                </div>
              );
            })()}
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
              <Label>Qualification Type</Label>
              <Select value={newQualificationType} onValueChange={setNewQualificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={newSubjectName} onValueChange={setNewSubjectName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const existingSubjects = projects.map(p => p.subject);
                    const allSubjects = Array.from(new Set([...AVAILABLE_SUBJECTS, ...existingSubjects])).sort();
                    return allSubjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
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
              <CardTitle className="text-base">Past Papers & Training Content</CardTitle>
              <p className="text-xs text-muted-foreground">Upload QPs and Mark Schemes, or add text directly to training data.</p>
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
                    onAddText={handleAddText}
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
              <p className="text-xs text-muted-foreground">Select which features you'd like enabled on your subject's student-facing page. Click a feature to toggle it on or off. <span className="font-semibold text-foreground">Remember to Save &amp; Re-Deploy for changes to go live.</span></p>
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

              {/* Diagram Library */}
              {selectedFeatures.includes("diagram_generator") && (
                <div className="mt-4 p-3 rounded-lg border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Diagram Library</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload diagram images with titles. The AI will match student questions to the most relevant diagram.</p>
                  <input
                    ref={diagramImageInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !projectId) return;
                      setUploadingDiagram(true);
                      try {
                        const filePath = `${projectId}/diagram_${Date.now()}_${file.name}`;
                        const { error: uploadErr } = await supabase.storage
                          .from("trainer-uploads")
                          .upload(filePath, file, { upsert: true });
                        if (uploadErr) throw uploadErr;
                        const newDiagram = {
                          id: `custom-${Date.now()}`,
                          title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                          imagePath: filePath,
                        };
                        setDiagramLibrary(prev => [...prev, newDiagram]);
                        toast({ title: "Diagram uploaded", description: "Give it a title below." });
                      } catch (err) {
                        toast({ title: "Upload failed", variant: "destructive" });
                      } finally {
                        setUploadingDiagram(false);
                        e.target.value = "";
                      }
                    }}
                  />
                  {diagramLibrary.map((diagram, idx) => (
                    <div key={diagram.id} className="flex items-center gap-2 border border-border rounded-lg p-2">
                      <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
                        <DiagramThumbnail filePath={diagram.imagePath} />
                      </div>
                      <Input
                        value={diagram.title}
                        onChange={e => {
                          const next = [...diagramLibrary];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setDiagramLibrary(next);
                        }}
                        placeholder="Diagram title..."
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDiagramLibrary(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => diagramImageInputRef.current?.click()}
                    disabled={uploadingDiagram}
                    className="w-full"
                  >
                    {uploadingDiagram ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Add Diagram
                  </Button>
                </div>
              )}

              {/* Past Paper Finder Config */}
              {selectedFeatures.includes("past_papers") && (() => {
                const ppUploads = uploads.filter(u => u.section_type === "past_paper");
                const processedUploads = ppUploads.filter(u => u.processing_status === "processed");
                const pendingUploads = ppUploads.filter(u => u.processing_status === "pending" || u.processing_status === "processing");
                const errorUploads = ppUploads.filter(u => u.processing_status === "error");
                const yearsWithPapers = [...new Set(ppUploads.map(u => u.year).filter(Boolean))].sort().reverse();
                const hasSpec = specComplete && stagedSpecData && stagedSpecData.length > 0;
                const totalPaperChunks = chunkStats.pastPaperChunks;
                const hasTrainingData = processedUploads.length > 0 || totalPaperChunks > 0;
                const isReady = hasSpec && hasTrainingData;
                return (
                  <div className="mt-4 p-3 rounded-lg border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Past Paper Finder — Readiness</p>
                      {isReady ? (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-600 dark:text-green-400 ml-auto">Ready</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-600 dark:text-yellow-400 ml-auto">Incomplete</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">The Past Paper Finder maps specification points to exam questions. It requires both a specification and past papers to function.</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        {hasSpec ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                        <span className={hasSpec ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                          Specification: {hasSpec ? `${stagedSpecData!.length} points indexed` : "Not uploaded"}
                          {chunkStats.specChunks > 0 && <span className="text-muted-foreground ml-1">({chunkStats.specChunks} chunks deployed)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {hasTrainingData ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                        <span className={hasTrainingData ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                          Training Data: {totalPaperChunks > 0 ? `${totalPaperChunks} question chunks indexed` : "No chunks indexed yet"}
                          {processedUploads.length > 0 && <span className="text-muted-foreground ml-1">({processedUploads.length} file{processedUploads.length !== 1 ? "s" : ""} processed)</span>}
                          {pendingUploads.length > 0 && <span className="text-muted-foreground ml-1">({pendingUploads.length} processing…)</span>}
                          {errorUploads.length > 0 && <span className="text-destructive ml-1">({errorUploads.length} failed)</span>}
                        </span>
                      </div>
                    </div>
                    {yearsWithPapers.length > 0 && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground mb-1.5">Uploaded papers by year:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {yearsWithPapers.map(year => {
                            const count = ppUploads.filter(u => u.year === year).length;
                            return (
                              <Badge key={year} variant="secondary" className="text-xs">
                                {year} ({count} file{count !== 1 ? "s" : ""})
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <RefreshIndexButton
                      productId={currentProject?.product_id || null}
                      onComplete={() => loadChunkStats()}
                    />
                    {!hasSpec && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded p-2">
                        ⚠️ Upload a specification in the "Specification" section above to enable spec-to-question mapping.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Revision Guide Config */}
              {selectedFeatures.includes("revision_guide") && (() => {
                const hasSpec = specComplete && stagedSpecData && stagedSpecData.length > 0;
                const ppUploads = uploads.filter(u => u.section_type === "past_paper" && u.processing_status === "processed");
                const hasPaperData = ppUploads.length > 0 || chunkStats.pastPaperChunks > 0;
                return (
                  <div className="mt-4 p-3 rounded-lg border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <BookMarked className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">Revision Guide — Readiness</p>
                      {hasSpec ? (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-600 dark:text-green-400 ml-auto">Ready</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-600 dark:text-yellow-400 ml-auto">Needs Spec</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">The Revision Guide generates branded PDF notes for any topic. It pulls from the specification, exam technique, and past paper content to create comprehensive guides.</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        {hasSpec ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                        <span className={hasSpec ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>
                          Specification: {hasSpec ? `${stagedSpecData!.length} points available` : "Required — not yet uploaded"}
                          {chunkStats.specChunks > 0 && <span className="text-muted-foreground ml-1">({chunkStats.specChunks} chunks deployed)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {(examTechnique?.trim().length || 0) >= 10 ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-muted-foreground">
                          Exam Technique: {(examTechnique?.trim().length || 0) >= 10 ? "Provided" : "Optional — adds exam tips to guides"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {hasPaperData ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="text-muted-foreground">
                          Past Papers: {chunkStats.pastPaperChunks > 0 ? `${chunkStats.pastPaperChunks} question chunks indexed` : (ppUploads.length > 0 ? `${ppUploads.length} files processed` : "Optional — adds real exam context")}
                        </span>
                      </div>
                    </div>
                    {!hasSpec && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 rounded p-2">
                        ⚠️ A specification is required to generate revision guides. Upload one in the "Specification" section above.
                      </p>
                    )}
                  </div>
                );
              })()}
              <div className="mt-4 p-3 rounded-lg border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Suggested Prompts</p>
                </div>
                <p className="text-xs text-muted-foreground">These appear as clickable prompt suggestions when students first open the chatbot. Add up to 4.</p>
                {suggestedPrompts.map((sp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={sp.text}
                      onChange={e => {
                        const next = [...suggestedPrompts];
                        next[idx] = { ...next[idx], text: e.target.value };
                        setSuggestedPrompts(next);
                      }}
                      placeholder={`e.g. What topics are in the spec?`}
                      className="flex-1 text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                      <Checkbox
                        checked={!!sp.usesPersonalization}
                        onCheckedChange={(checked) => {
                          const next = [...suggestedPrompts];
                          next[idx] = { ...next[idx], usesPersonalization: !!checked };
                          setSuggestedPrompts(next);
                        }}
                      />
                      Personal
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSuggestedPrompts(suggestedPrompts.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {suggestedPrompts.length < 4 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSuggestedPrompts([...suggestedPrompts, { text: "" }])}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Prompt
                  </Button>
                )}
              </div>
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

function DiagramThumbnail({ filePath }: { filePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  
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

  if (!url) return <div className="w-full h-full bg-muted animate-pulse" />;
  return <img src={url} alt="Diagram" className="w-full h-full object-contain" />;
}
