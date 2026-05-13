import { Badge } from "@/components/ui/Badge";
import { ShinyText } from "@/components/ui/ShinyText";

export default function BillingPage() {
  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-textPrimary">
          <ShinyText>Billing</ShinyText>
        </h1>
        <p className="text-sm text-textSecondary">
          Billing controls are internal-only and not wired to a production
          billing provider in this repository.
        </p>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Badge variant="warning">Internal Only</Badge>
          <Badge variant="default">Coming Later</Badge>
        </div>
        <p className="mt-3 text-sm text-textSecondary">
          Stripe checkout, invoice management, and subscription controls were
          removed from this route because they were pointing to external API
          assumptions not implemented in the current stack.
        </p>
        <p className="mt-2 text-sm text-textSecondary">
          If billing is needed later, add server-side billing APIs in this repo
          first, then re-enable actionable controls.
        </p>
      </section>
    </div>
  );
}
