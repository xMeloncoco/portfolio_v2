-- Check RLS policies on quests table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'quests'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'quests';

-- Test if you can update project_id field
-- (Run this as your admin user)
DO $$
DECLARE
    test_quest_id UUID;
    test_project_id UUID;
BEGIN
    -- Get first quest
    SELECT id INTO test_quest_id FROM public.quests LIMIT 1;

    -- Get first project
    SELECT id INTO test_project_id FROM public.projects LIMIT 1;

    IF test_quest_id IS NULL THEN
        RAISE NOTICE 'No quests found to test';
        RETURN;
    END IF;

    IF test_project_id IS NULL THEN
        RAISE NOTICE 'No projects found to test';
        RETURN;
    END IF;

    -- Try to update
    UPDATE public.quests
    SET project_id = test_project_id
    WHERE id = test_quest_id;

    -- Check if it worked
    IF EXISTS (
        SELECT 1 FROM public.quests
        WHERE id = test_quest_id
        AND project_id = test_project_id
    ) THEN
        RAISE NOTICE 'SUCCESS: Can update project_id field';

        -- Rollback the test change
        UPDATE public.quests
        SET project_id = NULL
        WHERE id = test_quest_id;
    ELSE
        RAISE NOTICE 'FAILED: Cannot update project_id field - might be RLS issue';
    END IF;
END $$;
