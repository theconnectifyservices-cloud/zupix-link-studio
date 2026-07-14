import { Spinner } from "./spinner";

export function ButtonLoader({ label = "Working" }: { label?: string }) {
  return <Spinner size="sm" label={label} className="text-current" />;
}
