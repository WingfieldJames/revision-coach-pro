import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  X,
  FileText,
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

type YearState = "idle" | "editing" | "submitted";

interface PastPaperYearCardProps {
  year: string;
  uploads: TrainerUpload[];
  onUploadFiles: (files: FileList, year: string) => Promise<void>;
  onDeleteUpload: (uploadId: string, deleteChunks?: boolean) => Promise<void>;
  uploading: boolean;
  /** If the year had files previously deployed */
  initialSubmitted?: boolean;
  productId?: string | null;
}

export function PastPaperYearCard({
  year,
  uploads,
  onUploadFiles,
  onDeleteUpload,
  uploading,
  initialSubmitted,
  productId,
}: PastPaperYearCardProps) {
  const [state, setState] = useState<YearState>(
    initialSubmitted || uploads.length > 0 ? "submitted" : "idle"
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasFiles = uploads.length > 0;
  const allDone = hasFiles && uploads.every(u => u.processing_status === "done");
  const anyProcessing = uploads.some(u => u.processing_status === "processing" || u.processing_status === "pending");

  // A file is "deployed" if the year was initially submitted (came from DB)
  const isDeployed = !!initialSubmitted;

  // Header icon
  const headerIcon =
    state === "submitted" && hasFiles ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : anyProcessing ? (
      <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
    ) : hasFiles && state === "editing" ? (
      <Clock className="h-4 w-4 text-orange-500" />
    ) : null;

  const handleSubmit = () => {
    if (!hasFiles) {
      toast({ title: "No files", description: "Upload at least one file before submitting.", variant: "destructive" });
      return;
    }
    setState("submitted");
    toast({ title: `${year} papers submitted`, description: `${uploads.length} file(s) ready for deployment.` });
  };

  const handleEdit = () => {
    setState("editing");
  };

  const handleDeleteFile = async (uploadId: string) => {
    if (isDeployed && state === "submitted") {
      // Deployed file — need confirmation
      setConfirmDeleteId(uploadId);
    } else if (state === "editing" && isDeployed) {
      // Editing a deployed year — also confirm since chunks exist
      setConfirmDeleteId(uploadId);
    } else {
      // Not deployed — just remove immediately
      await onDeleteUpload(uploadId, false);
      if (uploads.length <= 1) {
        setState("idle");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await onDeleteUpload(confirmDeleteId, true);
      if (uploads.length <= 1) {
        setState("idle");
      }
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
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
    if (u.processing_status === "processing") return <Loader2 className="h-3 w-3 animate-spin text-orange-500" />;
    if (u.processing_status === "pending") return <Clock className="h-3 w-3 text-muted-foreground" />;
    if (u.processing_status === "error") return <span className="text-[10px] text-destructive">Error</span>;
    return null;
  };

  const fileToDelete = confirmDeleteId ? uploads.find(u => u.id === confirmDeleteId) : null;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${
      state === "submitted" && hasFiles
        ? "border-green-500/30 bg-green-500/5"
        : "border-border"
    }`}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx"
        multiple
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            onUploadFiles(e.target.files, year);
            if (state === "idle") setState("editing");
            e.target.value = "";
          }
        }}
      />

      {/* Delete confirmation dialog for deployed files */}
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{year}</span>
          {headerIcon}
        </div>

        {state === "submitted" && hasFiles ? (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        ) : state === "editing" || (state === "idle" && hasFiles) ? (
          <div className="flex items-center gap-1.5">
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
            <Button size="sm" className="text-xs h-7" onClick={handleSubmit} disabled={!hasFiles || anyProcessing}>
              Submit
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => {
              inputRef.current?.click();
              setState("editing");
            }}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Add files
          </Button>
        )}
      </div>

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
                  />
                )}
                {state !== "submitted" && (
                  <button
                    onClick={() => handleDeleteFile(u.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove this file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasFiles && state !== "editing" && (
        <p className="text-xs text-muted-foreground">No files uploaded yet</p>
      )}
    </div>
  );
}
