export default function EmployeesPage() {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
      <h1 className="text-xl font-semibold text-textPrimary md:text-2xl">Employees</h1>
      <p className="max-w-2xl text-sm text-textSecondary">
        Employee visibility, assignments, and workload overview will live in this workspace module.
      </p>
      <div className="glass-panel flex items-center justify-center border-2 border-dashed border-borderSubtle/80 py-10 text-sm text-textSecondary">
        <span>Module shell ready. Connect team and role data here.</span>
      </div>
    </div>
  );
}
