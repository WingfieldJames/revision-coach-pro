import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Loader2, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedSpecs {
  specifications: string[];
}

// Placeholder function — logs the JSON payload for verification
function saveSpecsToDatabase(extractedSpecs: ExtractedSpecs) {
  console.log("=== saveSpecsToDatabase called ===");
  console.log("Payload:", JSON.stringify(extractedSpecs, null, 2));
  console.log(`Total spec points: ${extractedSpecs.specifications.length}`);
}

type UploadState = "idle" | "reading" | "processing" | "success" | "error";

export function SpecificationUploader() {
  const [state, setState] = useState<UploadState>("idle");
  const [extractedSpecs, setExtractedSpecs] = useState<ExtractedSpecs | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    // Validate PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are accepted.");
      setState("error");
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setErrorMessage(null);
    setExtractedSpecs(null);
    setState("reading");

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      setState("processing");

      // Call edge function
      const { data, error } = await supabase.functions.invoke("parse-specification", {
        body: { pdf_base64: base64, mime_type: file.type || "application/pdf" },
      });

      if (error) throw error;

      if (!data?.specifications || !Array.isArray(data.specifications)) {
        throw new Error("Invalid response from parser");
      }

      const specs: ExtractedSpecs = { specifications: data.specifications };
      setExtractedSpecs(specs);
      setState("success");

      // Call placeholder save function
      saveSpecsToDatabase(specs);

      toast({
        title: "Specification parsed",
        description: `Extracted ${specs.specifications.length} specification points.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process PDF";
      setErrorMessage(message);
      setState("error");
      toast({ title: "Processing failed", description: message, variant: "destructive" });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const isProcessing = state === "reading" || state === "processing";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Specification</CardTitle>
          {state === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
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

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : isProcessing
              ? "border-orange-500/50 bg-orange-500/5 cursor-wait"
              : state === "success"
              ? "border-green-500/50 bg-green-500/5"
              : state === "error"
              ? "border-destructive/50 bg-destructive/5"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => !isProcessing && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isProcessing ? (
            <div className="space-y-2">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-500" />
              <p className="text-sm text-orange-500 font-medium">
                {state === "reading" ? "Reading PDF..." : "Extracting specification points..."}
              </p>
              {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
            </div>
          ) : state === "success" && extractedSpecs ? (
            <div className="space-y-2">
              <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
              <p className="text-sm text-green-600 font-medium">
                {extractedSpecs.specifications.length} spec points extracted
              </p>
              <p className="text-xs text-muted-foreground">{fileName}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload className="h-3 w-3 mr-1" /> Replace
              </Button>
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
              <p className="text-sm text-muted-foreground mt-2">Click to upload file</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only</p>
            </>
          )}
        </div>

        {/* Preview extracted specs */}
        {state === "success" && extractedSpecs && extractedSpecs.specifications.length > 0 && (
          <div className="mt-4 border border-border rounded-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50 rounded-t-lg">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Extracted Specification Points
              </span>
              <span className="text-xs text-muted-foreground">
                {extractedSpecs.specifications.length} points
              </span>
            </div>
            <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
              {extractedSpecs.specifications.slice(0, 50).map((spec, i) => (
                <p key={i} className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted/30">
                  {spec}
                </p>
              ))}
              {extractedSpecs.specifications.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  ... and {extractedSpecs.specifications.length - 50} more
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
