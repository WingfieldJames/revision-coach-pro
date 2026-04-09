import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function EmailPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weeklyRecap, setWeeklyRecap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data, error } = await (supabase as any)
        .from("email_preferences")
        .select("weekly_recap")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setWeeklyRecap(data.weekly_recap);
      }
      // If no row exists, default stays true
      setLoading(false);
    };

    load();

    // Handle unsubscribe query param
    const params = new URLSearchParams(window.location.search);
    if (params.get("unsubscribe") === "true") {
      handleToggle(false);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("unsubscribe");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user]);

  const handleToggle = async (checked: boolean) => {
    if (!user) return;
    setSaving(true);
    setWeeklyRecap(checked);

    const { error } = await (supabase as any)
      .from("email_preferences")
      .upsert(
        {
          user_id: user.id,
          weekly_recap: checked,
          unsubscribed_at: checked ? null : new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setSaving(false);

    if (error) {
      setWeeklyRecap(!checked);
      toast({
        title: "Error",
        description: "Failed to update email preferences. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: checked ? "Weekly recap enabled" : "Weekly recap disabled",
        description: checked
          ? "You'll receive a weekly summary every Monday."
          : "You won't receive weekly summary emails.",
      });
    }
  };

  if (!user || loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Email Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Weekly Progress Recap</p>
            <p className="text-sm text-muted-foreground">
              Get a weekly summary of your study activity every Monday
            </p>
          </div>
          <Switch
            checked={weeklyRecap}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
