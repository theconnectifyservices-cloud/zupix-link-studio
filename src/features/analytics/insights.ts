/**
 * Data-driven Insight Cards.
 * Rule-based; never speculative. Each generator returns null when data is
 * insufficient so the UI can filter them out.
 */
import type { EventRow, SessionRow } from "./api";
import {
  blockPerformance,
  buttonPerformance,
  computeEngagement,
  deviceBehaviour,
  referrerInsights,
} from "./intelligence";

export type InsightTone = "positive" | "neutral" | "warning";

export interface InsightCard {
  id: string;
  title: string;
  detail: string;
  tone: InsightTone;
  icon: "trophy" | "trend" | "warn" | "info" | "spark";
}

export function generateInsights(events: EventRow[], sessions: SessionRow[]): InsightCard[] {
  const cards: InsightCard[] = [];
  if (sessions.length === 0 && events.length === 0) return cards;

  // 1. Dominant button
  const buttons = buttonPerformance(events);
  const totalClicks = buttons.reduce((a, b) => a + b.clicks, 0);
  if (buttons[0] && totalClicks >= 5) {
    const share = (buttons[0].clicks / totalClicks) * 100;
    if (share >= 30) {
      cards.push({
        id: "top-button",
        title: `${buttons[0].host || buttons[0].label} drives ${share.toFixed(0)}% of clicks`,
        detail: `${buttons[0].clicks.toLocaleString()} of ${totalClicks.toLocaleString()} total clicks land on this destination.`,
        tone: "positive",
        icon: "trophy",
      });
    }
  }

  // 2. Best device engagement
  const devices = deviceBehaviour(sessions);
  if (devices.length >= 2) {
    const sorted = [...devices].sort((a, b) => b.avgEngagement - a.avgEngagement);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.avgEngagement > 0 && worst.avgEngagement > 0) {
      const delta = ((best.avgEngagement - worst.avgEngagement) / Math.max(worst.avgEngagement, 1)) * 100;
      if (delta >= 20) {
        cards.push({
          id: "device-engage",
          title: `${cap(best.device)} users engage ${delta.toFixed(0)}% more`,
          detail: `Engagement score ${best.avgEngagement.toFixed(0)} on ${best.device} vs ${worst.avgEngagement.toFixed(0)} on ${worst.device}.`,
          tone: "positive",
          icon: "spark",
        });
      }
    }
  }

  // 3. Best referrer
  const refs = referrerInsights(events, sessions);
  const bestRef = [...refs].filter((r) => r.sessions >= 5).sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  if (bestRef && bestRef.source !== "direct") {
    cards.push({
      id: "top-referrer",
      title: `Visitors from ${cap(bestRef.source)} stay most engaged`,
      detail: `${bestRef.sessions} sessions from ${bestRef.source} with average engagement ${bestRef.avgEngagement.toFixed(0)}/100.`,
      tone: "positive",
      icon: "trend",
    });
  }

  // 4. High bounce warning
  const eng = computeEngagement(sessions);
  if (sessions.length >= 20 && eng.bounceRate >= 70) {
    cards.push({
      id: "bounce-warn",
      title: `${eng.bounceRate.toFixed(0)}% of visitors bounce`,
      detail: "Consider stronger CTAs above the fold or a more compelling profile intro.",
      tone: "warning",
      icon: "warn",
    });
  }

  // 5. Great engagement
  if (sessions.length >= 20 && eng.engagementScore >= 60) {
    cards.push({
      id: "eng-strong",
      title: `Engagement score is ${eng.engagementScore.toFixed(0)}/100`,
      detail: "Visitors scroll deeper and click more than the typical bio page.",
      tone: "positive",
      icon: "spark",
    });
  }

  // 6. Return visitor pattern
  if (sessions.length >= 20 && eng.returnVisitorRate >= 30) {
    cards.push({
      id: "returning",
      title: `${eng.returnVisitorRate.toFixed(0)}% are returning visitors`,
      detail: "A healthy loyalty signal — showcase new content for repeat traffic.",
      tone: "positive",
      icon: "trend",
    });
  }

  // 7. Best block type
  const blocks = blockPerformance(events);
  const topBlock = blocks[0];
  if (topBlock && topBlock.clicks >= 5) {
    cards.push({
      id: "top-block",
      title: `${cap(topBlock.blockType)} blocks convert best`,
      detail: `${topBlock.clicks.toLocaleString()} clicks across ${topBlock.uniqueVisitors} unique visitors (CTR ${topBlock.ctr.toFixed(1)}%).`,
      tone: "neutral",
      icon: "trophy",
    });
  }

  // 8. Low scroll depth
  if (sessions.length >= 20 && eng.avgScrollDepth < 30) {
    cards.push({
      id: "scroll-low",
      title: `Average scroll only ${eng.avgScrollDepth.toFixed(0)}%`,
      detail: "Most visitors miss content below the fold. Move key CTAs higher.",
      tone: "warning",
      icon: "warn",
    });
  }

  // 9. Weakest button
  if (buttons.length >= 4) {
    const weak = buttons[buttons.length - 1];
    if (weak.clicks <= 1) {
      cards.push({
        id: "weak-btn",
        title: `${weak.host || weak.label} rarely gets clicked`,
        detail: `Only ${weak.clicks} click${weak.clicks === 1 ? "" : "s"} in this period — reposition, relabel, or remove.`,
        tone: "warning",
        icon: "info",
      });
    }
  }

  return cards;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
