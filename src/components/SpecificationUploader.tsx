import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Loader2, AlertCircle, FileText, Trash2, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  initialComplete?: boolean;
}

type UploadState = "idle" | "reading" | "processing" | "staged" | "submitted" | "error";

export function SpecificationUploader({ onStatusChange, onSpecDataChange, initialComplete }: SpecificationUploaderProps) {
  const [state, setState] = useState<UploadState>(initialComplete ? "submitted" : "idle");
  const [fileName, setFileName] = useState<string | null>(initialComplete ? "Specification (loaded)" : null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stagedSpecs, setStagedSpecs] = useState<string[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  // Track whether a spec has ever been submitted/deployed (persists through edits)
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(initialComplete || false);
  // Store the previously submitted specs so cancel can restore them
  const [previousSpecs, setPreviousSpecs] = useState<string[] | null>(null);
  const [previousFileName, setPreviousFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  // Sync initialComplete prop
  useEffect(() => {
    if (initialComplete && state === "idle") {
      setState("submitted");
      setFileName("Specification (loaded)");
      setHasBeenSubmitted(true);
    }
  }, [initialComplete]);

  // Report status changes to parent
  useEffect(() => {
    if (!onStatusChange) return;
    if (state === "reading" || state === "processing") onStatusChange("processing");
    else if (state === "submitted") onStatusChange("success");
    else if (state === "error") onStatusChange("error");
    // staged but previously submitted — still report success (spec exists)
    else if (state === "staged" && hasBeenSubmitted) onStatusChange("success");
    else onStatusChange("idle");
  }, [state, onStatusChange, hasBeenSubmitted]);

  // Report staged data changes to parent — only send when submitted
  useEffect(() => {
    onSpecDataChange?.(state === "submitted" ? stagedSpecs : null);
  }, [stagedSpecs, state, onSpecDataChange]);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are accepted.");
      setState("error");
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    // Save current state before replacing
    if (hasBeenSubmitted && stagedSpecs) {
      setPreviousSpecs(stagedSpecs);
      setPreviousFileName(fileName);
    }

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
      setState("staged");
      toast({
        title: "Specification parsed",
        description: `Extracted ${data.specifications.length} spec points. Review and submit when ready.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process PDF";
      setErrorMessage(message);
      // If we had a previous submission, restore to submitted state on error
      if (hasBeenSubmitted && previousSpecs) {
        setStagedSpecs(previousSpecs);
        setFileName(previousFileName);
        setState("submitted");
        setPreviousSpecs(null);
        setPreviousFileName(null);
      } else {
        setState("error");
      }
      toast({ title: "Processing failed", description: message, variant: "destructive" });
    }
  }, [hasBeenSubmitted, stagedSpecs, fileName, previousSpecs, previousFileName]);

  // Cancel: if previously submitted, go back to submitted. If fresh, go to idle.
  const handleCancel = () => {
    if (hasBeenSubmitted) {
      // Restore previous submission
      if (previousSpecs) {
        setStagedSpecs(previousSpecs);
        setFileName(previousFileName);
        setPreviousSpecs(null);
        setPreviousFileName(null);
      }
      setState("submitted");
      setShowPreview(false);
    } else {
      setStagedSpecs(null);
      setFileName(null);
      setShowPreview(false);
      setState("idle");
    }
  };

  const handleSubmit = () => {
    if (!stagedSpecs || stagedSpecs.length === 0) return;
    setState("submitted");
    setHasBeenSubmitted(true);
    setShowPreview(false);
    setPreviousSpecs(null);
    setPreviousFileName(null);
    toast({ title: "Specification submitted", description: "Will be saved to database on deploy." });
  };

  // Replace flow: if already submitted, ask for confirmation first
  const handleReplaceClick = () => {
    if (hasBeenSubmitted) {
      setShowReplaceConfirm(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleReplaceConfirmed = () => {
    setShowReplaceConfirm(false);
    inputRef.current?.click();
  };

  const removeSpecPoint = (index: number) => {
    setStagedSpecs(prev => prev ? prev.filter((_, i) => i !== index) : null);
  };

  const isProcessing = state === "reading" || state === "processing";
  const hasStagedData = stagedSpecs && stagedSpecs.length > 0;

  // Header icon
  const headerIcon = state === "submitted"
    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
    : (state === "staged" && hasBeenSubmitted)
    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
    : state === "staged"
    ? <Clock className="h-5 w-5 text-orange-500" />
    : state === "error"
    ? <AlertCircle className="h-5 w-5 text-destructive" />
    : isProcessing
    ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
    : <div className="h-5 w-5 rounded-full border border-muted-foreground" />;

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

        {/* Submitted (green done) state */}
        {state === "submitted" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {initialComplete && !hasStagedData
                    ? "Specification loaded"
                    : `${stagedSpecs?.length || 0} spec points submitted`}
                </p>
              </div>
              {fileName && <p className="text-xs text-muted-foreground truncate ml-6">{fileName}</p>}
              {hasStagedData && (
                <p className="text-xs text-orange-500 mt-1 ml-6">Will be saved to database on deploy</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Save current state for potential cancel
                  setPreviousSpecs(stagedSpecs);
                  setPreviousFileName(fileName);
                  setState("staged");
                  setShowPreview(true);
                }}
              >
                Edit
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

        {/* Staged state — parsed but not yet submitted */}
        {state === "staged" && (
          <div className="space-y-3">
            <div className={`rounded-lg border px-4 py-3 ${
              hasBeenSubmitted
                ? "border-green-500/30 bg-green-500/5"
                : "border-orange-500/30 bg-orange-500/5"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <FileText className={`h-4 w-4 shrink-0 ${hasBeenSubmitted ? "text-green-500" : "text-orange-500"}`} />
                <p className={`text-sm font-medium ${
                  hasBeenSubmitted
                    ? "text-green-600 dark:text-green-400"
                    : "text-orange-600 dark:text-orange-400"
                }`}>
                  {stagedSpecs?.length || 0} spec points — review before submitting
                </p>
              </div>
              {fileName && <p className="text-xs text-muted-foreground truncate ml-6">{fileName}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={!hasStagedData}>
                Submit
              </Button>
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
                className="text-xs text-muted-foreground"
                onClick={handleReplaceClick}
              >
                Replace
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-destructive"
                onClick={handleCancel}
              >
                <X className="h-3 w-3 mr-1" /> Cancel
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

        {/* Staging preview list */}
        {showPreview && hasStagedData && (state === "staged" || state === "submitted") && (
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
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
              {stagedSpecs!.map((spec, i) => (
                <div key={i} className="flex items-start gap-1.5 group">
                  <p className="flex-1 text-xs text-muted-foreground px-2 py-1.5 rounded bg-muted/30">
                    {spec}
                  </p>
                  {state === "staged" && (
                    <button
                      onClick={() => removeSpecPoint(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                      title="Remove this spec point"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
