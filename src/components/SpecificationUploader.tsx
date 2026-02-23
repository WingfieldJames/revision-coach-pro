import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SpecificationUploaderProps {
  onStatusChange?: (status: "idle" | "processing" | "success" | "error") => void;
  initialComplete?: boolean;
}

type UploadState = "idle" | "reading" | "processing" | "success" | "error";

export function SpecificationUploader({ onStatusChange, initialComplete }: SpecificationUploaderProps) {
  const [state, setState] = useState<UploadState>(initialComplete ? "success" : "idle");
  const [fileName, setFileName] = useState<string | null>(initialComplete ? "Specification" : null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialComplete prop
  useEffect(() => {
    if (initialComplete && state === "idle") {
      setState("success");
      setFileName("Specification");
    }
  }, [initialComplete]);

  // Report status changes to parent
  useEffect(() => {
    if (!onStatusChange) return;
    if (state === "reading" || state === "processing") onStatusChange("processing");
    else if (state === "success") onStatusChange("success");
    else if (state === "error") onStatusChange("error");
    else onStatusChange("idle");
  }, [state, onStatusChange]);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are accepted.");
      setState("error");
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setErrorMessage(null);
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

      setState("success");
      toast({
        title: "Specification parsed",
        description: `Extracted ${data.specifications.length} specification points.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process PDF";
      setErrorMessage(message);
      setState("error");
      toast({ title: "Processing failed", description: message, variant: "destructive" });
    }
  }, []);

  const isProcessing = state === "reading" || state === "processing";

  // Success / done state — compact green confirmation
  if (state === "success") {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Specification</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
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
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Specification uploaded</p>
              {fileName && fileName !== "Specification" && (
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground shrink-0"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Specification</CardTitle>
          {state === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
          {isProcessing && <Loader2 className="h-5 w-5 animate-spin text-orange-500" />}
          {state === "idle" && <div className="h-5 w-5 rounded-full border border-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
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
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isProcessing
              ? "border-orange-500/50 bg-orange-500/5 cursor-wait"
              : state === "error"
              ? "border-destructive/50 bg-destructive/5"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => !isProcessing && inputRef.current?.click()}
        >
          {isProcessing ? (
            <div className="space-y-2">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
              <p className="text-sm text-orange-500 font-medium">
                {state === "reading" ? "Reading PDF..." : "Extracting specification points..."}
              </p>
              {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
            </div>
          ) : state === "error" ? (
            <div className="space-y-2">
              <AlertCircle className="mx-auto h-6 w-6 text-destructive" />
              <p className="text-sm text-destructive font-medium">
                {errorMessage || "Processing failed"}
              </p>
              <p className="text-xs text-muted-foreground">Click to try again</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Click to upload specification PDF</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only — one file</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
