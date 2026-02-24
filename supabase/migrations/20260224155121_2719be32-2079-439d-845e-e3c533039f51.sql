CREATE POLICY "Trainers can update document chunks"
ON public.document_chunks
FOR UPDATE
USING (
  has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);