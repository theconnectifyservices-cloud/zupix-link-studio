-- BUG-004 follow-up: owner read path for newly created workspaces and narrow grants.

-- Workspaces: owners can read their own workspace; members can read workspaces they belong to.
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners and members can view their workspaces" ON public.workspaces;

CREATE POLICY "Owners and members can view their workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id OR public.is_workspace_member(auth.uid(), id));

-- Remove broad historical grants, then re-grant only Data API operations the app needs.
REVOKE ALL PRIVILEGES ON public.workspace_members FROM authenticated;
REVOKE ALL PRIVILEGES ON public.workspaces FROM authenticated;
REVOKE ALL PRIVILEGES ON public.profiles FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Reassert service role full backend access.
GRANT ALL ON public.workspace_members TO service_role;
GRANT ALL ON public.workspaces TO service_role;
GRANT ALL ON public.profiles TO service_role;