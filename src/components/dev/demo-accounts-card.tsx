import { demoAccounts } from "@/lib/dev/demo-accounts";

type DemoAccountsCardProps = {
  labels: {
    title: string;
    description: string;
    role: string;
    hidden: string;
  };
};

export function DemoAccountsCard({ labels }: DemoAccountsCardProps) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <div className="space-y-2">
        <h2 className="font-semibold text-amber-950">{labels.title}</h2>
        <p className="text-sm leading-6 text-amber-900">{labels.description}</p>
      </div>

      <div className="mt-4 space-y-3">
        {demoAccounts.map((account) => (
          <div
            key={account.email}
            className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm"
          >
            <p className="font-medium text-foreground">{account.label}</p>
            <p className="text-muted-foreground">{account.email}</p>
            <p className="text-xs uppercase tracking-[0.14em] text-amber-900">
              {labels.role}: {account.role}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{labels.hidden}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
