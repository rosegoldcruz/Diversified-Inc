import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT id, employee_id, employee_name, week_start, week_end,
              monday_hours, tuesday_hours, wednesday_hours, thursday_hours,
              friday_hours, saturday_hours, sunday_hours, total_hours,
              status, submitted_at, approved_by, notes, created_at
       FROM timesheets
       ORDER BY week_start DESC`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      employee_name,
      week_start,
      week_end,
      monday_hours,
      tuesday_hours,
      wednesday_hours,
      thursday_hours,
      friday_hours,
      saturday_hours,
      sunday_hours,
      notes,
    } = await req.json();

    const result = await query(
      `INSERT INTO timesheets
       (employee_name, week_start, week_end, monday_hours, tuesday_hours, wednesday_hours,
        thursday_hours, friday_hours, saturday_hours, sunday_hours, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', $11)
       RETURNING *`,
      [
        employee_name,
        week_start,
        week_end,
        monday_hours,
        tuesday_hours,
        wednesday_hours,
        thursday_hours,
        friday_hours,
        saturday_hours,
        sunday_hours,
        notes,
      ]
    );
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: 'Failed to create timesheet' }, { status: 500 });
  }
}
