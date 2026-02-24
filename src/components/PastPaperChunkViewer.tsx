import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChunkData {
  id: string;
  content: string;
  metadata: Record<string, unknown> | null;
}

interface PastPaperChunkViewerProps {
  uploadId: string;
  uploadLabel: string;
  productId: string | null;
}

export function PastPaperChunkViewer({ uploadId, uploadLabel, productId }: PastPaperChunkViewerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chunks, setChunks] = useState<ChunkData[] | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonEditorValue, setJsonEditorValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      // Query chunks that have this upload_id in metadata (individual chunks)
      const { data: directChunks, error: err1 } = await supabase
        .from("document_chunks")
        .select("id, content, metadata")
        .contains("metadata", { upload_id: uploadId });

      if (err1) throw err1;

      // Also query merged chunks where this upload is a source (QP or MS)
      const { data: mergedQP, error: err2 } = await supabase
        .from("document_chunks")
        .select("id, content, metadata")
        .contains("metadata", { source_qp_upload: uploadId });

      if (err2) throw err2;

      const { data: mergedMS, error: err3 } = await supabase
        .from("document_chunks")
        .select("id, content, metadata")
        .contains("metadata", { source_ms_upload: uploadId });

      if (err3) throw err3;

      // Deduplicate by id
      const allChunks = [...(directChunks || []), ...(mergedQP || []), ...(mergedMS || [])];
      const uniqueMap = new Map<string, ChunkData>();
      for (const c of allChunks) {
        uniqueMap.set(c.id, c as ChunkData);
      }
      setChunks(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error("Failed to fetch chunks:", err);
      toast({ title: "Failed to load chunks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open && !chunks) {
      fetchChunks();
    }
    setOpen(!open);
    setShowJsonEditor(false);
    setJsonError(null);
  };

  const handleOpenJsonEditor = () => {
    if (!chunks) return;
    const contentArray = chunks.map(c => ({
      id: c.id,
      content: c.content,
    }));
    setJsonEditorValue(JSON.stringify(contentArray, null, 2));
    setJsonError(null);
    setShowJsonEditor(true);
  };

  const handleApplyChanges = async () => {
    try {
      const parsed = JSON.parse(jsonEditorValue);
      if (!Array.isArray(parsed)) {
        setJsonError("JSON must be an array");
        return;
      }

      // Validate each entry has id and content
      for (const item of parsed) {
        if (!item.id || typeof item.content !== "string") {
          setJsonError("Each item must have 'id' (string) and 'content' (string)");
          return;
        }
      }

      setSaving(true);
      setJsonError(null);

      // Update each chunk
      for (const item of parsed) {
        const { error } = await supabase
          .from("document_chunks")
          .update({ content: item.content })
          .eq("id", item.id);
        if (error) throw error;
      }

      // Refresh chunks
      await fetchChunks();
      setShowJsonEditor(false);
      toast({ title: "Chunks updated", description: `${parsed.length} chunk(s) saved.` });
    } catch (err) {
      if (err instanceof SyntaxError) {
        setJsonError("Invalid JSON — please fix syntax errors");
      } else {
        const message = err instanceof Error ? err.message : "Failed to save";
        setJsonError(message);
        toast({ title: "Save failed", description: message, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={handleToggle}
        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        title="View extracted chunks"
      >
        <Eye className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleToggle}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
        >
          <EyeOff className="h-3 w-3" /> Hide
        </button>
        {chunks && chunks.length > 0 && !showJsonEditor && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[10px] h-5 px-1.5"
            onClick={handleOpenJsonEditor}
          >
            Edit JSON
          </Button>
        )}
        {showJsonEditor && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[10px] h-5 px-1.5"
            onClick={() => setShowJsonEditor(false)}
          >
            List view
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-1.5 py-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Loading chunks...</span>
        </div>
      )}

      {chunks && chunks.length === 0 && !loading && (
        <p className="text-[10px] text-muted-foreground">No chunks found for this file.</p>
      )}

      {chunks && chunks.length > 0 && !loading && (
        <div className="border border-border rounded bg-muted/20">
          <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted/50 rounded-t">
            <span className="text-[10px] font-medium">{uploadLabel} — {chunks.length} chunks</span>
          </div>

          {showJsonEditor ? (
            <div className="p-2 space-y-2">
              <textarea
                className="w-full min-h-[200px] max-h-[400px] text-[11px] font-mono p-2 rounded border border-border bg-background text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                value={jsonEditorValue}
                onChange={e => {
                  setJsonEditorValue(e.target.value);
                  setJsonError(null);
                }}
              />
              {jsonError && (
                <p className="text-[10px] text-destructive">{jsonError}</p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-[10px] h-6"
                onClick={handleApplyChanges}
                disabled={saving}
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Apply changes
              </Button>
            </div>
          ) : (
            <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
              {chunks.map((chunk, i) => (
                <div key={chunk.id} className="text-[11px] text-muted-foreground px-2 py-1.5 rounded bg-muted/30">
                  <span className="font-medium text-foreground text-[10px]">Chunk {i + 1}</span>
                  <p className="mt-0.5 whitespace-pre-wrap line-clamp-4">{chunk.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
