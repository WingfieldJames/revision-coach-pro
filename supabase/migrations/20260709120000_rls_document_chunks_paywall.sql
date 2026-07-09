-- Loop 2.1 — Close the document_chunks paywall bypass.
--
-- BEFORE: the only SELECT policy (20260115114606) was
--   FOR SELECT TO authenticated USING (true)
-- so any authenticated (even free-tier) account could hand-craft a query for a
-- paid subject's product_id and read its raw past-paper / mark-scheme content.
--
-- AFTER: non-staff authenticated users may read ONLY `specification` chunks
--   (the public exam-board spec — already the free funnel shown on /free pages
--    via DynamicPastPaperFinder / DynamicRevisionGuide). Trainers/admins keep
--   full read (BuildPage tooling is role-gated). All paid content
--   (past_paper, mark_scheme, combined, model_answer, exam_technique,
--    system_prompt, and untyped/general) is no longer client-readable — it is
--   only ever served to students through rag-chat, which uses the service-role
--   client and bypasses RLS. So retrieval is unaffected.
--
-- NOTE: this deliberately avoids replicating entitlement logic (user_subscriptions
-- / school_licenses / grace window) in SQL — that lives in productAccess.ts and
-- must not be duplicated. The split is by content sensitivity, not by per-user
-- entitlement: the spec is public; everything paid flows via the service role.
--
-- Behaviour change to be aware of: useReactiveThinking builds a topic pool from a
-- metadata-only read of ALL of a product's chunks. Post-policy, on non-staff
-- sessions that read now returns only `specification` rows, so the pool is spec-
-- scoped. Non-breaking (smaller pool, no error); it also aligns with Loop 5.1's
-- unified-metadata retag.

DROP POLICY IF EXISTS "Authenticated users can read document chunks" ON public.document_chunks;

CREATE POLICY "Read specification chunks; staff read all"
ON public.document_chunks
FOR SELECT
TO authenticated
USING (
  (metadata->>'content_type') = 'specification'
  OR public.has_role(auth.uid(), 'trainer')
  OR public.has_role(auth.uid(), 'admin')
);
