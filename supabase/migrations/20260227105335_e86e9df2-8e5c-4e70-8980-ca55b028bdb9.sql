CREATE POLICY "Anyone can view deployed trainer projects"
ON public.trainer_projects
FOR SELECT
USING (status = 'deployed');