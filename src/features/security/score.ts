import type { Finding, Severity } from "./findings.store";

const WEIGHT: Record<Severity, number> = {
  critical: 40,
  high: 20,
  medium: 10,
  low: 4,
  info: 0,
};

export interface SecurityScore {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  open: number;
  critical: number;
  warnings: number;
  resolved: number;
}

export function computeSecurityScore(findings: Finding[]): SecurityScore {
  let deduction = 0;
  let open = 0;
  let critical = 0;
  let warnings = 0;
  let resolved = 0;

  for (const f of findings) {
    if (f.status === "resolved") resolved++;
    else if (f.status === "ignored") continue;
    else {
      open++;
      deduction += WEIGHT[f.severity];
      if (f.severity === "critical") critical++;
      if (f.severity === "high" || f.severity === "medium") warnings++;
    }
  }

  const score = Math.max(0, Math.min(100, 100 - deduction));
  const grade: SecurityScore["grade"] =
    score >= 95 ? "A" : score >= 85 ? "B" : score >= 70 ? "C" : score >= 50 ? "D" : "F";

  return { score, grade, open, critical, warnings, resolved };
}
