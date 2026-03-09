-- Schedule daily feedback email job at midnight UTC
SELECT cron.schedule(
  'send-feedback-emails-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xoipyycgycmpflfnrlty.supabase.co/functions/v1/send-feedback-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaXB5eWNneWNtcGZsZm5ybHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzkzMjUsImV4cCI6MjA2OTM1NTMyNX0.pU8Ej1aAvGoAQ6CuVZwvcCvWBxSGo61X16cfQxW7_bI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);