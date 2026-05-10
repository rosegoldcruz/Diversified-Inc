import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT id, employee_id, employee_name, clock_in, clock_out, total_minutes, notes, created_at
       FROM timeclock_entries
       WHERE clock_out IS NULL
       ORDER BY clock_in ASC`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching active timeclock entries:', error);
    return NextResponse.json({ error: 'Failed to fetch active entries' }, { status: 500 });
  }
}
