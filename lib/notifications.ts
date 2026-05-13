import { query } from "./db";
import { Role } from "./auth";

export type CreateNotificationInput = {
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  /** Direct recipients by employee id. */
  userIds?: number[];
  /** OR fan-out: every active employee whose role is in this list (uses role hierarchy). */
  audienceRoles?: Role[];
  /** Exclude this user from receiving the notification (e.g. the actor). */
  excludeUserId?: number;
};

/**
 * Insert one notification per recipient. Failures are logged but do not throw,
 * so notification side-effects can never break the primary mutation.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  try {
    const recipients = new Set<number>();
    if (input.userIds) {
      input.userIds.forEach((id) => {
        if (Number.isInteger(id) && id > 0 && id !== input.excludeUserId) {
          recipients.add(id);
        }
      });
    }

    if (input.audienceRoles && input.audienceRoles.length > 0) {
      const rows = await query<{ id: number }>(
        `SELECT id FROM employees
         WHERE status = 'active'
           AND role = ANY($1::text[])`,
        [input.audienceRoles],
      );
      rows.forEach((row) => {
        if (row.id !== input.excludeUserId) recipients.add(row.id);
      });
    }

    if (recipients.size === 0) return;

    const ids = Array.from(recipients);
    await query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       SELECT unnest($1::int[]), $2, $3, $4, $5`,
      [ids, input.type, input.title, input.body ?? null, input.link ?? null],
    );
  } catch (error) {
    console.error("[notifications.create]", error);
  }
}
