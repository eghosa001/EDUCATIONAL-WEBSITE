-- Keep source-controlled migrations aligned with the verified production RLS state.
-- This migration is idempotent and intentionally exposes only active curriculum
-- metadata to public readers while preserving broader visibility for content admins.

-- Authenticated RLS policies depend on this SECURITY DEFINER helper.
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM anon;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS roles_select_assigned ON public.roles;
CREATE POLICY roles_select_assigned
ON public.roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.role_id = roles.id
      AND ur.user_id = (SELECT auth.uid())
  )
);

-- Catalog tables are required by anonymous/student curriculum selectors.
-- Public readers get active rows only; content admins and super admins can also
-- inspect inactive rows for management.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'education_systems', 'education_levels', 'programs', 'classes',
    'terms', 'subjects', 'topics', 'subtopics'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_public_read ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_public_read ON public.%I FOR SELECT TO public USING (is_active = true)',
      t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I_admin_read ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_admin_read ON public.%I FOR SELECT TO authenticated USING (public.has_role(''super_admin'') OR public.has_role(''content_admin''))',
      t, t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS class_subjects_public_read ON public.class_subjects;
CREATE POLICY class_subjects_public_read
ON public.class_subjects
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS class_subjects_admin_read ON public.class_subjects;
CREATE POLICY class_subjects_admin_read
ON public.class_subjects
FOR SELECT
TO authenticated
USING (public.has_role('super_admin') OR public.has_role('content_admin'));
