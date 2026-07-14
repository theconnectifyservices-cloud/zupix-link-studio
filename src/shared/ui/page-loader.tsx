import { Spinner } from "./spinner";

export function PageLoader({ label = "Loading page" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
