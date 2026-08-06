import { IntegrationBlock } from "../types";

export function getFloatingIntegrations(blocks: any[]): IntegrationBlock[] {
  return (blocks ?? []).filter(
    (b) =>
      b.type === "integration" &&
      !b.hidden &&
      (b.mode === "floating" || b.mode === "floatingBubble" || b.mode === "stickyBottom")
  ) as IntegrationBlock[];
}
