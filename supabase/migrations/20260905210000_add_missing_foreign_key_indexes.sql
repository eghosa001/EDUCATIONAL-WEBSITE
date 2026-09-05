-- Add covering indexes for foreign-key columns that do not already have one.
-- This improves join/delete/update performance without changing query semantics.
DO $$
DECLARE
  fk record;
  index_name text;
  column_list text;
  index_exists boolean;
BEGIN
  FOR fk IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      con.conname AS constraint_name,
      array_agg(a.attname ORDER BY k.ordinality) AS columns
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
    GROUP BY n.nspname, c.relname, con.conname
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM pg_index i
      WHERE i.indrelid = format('%I.%I', fk.schema_name, fk.table_name)::regclass
        AND i.indisvalid
        AND i.indisready
        AND i.indkey::smallint[] @> (
          SELECT array_agg(a.attnum::smallint ORDER BY x.ord)
          FROM unnest(fk.columns) WITH ORDINALITY x(column_name, ord)
          JOIN pg_attribute a
            ON a.attrelid = format('%I.%I', fk.schema_name, fk.table_name)::regclass
           AND a.attname = x.column_name
        )
    ) INTO index_exists;

    IF NOT index_exists THEN
      column_list := (
        SELECT string_agg(format('%I', column_name), ', ' ORDER BY ord)
        FROM unnest(fk.columns) WITH ORDINALITY AS x(column_name, ord)
      );
      index_name := left('idx_fk_' || md5(fk.schema_name || '.' || fk.table_name || '.' || fk.constraint_name), 63);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)', index_name, fk.schema_name, fk.table_name, column_list);
    END IF;
  END LOOP;
END $$;
