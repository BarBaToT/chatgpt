import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Bot,
  Bug,
  CreditCard,
  Cpu,
  Laptop,
  Lock,
  Mail,
  Pill,
  Satellite,
  Server,
  Wifi,
} from "lucide-react";

export type ActionVisual = {
  icon: LucideIcon;
  tag: string;
  accent: "cyan" | "emerald" | "amber" | "rose" | "fuchsia";
};

const ACTION_VISUALS: Record<string, ActionVisual> = {
  "skim-atm": { icon: CreditCard, tag: "STREET", accent: "cyan" },
  "phish-corp-grunt": { icon: Mail, tag: "STREET", accent: "cyan" },
  "ddos-rival-crew": { icon: Wifi, tag: "CORPORATE", accent: "emerald" },
  "hack-corp-server": { icon: Server, tag: "CORPORATE", accent: "emerald" },
  "drain-cred-stick": { icon: Banknote, tag: "MILITARY", accent: "amber" },
  "crack-ice-mainframe": { icon: Lock, tag: "MEGACORP", accent: "rose" },
  "loot-orbital-data-vault": { icon: Satellite, tag: "ORBITAL", accent: "fuchsia" },
};

const ACTION_FALLBACK: ActionVisual = {
  icon: Server,
  tag: "STREET",
  accent: "cyan",
};

export function getActionVisual(slug: string): ActionVisual {
  return ACTION_VISUALS[slug] ?? ACTION_FALLBACK;
}

export type ShopVisual = {
  icon: LucideIcon;
  tier: string;
};

const SHOP_VISUALS: Record<string, ShopVisual> = {
  "stim-small": { icon: Pill, tier: "S" },
  "stim-medium": { icon: Pill, tier: "M" },
  "stim-large": { icon: Pill, tier: "XL" },
  "hardware-rig-upgrade": { icon: Cpu, tier: "MK1" },
  "hardware-cyberdeck": { icon: Laptop, tier: "MK2" },
  "software-exploit-pack": { icon: Bug, tier: "v1" },
  "software-ai-daemon": { icon: Bot, tier: "v2" },
};

const SHOP_FALLBACK: ShopVisual = { icon: Pill, tier: "?" };

export function getShopVisual(slug: string): ShopVisual {
  return SHOP_VISUALS[slug] ?? SHOP_FALLBACK;
}

export const ACCENT_CLASSES = {
  cyan: {
    grad: "from-cyan-500/30 via-cyan-500/10 to-transparent",
    text: "text-cyan-300",
    border: "border-cyan-500/40",
    hoverBorder: "hover:border-cyan-400/80",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]",
    glow: "drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]",
  },
  emerald: {
    grad: "from-emerald-500/30 via-emerald-500/10 to-transparent",
    text: "text-emerald-300",
    border: "border-emerald-500/40",
    hoverBorder: "hover:border-emerald-400/80",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]",
    glow: "drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]",
  },
  amber: {
    grad: "from-amber-500/30 via-amber-500/10 to-transparent",
    text: "text-amber-300",
    border: "border-amber-500/40",
    hoverBorder: "hover:border-amber-400/80",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.35)]",
    glow: "drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]",
  },
  rose: {
    grad: "from-rose-500/30 via-rose-500/10 to-transparent",
    text: "text-rose-300",
    border: "border-rose-500/40",
    hoverBorder: "hover:border-rose-400/80",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(244,63,94,0.35)]",
    glow: "drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]",
  },
  fuchsia: {
    grad: "from-fuchsia-500/30 via-fuchsia-500/10 to-transparent",
    text: "text-fuchsia-300",
    border: "border-fuchsia-500/40",
    hoverBorder: "hover:border-fuchsia-400/80",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(217,70,239,0.35)]",
    glow: "drop-shadow-[0_0_12px_rgba(217,70,239,0.6)]",
  },
} as const;

export type AccentKey = keyof typeof ACCENT_CLASSES;
