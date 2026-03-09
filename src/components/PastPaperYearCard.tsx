import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  X,
  FileText,
  Type,
  Send,
} from "lucide-react";
import { PastPaperChunkViewer } from "@/components/PastPaperChunkViewer";
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

interface TrainerUpload {
  id: string;
  section_type: string;
  year: string | null;
  file_name: string;
  processing_status: string;
  chunks_created: number;
  doc_type?: string | null;
  paper_number?: number | null;
  created_at?: string;
}

interface PastPaperYearCardProps {
  year: string;
  uploads: TrainerUpload[];
  onUploadFiles: (files: FileList, year: string) => Promise<void>;
  onDeleteUpload: (uploadId: string, deleteChunks?: boolean) => Promise<void>;
  onAddText?: (title: string, content: string, year: string) => Promise<void>;
  uploading: boolean;
  initialDeployed?: boolean;
  productId?: string | null;
}

export function PastPaperYearCard({
  year,
  uploads,
  onUploadFiles,
  onDeleteUpload,
  onAddText,
  uploading,
  initialDeployed,
  productId,
}: PastPaperYearCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showTextEntry, setShowTextEntry] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textSubmitting, setTextSubmitting] = useState(false);

  const hasFiles = uploads.length > 0;
  const isDeployed = !!initialDeployed;

  const handleDeleteFile = async (uploadId: string) => {
    if (isDeployed) {
      setConfirmDeleteId(uploadId);
    } else {
      await onDeleteUpload(uploadId, false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await onDeleteUpload(confirmDeleteId, true);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleTextSubmit = async () => {
    if (!onAddText || !textTitle.trim() || !textContent.trim()) return;
    setTextSubmitting(true);
    try {
      await onAddText(textTitle.trim(), textContent.trim(), year);
      setTextTitle("");
      setTextContent("");
      setShowTextEntry(false);
    } finally {
      setTextSubmitting(false);
    }
  };

  const getFileLabel = (u: TrainerUpload) => {
    if (u.doc_type && u.paper_number) {
      return `Paper ${u.paper_number} ${u.doc_type.toUpperCase()}`;
    }
    return u.file_name.length > 30 ? u.file_name.slice(0, 27) + "..." : u.file_name;
  };

  const getStatusBadge = (u: TrainerUpload) => {
    if (u.processing_status === "done") return <span className="text-[10px] text-green-500">{u.chunks_created} chunks</span>;
    if (u.processing_status === "processing") return (
      <span className="flex items-center gap-1 text-[10px] text-orange-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analysing...
      </span>
    );
    if (u.processing_status === "pending") return <span className="text-[10px] text-muted-foreground">Queued</span>;
    if (u.processing_status === "error") return <span className="text-[10px] text-destructive">Error</span>;
    return null;
  };

  const processingCount = uploads.filter(u => u.processing_status === "processing" || u.processing_status === "pending").length;

  const fileToDelete = confirmDeleteId ? uploads.find(u => u.id === confirmDeleteId) : null;

  return (
    <div className="border rounded-lg p-3 space-y-2 border-border">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx"
        multiple
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            onUploadFiles(e.target.files, year);
            e.target.value = "";
          }
        }}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove deployed file?</AlertDialogTitle>
            <AlertDialogDescription>
              This file has been deployed and its training data is in the knowledge base. Removing it will also delete the associated chunks from the database. This cannot be undone.
              {fileToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  {getFileLabel(fileToDelete)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Yes, remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{year}</span>
        <div className="flex items-center gap-1.5">
          {onAddText && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => setShowTextEntry(!showTextEntry)}
            >
              <Type className="h-3 w-3 mr-1" />
              Add text
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Add files
          </Button>
        </div>
      </div>

      {/* Inline text entry */}
      {showTextEntry && (
        <div className="space-y-2 p-2.5 rounded-md border border-border bg-muted/20">
          <Input
            placeholder="Title (e.g. 'Paper 1 Q3 - Supply & Demand')"
            value={textTitle}
            onChange={e => setTextTitle(e.target.value)}
            className="text-xs h-8"
          />
          <Textarea
            placeholder="Paste question text, mark scheme content, or any training material..."
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            rows={4}
            className="text-xs"
          />
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleTextSubmit}
            disabled={textSubmitting || !textTitle.trim() || !textContent.trim()}
          >
            {textSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
            Add to Training Data
          </Button>
        </div>
      )}

      {/* File list */}
      {hasFiles && (
        <div className="space-y-1">
          {uploads.map(u => (
            <div
              key={u.id}
              className="px-2 py-1.5 rounded bg-muted/30 group"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs flex-1 truncate">{getFileLabel(u)}</span>
                {getStatusBadge(u)}
                {u.processing_status === "done" && (
                  <PastPaperChunkViewer
                    uploadId={u.id}
                    uploadLabel={getFileLabel(u)}
                    productId={productId || null}
                    year={u.year}
                    paperNumber={u.paper_number}
                    docType={u.doc_type}
                  />
                )}
                <button
                  onClick={() => handleDeleteFile(u.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive shrink-0"
                  title="Remove this file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processing banner */}
      {processingCount > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500 shrink-0" />
          <span className="text-xs text-orange-600 dark:text-orange-400">
            AI is analysing {processingCount} file{processingCount > 1 ? 's' : ''}. This may take 1-3 minutes — don't close this tab.
          </span>
        </div>
      )}

      {/* Empty state */}
      {!hasFiles && !showTextEntry && processingCount === 0 && (
        <p className="text-xs text-muted-foreground">No files uploaded yet</p>
      )}
    </div>
  );
}
