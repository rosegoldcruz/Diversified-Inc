import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { HttpError, requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  url: string;
  status: string | null;
  matched_field: string;
};

type TableInfo = {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
};

type SearchConfig = {
  type: string;
  table: string;
  alias: string;
  titleColumns: string[];
  subtitleColumns: string[];
  statusColumn?: string;
  urlPrefix: string;
  extraWhere?: string;
};

const SEARCH_TABLES = [
  "tasks",
  "requests",
  "work_orders",
  "employees",
  "inventory",
  "sops",
  "file_records",
  "documents",
];

const SEARCH_CONFIGS: SearchConfig[] = [
  {
    type: "task",
    table: "tasks",
    alias: "t",
    titleColumns: ["title"],
    subtitleColumns: ["description", "topic", "division"],
    statusColumn: "status",
    urlPrefix: "/tasks/",
  },
  {
    type: "request",
    table: "requests",
    alias: "r",
    titleColumns: ["title", "request_id", "request_number"],
    subtitleColumns: ["category", "requester", "description"],
    statusColumn: "status",
    urlPrefix: "/requests",
  },
  {
    type: "work_order",
    table: "work_orders",
    alias: "w",
    titleColumns: ["title"],
    subtitleColumns: ["description", "type", "division", "notes"],
    statusColumn: "status",
    urlPrefix: "/work-orders/",
  },
  {
    type: "employee",
    table: "employees",
    alias: "e",
    titleColumns: ["name", "email"],
    subtitleColumns: ["department", "role"],
    statusColumn: "status",
    urlPrefix: "/employees/",
  },
  {
    type: "inventory",
    table: "inventory",
    alias: "i",
    titleColumns: ["item_name", "name"],
    subtitleColumns: ["category", "location", "notes"],
    statusColumn: "status",
    urlPrefix: "/inventory/",
  },
  {
    type: "sop",
    table: "sops",
    alias: "s",
    titleColumns: ["title"],
    subtitleColumns: ["description", "category", "department"],
    statusColumn: "status",
    urlPrefix: "/sops/",
  },
  {
    type: "file",
    table: "file_records",
    alias: "f",
    titleColumns: ["original_name", "name"],
    subtitleColumns: ["category", "mime_type", "uploaded_by"],
    urlPrefix: "/files/",
  },
  {
    type: "document",
    table: "documents",
    alias: "d",
    titleColumns: ["title"],
    subtitleColumns: [
      "document_type",
      "entity_type",
      "category",
      "description",
    ],
    statusColumn: "status",
    urlPrefix: "/documents/",
  },
];

export async function GET(request: NextRequest) {
  try {
    requireUser();
    const rawQuery = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const requestedType = request.nextUrl.searchParams.get("type")?.trim();
    const limit = normalizeLimit(request.nextUrl.searchParams.get("limit"));

    if (rawQuery.length < 2) {
      return NextResponse.json({
        results: [],
        query: rawQuery,
        minimumLength: 2,
      });
    }

    const info = await getTableInfo();
    const allowedTypes = new Set(SEARCH_CONFIGS.map((config) => config.type));
    if (requestedType && !allowedTypes.has(requestedType)) {
      return NextResponse.json(
        { error: "Unsupported search type" },
        { status: 400 },
      );
    }

    const perModuleLimit = Math.min(limit, 10);
    const likeQuery = `%${escapeLike(rawQuery)}%`;
    const configs = SEARCH_CONFIGS.filter((config) => {
      return (
        (!requestedType || config.type === requestedType) &&
        info.tables.has(config.table)
      );
    });

    const moduleResults = await Promise.all(
      configs.map((config) =>
        searchModule(info, config, likeQuery, perModuleLimit),
      ),
    );

    const results = moduleResults.flat().slice(0, limit);

    return NextResponse.json({ results, query: rawQuery });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[search.GET]", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function searchModule(
  info: TableInfo,
  config: SearchConfig,
  likeQuery: string,
  limit: number,
): Promise<SearchResult[]> {
  const titleColumn = firstExistingColumn(
    info,
    config.table,
    config.titleColumns,
  );
  if (!titleColumn) return [];

  const searchableColumns = [...config.titleColumns, ...config.subtitleColumns]
    .filter((column, index, all) => all.indexOf(column) === index)
    .filter((column) => has(info, config.table, column));

  if (searchableColumns.length === 0) return [];

  const subtitleExpression = coalesceExpression(
    info,
    config.table,
    config.alias,
    config.subtitleColumns,
  );
  const statusExpression =
    config.statusColumn && has(info, config.table, config.statusColumn)
      ? `${config.alias}.${config.statusColumn}`
      : "NULL::text";
  const where = searchableColumns
    .map((column) => `${config.alias}.${column}::text ILIKE $1 ESCAPE '\\'`)
    .join(" OR ");
  const matchedField = `CASE ${searchableColumns
    .map(
      (column) =>
        `WHEN ${config.alias}.${column}::text ILIKE $1 ESCAPE '\\' THEN '${column}'`,
    )
    .join(" ")} ELSE '${titleColumn}' END`;
  const urlExpression = config.urlPrefix.endsWith("/")
    ? `$3 || ${config.alias}.id::text`
    : "$3";

  return query<SearchResult>(
    `SELECT ${config.alias}.id::text AS id,
            $4::text AS type,
            COALESCE(NULLIF(${config.alias}.${titleColumn}::text, ''), ${config.alias}.id::text) AS title,
            ${subtitleExpression} AS subtitle,
            ${urlExpression} AS url,
            ${statusExpression} AS status,
            ${matchedField} AS matched_field
     FROM ${config.table} ${config.alias}
     WHERE ${where}
     ORDER BY ${config.alias}.id DESC
     LIMIT $2`,
    [likeQuery, limit, config.urlPrefix, config.type],
  );
}

async function getTableInfo(): Promise<TableInfo> {
  const rows = await query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [SEARCH_TABLES],
  );

  const tables = new Set<string>();
  const columns = new Map<string, Set<string>>();

  for (const row of rows) {
    tables.add(row.table_name);
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Set());
    columns.get(row.table_name)?.add(row.column_name);
  }

  return { tables, columns };
}

function has(info: TableInfo, table: string, column: string) {
  return info.columns.get(table)?.has(column) ?? false;
}

function firstExistingColumn(
  info: TableInfo,
  table: string,
  columns: string[],
) {
  return columns.find((column) => has(info, table, column));
}

function coalesceExpression(
  info: TableInfo,
  table: string,
  alias: string,
  columns: string[],
) {
  const expressions = columns
    .filter((column) => has(info, table, column))
    .map((column) => `NULLIF(${alias}.${column}::text, '')`);
  if (expressions.length === 0) return "NULL::text";
  return `COALESCE(${expressions.join(", ")})`;
}

function normalizeLimit(value: string | null) {
  const parsed = Number(value ?? 12);
  if (!Number.isInteger(parsed)) return 12;
  return Math.min(Math.max(parsed, 1), 30);
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
