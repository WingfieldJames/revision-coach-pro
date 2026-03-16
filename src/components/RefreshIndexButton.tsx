import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface RefreshIndexButtonProps {
  productId: string | null;
  onComplete?: () => void;
}

export function RefreshIndexButton({ productId, onComplete }: RefreshIndexButtonProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [done, setDone] = useState(false);

  const handleRefresh = async () => {
    if (!productId) {
      toast({ title: "No product deployed", description: "Deploy the subject first before refreshing the index.", variant: "destructive" });
      return;
    }

    setRefreshing(true);
    setDone(false);

    try {
      const { data, error } = await supabase.functions.invoke("backfill-training-data", {
        body: { product_id: productId },
      });

      if (error) throw error;

      toast({
        title: "Index refreshed ✓",
        description: data?.message || `Training data has been re-indexed. ${data?.chunks_updated || 0} chunks updated with embeddings.`,
      });
      setDone(true);
      onComplete?.();

      // Reset done state after 3 seconds
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Refresh index failed:", err);
      toast({
        title: "Refresh failed",
        description: err instanceof Error ? err.message : "Failed to refresh index. Check edge function logs.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full text-xs"
      onClick={handleRefresh}
      disabled={refreshing}
    >
      {refreshing ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Re-indexing training data...
        </>
      ) : done ? (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
          Index Refreshed ✓
        </>
      ) : (
        <>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Index (re-embed all chunks)
        </>
      )}
    </Button>
  );
}
