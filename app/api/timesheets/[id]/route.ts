import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, approved_by } = await req.json();
    const { id } = params;

    const updateSet: string[] = ['status = $1'];
    const values: (string | number)[] = [status];
    let paramIndex = 2;

    if (status === 'submitted') {
      updateSet.push(`submitted_at = NOW()`);
    }

    if (approved_by) {
      updateSet.push(`approved_by = $${paramIndex}`);
      values.push(approved_by);
      paramIndex++;
    }

    const result = await query(
      `UPDATE timesheets
       SET ${updateSet.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      [...values, parseInt(id, 10)]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json({ error: 'Failed to update timesheet' }, { status: 500 });
  }
}
