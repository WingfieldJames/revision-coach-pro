import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle, FileText, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSpecifications } from "@/lib/specNormalization";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SpecificationUploaderProps {
  onStatusChange?: (status: "idle" | "processing" | "success" | "error") => void;
  onSpecDataChange?: (specs: string[] | null) => void;
  onReplaceDeployed?: () => Promise<void>;
  initialComplete?: boolean;
  initialStagedSpecs?: string[] | null;
  isDeployed?: boolean;
  hasChangesSinceDeploy?: boolean;
  /** Status icon element from parent (tri-state) */
  statusIcon?: ReactNode;
}

type UploadState = "idle" | "reading" | "processing" | "ready" | "error";

export function SpecificationUploader({ onStatusChange, onSpecDataChange, onReplaceDeployed, initialComplete, initialStagedSpecs, isDeployed, hasChangesSinceDeploy, statusIcon }: SpecificationUploaderProps) {
  const hasInitialData = initialComplete || (initialStagedSpecs && initialStagedSpecs.length > 0);
  const [state, setState] = useState<UploadState>(hasInitialData ? "ready" : "idle");
  const [fileName, setFileName] = useState<string | null>(
    initialComplete ? "Specification (loaded)" : initialStagedSpecs ? "Specification (saved)" : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stagedSpecs, setStagedSpecs] = useState<string[] | null>(initialStagedSpecs || null);
  const [showPreview, setShowPreview] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonEditorValue, setJsonEditorValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialComplete prop
  useEffect(() => {
    if (initialComplete && state === "idle") {
      setState("ready");
      setFileName("Specification (loaded)");
    }
  }, [initialComplete]);

  // Hydrate from async-loaded staged specs
  useEffect(() => {
    if (initialStagedSpecs && initialStagedSpecs.length > 0) {
      setStagedSpecs(initialStagedSpecs);
      setState("ready");
      if (!fileName) setFileName("Specification (saved)");
    }
  }, [initialStagedSpecs, fileName]);

  // Report status changes to parent
  useEffect(() => {
    if (!onStatusChange) return;
    if (state === "reading" || state === "processing") onStatusChange("processing");
    else if (state === "ready") onStatusChange("success");
    else if (state === "error") onStatusChange("error");
    else onStatusChange("idle");
  }, [state, onStatusChange]);

  // Report staged data changes to parent
  useEffect(() => {
    if (state === "ready") {
      onSpecDataChange?.(stagedSpecs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagedSpecs, state]);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are accepted.");
      setState("error");
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    const previousSpecs = stagedSpecs;
    const previousFileName = fileName;

    setFileName(file.name);
    setErrorMessage(null);
    setStagedSpecs(null);
    setState("reading");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      setState("processing");

      const { data, error } = await supabase.functions.invoke("parse-specification", {
        body: { pdf_base64: base64, mime_type: file.type || "application/pdf" },
      });

      if (error) throw error;
      if (!data?.specifications || !Array.isArray(data.specifications)) {
        throw new Error("Invalid response from parser");
      }

      setStagedSpecs(data.specifications);
      setShowPreview(true);
      setState("ready");
      toast({
        title: "Specification parsed",
        description: `Extracted ${data.specifications.length} spec points.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process PDF";
      setErrorMessage(message);
      // Restore previous data on error
      if (previousSpecs && previousSpecs.length > 0) {
        setStagedSpecs(previousSpecs);
        setFileName(previousFileName);
        setState("ready");
      } else {
        setState("error");
      }
      toast({ title: "Processing failed", description: message, variant: "destructive" });
    }
  }, [stagedSpecs, fileName]);

  // Replace flow: if spec data exists, ask for confirmation first
  const handleReplaceClick = () => {
    if (stagedSpecs && stagedSpecs.length > 0) {
      setShowReplaceConfirm(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleReplaceConfirmed = async () => {
    setShowReplaceConfirm(false);
    if (initialComplete && onReplaceDeployed) {
      try {
        await onReplaceDeployed();
      } catch (e) {
        console.error("Failed to delete deployed spec data:", e);
      }
    }
    setStagedSpecs(null);
    setFileName(null);
    setState("idle");
    setTimeout(() => inputRef.current?.click(), 100);
  };

  const removeSpecPoint = (index: number) => {
    setStagedSpecs(prev => {
      const next = prev ? prev.filter((_, i) => i !== index) : null;
      if (!next || next.length === 0) {
        setState("idle");
        setFileName(null);
      }
      return next;
    });
  };

  const isProcessing = state === "reading" || state === "processing";
  const hasStagedData = stagedSpecs && stagedSpecs.length > 0;

  // Header icon — use parent's statusIcon if provided, else fallback
  const headerIcon = statusIcon || (
    isProcessing
      ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      : state === "error"
      ? <AlertCircle className="h-5 w-5 text-destructive" />
      : <div className="h-5 w-5 rounded-full border border-muted-foreground" />
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Specification</CardTitle>
          {headerIcon}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = "";
          }}
        />

        {/* Replace confirmation dialog */}
        <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace specification?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace the current specification data. The existing spec points in the database will be removed when you deploy. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, keep current</AlertDialogCancel>
              <AlertDialogAction onClick={handleReplaceConfirmed}>Yes, replace</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ready state — spec data exists */}
        {state === "ready" && hasStagedData && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {stagedSpecs?.length || 0} spec points
                </p>
              </div>
              {fileName && <p className="text-xs text-muted-foreground truncate ml-6">{fileName}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide preview" : "Show preview"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  if (!showJsonEditor) {
                    setJsonEditorValue(JSON.stringify(stagedSpecs || [], null, 2));
                    setJsonError(null);
                  }
                  setShowJsonEditor(!showJsonEditor);
                  if (!showPreview) setShowPreview(true);
                }}
              >
                {showJsonEditor ? "List view" : "Edit JSON"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={handleReplaceClick}
              >
                Replace
              </Button>
            </div>
          </div>
        )}

        {/* Idle state — upload zone */}
        {state === "idle" && (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-border hover:border-primary/50"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Click to upload specification PDF</p>
            <p className="text-xs text-muted-foreground mt-1">PDF only — one file</p>
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center border-orange-500/50 bg-orange-500/5 cursor-wait">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
            <p className="text-sm text-orange-500 font-medium mt-2">
              {state === "reading" ? "Reading PDF..." : "Extracting specification points..."}
            </p>
            {fileName && <p className="text-xs text-muted-foreground mt-1">{fileName}</p>}
          </div>
        )}

        {/* Error state */}
        {state === "error" && (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-destructive/50 bg-destructive/5"
            onClick={() => inputRef.current?.click()}
          >
            <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
            <p className="text-sm text-destructive font-medium mt-2">
              {errorMessage || "Processing failed"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Click to try again</p>
          </div>
        )}

        {/* Preview list */}
        {showPreview && hasStagedData && state === "ready" && (
          <div className="border border-border rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 rounded-t-lg">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Specification Points
              </span>
              <span className="text-xs text-muted-foreground">
                {stagedSpecs!.length} points
              </span>
            </div>
            {showJsonEditor ? (
              <div className="p-2 space-y-2">
                <textarea
                  className="w-full min-h-[300px] max-h-[500px] text-xs font-mono p-3 rounded border border-border bg-background text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  value={jsonEditorValue}
                  onChange={e => {
                    setJsonEditorValue(e.target.value);
                    setJsonError(null);
                  }}
                />
                {jsonError && (
                  <p className="text-xs text-destructive">{jsonError}</p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonEditorValue);
                      const normalized = normalizeSpecifications(parsed);
                      if (!normalized || normalized.length === 0) {
                        setJsonError("Could not extract spec points. Use an array of strings, or objects with content/text/point fields.");
                        return;
                      }
                      setStagedSpecs(normalized);
                      setJsonError(null);
                      toast({ title: "JSON applied", description: `${normalized.length} spec points updated.` });
                    } catch {
                      setJsonError("Invalid JSON — please fix syntax errors");
                    }
                  }}
                >
                  Apply changes
                </Button>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                {stagedSpecs!.map((spec, i) => (
                  <div key={i} className="flex items-start gap-1.5 group">
                    <p className="flex-1 text-xs text-muted-foreground px-2 py-1.5 rounded bg-muted/30">
                      {spec}
                    </p>
                    <button
                      onClick={() => removeSpecPoint(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                      title="Remove this spec point"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
