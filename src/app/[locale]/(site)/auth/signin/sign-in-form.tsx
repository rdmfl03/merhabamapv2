import { signInWithEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignInFormProps = {
  locale: string;
  next?: string;
  labels: {
    email: string;
    password: string;
    submit: string;
  };
};

export function SignInForm({ locale, next, labels }: SignInFormProps) {
  return (
    <form
      action={signInWithEmail}
      noValidate
      className="space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? `/${locale}`} />
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.email}</span>
        <Input type="email" name="email" autoComplete="email" inputMode="email" />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-foreground">{labels.password}</span>
        <Input type="password" name="password" autoComplete="current-password" />
      </label>
      <Button className="w-full" type="submit">
        {labels.submit}
      </Button>
    </form>
  );
}
