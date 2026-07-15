-- BUG-004: Fix Data API grants and harden workspace_members RLS

-- 1) Explicit Data API grants required for PostgREST access.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;

-- 2) Helper functions for safe membership creation without recursive RLS.
CREATE OR REPLACE FUNCTION public.user_owns_workspace(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces
    WHERE id = _workspace_id
      AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_pending_workspace_invitation(
  _user_id uuid,
  _workspace_id uuid,
  _role public.workspace_role,
  _custom_role_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.invitations i
    JOIN auth.users u ON u.id = _user_id
    WHERE i.workspace_id = _workspace_id
      AND lower(i.email) = lower(u.email)
      AND i.status = 'pending'
      AND i.expires_at > now()
      AND (
        i.role = _role::text
        OR (_custom_role_key IS NOT NULL AND i.role = _custom_role_key)
      )
  );
$$;

-- 3) Replace workspace_members policies with non-403, least-privilege rules.
DROP POLICY IF EXISTS "Members can view membership rows" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join as themselves" ON public.workspace_members;
DROP POLICY IF EXISTS "admins update members" ON public.workspace_members;
DROP POLICY IF EXISTS "admins remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can view own workspace membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can create permitted own workspace membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace admins can remove members" ON public.workspace_members;

CREATE POLICY "Users can view own workspace membership"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create permitted own workspace membership"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'active'
  AND (
    (
      role = 'owner'::public.workspace_role
      AND custom_role_key IS NULL
      AND public.user_owns_workspace(auth.uid(), workspace_id)
    )
    OR public.has_pending_workspace_invitation(auth.uid(), workspace_id, role, custom_role_key)
  )
);

CREATE POLICY "Workspace admins can update members"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (public.is_workspace_admin(auth.uid(), workspace_id))
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Workspace admins can remove members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (public.is_workspace_admin(auth.uid(), workspace_id) OR auth.uid() = user_id);