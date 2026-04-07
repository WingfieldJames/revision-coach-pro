-- Daily metrics snapshots for tracking improvement over time
CREATE TABLE public.metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date)
);
ALTER TABLE public.metrics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.metrics_snapshots FOR ALL USING (true) WITH CHECK (true);

-- Change log: record what changed and when, so you can correlate with metric shifts
CREATE TABLE public.change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.change_log FOR ALL USING (true) WITH CHECK (true);
