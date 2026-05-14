import { hashPassword } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

type EmployeeRow = {
  id: number;
  email: string | null;
};

const DEMO_NAME = "Terry Demo";
const DEMO_EMAIL = "terry.demo@diversified.local";
const DEMO_PASSWORD = "ChangeMe123!";

async function main() {
  await ensureSchema();

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const existing = await query<EmployeeRow>(
    `SELECT id, email
     FROM employees
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [DEMO_EMAIL],
  );

  let rows: EmployeeRow[];
  if (existing[0]) {
    rows = await query<EmployeeRow>(
      `UPDATE employees
       SET name = $1,
           role = 'Leadership',
           status = 'active',
           department = 'Leadership',
           password_hash = $2,
           auth_provider = NULL,
           auth_subject = NULL,
           auth_last_synced_at = NULL
       WHERE id = $3
       RETURNING id, email`,
      [DEMO_NAME, passwordHash, existing[0].id],
    );
  } else {
    rows = await query<EmployeeRow>(
      `INSERT INTO employees
        (name, email, role, status, department, password_hash, auth_provider, auth_subject, auth_last_synced_at, hire_date)
       VALUES
        ($1, $2, 'Leadership', 'active', 'Leadership', $3, NULL, NULL, NULL, CURRENT_DATE)
       RETURNING id, email`,
      [DEMO_NAME, DEMO_EMAIL, passwordHash],
    );
  }

  if (!rows[0]) {
    throw new Error("Failed to create or update demo user.");
  }

  console.log("Demo user ready:");
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    process.exit();
  });
