import path from "path";
import { query } from "@/lib/db";
import { ValidationError } from "@/lib/validators";

export async function listFiles() {
  return query(`
    SELECT
      id,
      'F-' || LPAD(id::text, 3, '0') AS file_id,
      COALESCE(original_name, name) AS file_name,
      category AS file_type,
      COALESCE(
        CASE
          WHEN linked_entity_type IS NOT NULL AND linked_entity_id IS NOT NULL
            THEN linked_entity_type || ':' || linked_entity_id::text
          ELSE NULL
        END,
        linked_work_order_id::text,
        linked_request_id::text,
        linked_task_id::text,
        linked_sop_id::text
      ) AS linked_job,
      CASE
        WHEN size_bytes IS NULL THEN NULL
        WHEN size_bytes >= 1048576 THEN ROUND((size_bytes::numeric / 1048576), 1)::text || ' MB'
        WHEN size_bytes >= 1024 THEN ROUND((size_bytes::numeric / 1024), 0)::text || ' KB'
        ELSE size_bytes::text || ' B'
      END AS file_size,
      size_bytes,
      mime_type,
      uploaded_by,
      uploaded_at,
      created_at,
      linked_entity_type,
      linked_entity_id,
      '/api/files/' || id || '/download' AS download_url
    FROM file_records
    ORDER BY COALESCE(created_at, uploaded_at) DESC, id DESC
  `);
}

export async function getFileById(fileId: number) {
  const rows = await query(
    `SELECT
      id,
      'F-' || LPAD(id::text, 3, '0') AS file_id,
      COALESCE(original_name, name) AS file_name,
      stored_name,
      storage_path,
      category AS file_type,
      mime_type,
      size_bytes,
      uploaded_by,
      uploaded_by_user_id,
      uploaded_at,
      created_at,
      linked_entity_type,
      linked_entity_id,
      '/api/files/' || id || '/download' AS download_url
     FROM file_records
     WHERE id = $1
     LIMIT 1`,
    [fileId],
  );

  return rows[0] ?? null;
}

export function getStorageRoot() {
  return path.resolve(
    process.env.FILE_STORAGE_DIR ||
      path.join(process.cwd(), "storage", "uploads"),
  );
}

export function assertInsideStorage(storageRoot: string, targetPath: string) {
  const root = path.resolve(storageRoot);
  const target = path.resolve(targetPath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("Unsafe file path");
  }
}

