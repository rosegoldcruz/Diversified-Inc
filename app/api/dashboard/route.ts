import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type DashboardStats = {
  total_tasks: number;
  open_work_orders: number;
  low_stock_items: number;
  total_employees: number;
  high_priority_tasks: number;
  blocked_tasks: number;
};

export async function GET() {
  try {
    const [totalTasks] = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM tasks");
    const [openWorkOrders] = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM work_orders WHERE LOWER(COALESCE(status, '')) NOT IN ('completed', 'cancelled', 'canceled')",
    );
    const [lowStockItems] = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM inventory WHERE LOWER(COALESCE(status, '')) = 'low_stock' OR quantity <= reorder_threshold",
    );
    const [totalEmployees] = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM employees");
    const [highPriorityTasks] = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM tasks WHERE LOWER(COALESCE(priority, '')) = 'high'",
    );
    const [blockedTasks] = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM tasks WHERE LOWER(COALESCE(status, '')) = 'blocked'",
    );

    const payload: DashboardStats = {
      total_tasks: Number(totalTasks?.count ?? 0),
      open_work_orders: Number(openWorkOrders?.count ?? 0),
      low_stock_items: Number(lowStockItems?.count ?? 0),
      total_employees: Number(totalEmployees?.count ?? 0),
      high_priority_tasks: Number(highPriorityTasks?.count ?? 0),
      blocked_tasks: Number(blockedTasks?.count ?? 0),
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}