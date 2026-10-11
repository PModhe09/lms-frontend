import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe } from "@/lib/api/me";

export const metadata: Metadata = { title: "Apply" };

const STEPS = [
  { title: "Personal details", done: ["DETAILS_SUBMITTED", "SLIP_UPLOADED", "APPLIED"] },
  { title: "Salary slip", done: ["SLIP_UPLOADED", "APPLIED"] },
  { title: "Loan amount & apply", done: ["APPLIED"] },
];

export default async function ApplyPage() {
  const me = await fetchMe();
  const stage = me?.onboardingStage ?? "REGISTERED";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Apply for a personal loan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          ₹50,000 – ₹5,00,000 · 30 – 365 days · 12% p.a. simple interest
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title}>
            <Card className={step.done.includes(stage) ? "border-primary/50" : undefined}>
              <CardHeader>
                <CardDescription>Step {i + 1}</CardDescription>
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {step.done.includes(stage) ? "Done" : "Pending"}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
