import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACTIONS = [
  {
    slug: "skim-atm",
    targetName: "Skim ATM",
    description:
      "Slap a skimmer on a backstreet ATM. Easy creds, low rep, almost no software needed.",
    energyCost: 8,
    requiredSoftwareReq: 1,
    successRateBase: 80,
    rewardCredsMin: 40,
    rewardCredsMax: 90,
    rewardRep: 1,
    lockoutMinutes: 2,
  },
  {
    slug: "phish-corp-grunt",
    targetName: "Phish a Corpo Grunt",
    description:
      "Spear-phish a mid-tier salaryman. Low risk, decent payout, builds rep fast.",
    energyCost: 12,
    requiredSoftwareReq: 1,
    successRateBase: 70,
    rewardCredsMin: 80,
    rewardCredsMax: 160,
    rewardRep: 2,
    lockoutMinutes: 3,
  },
  {
    slug: "ddos-rival-crew",
    targetName: "DDoS Rival Crew",
    description:
      "Drop a rival crew off the net. Bandwidth-heavy. Pays in rep more than creds.",
    energyCost: 22,
    requiredSoftwareReq: 2,
    successRateBase: 65,
    rewardCredsMin: 90,
    rewardCredsMax: 220,
    rewardRep: 4,
    lockoutMinutes: 5,
  },
  {
    slug: "hack-corp-server",
    targetName: "Hack Corporate Server",
    description:
      "Crack a midmarket corp's intranet and exfiltrate financials. Solid loot.",
    energyCost: 30,
    requiredSoftwareReq: 3,
    successRateBase: 55,
    rewardCredsMin: 250,
    rewardCredsMax: 600,
    rewardRep: 6,
    lockoutMinutes: 8,
  },
  {
    slug: "drain-cred-stick",
    targetName: "Drain Cred-Stick",
    description:
      "Bleed a fixer's cold wallet on neutral ground. Fast money — and fast tracers.",
    energyCost: 18,
    requiredSoftwareReq: 4,
    successRateBase: 50,
    rewardCredsMin: 400,
    rewardCredsMax: 800,
    rewardRep: 5,
    lockoutMinutes: 10,
  },
  {
    slug: "crack-ice-mainframe",
    targetName: "Crack ICE Mainframe",
    description:
      "Punch through black ICE on a megacorp mainframe. Top-tier risk, top-tier rep.",
    energyCost: 45,
    requiredSoftwareReq: 5,
    successRateBase: 35,
    rewardCredsMin: 900,
    rewardCredsMax: 1800,
    rewardRep: 12,
    lockoutMinutes: 15,
  },
  {
    slug: "loot-orbital-data-vault",
    targetName: "Loot Orbital Data Vault",
    description:
      "Reach an off-world data vault. End-game heist. Gets you traced fast on a fail.",
    energyCost: 70,
    requiredSoftwareReq: 7,
    successRateBase: 25,
    rewardCredsMin: 2200,
    rewardCredsMax: 5000,
    rewardRep: 25,
    lockoutMinutes: 30,
  },
] as const;

const SHOP_ITEMS = [
  {
    slug: "stim-small",
    name: "Cyber-Stim S",
    description: "Cheap street stim. Restores +20 bandwidth.",
    category: "STIM",
    cost: 60,
    bandwidthRestore: 20,
  },
  {
    slug: "stim-medium",
    name: "Cyber-Stim M",
    description: "Quality dose. Restores +50 bandwidth.",
    category: "STIM",
    cost: 140,
    bandwidthRestore: 50,
  },
  {
    slug: "stim-large",
    name: "Cyber-Stim XL",
    description: "Boutique pharma. Fully refills bandwidth (+100).",
    category: "STIM",
    cost: 280,
    bandwidthRestore: 100,
  },
  {
    slug: "hardware-rig-upgrade",
    name: "Rig Upgrade",
    description: "Tighter cooling, faster bus. +1 hardware level.",
    category: "HARDWARE",
    cost: 750,
    hardwareDelta: 1,
  },
  {
    slug: "hardware-cyberdeck",
    name: "Custom Cyberdeck",
    description: "Hand-built deck. +2 hardware levels.",
    category: "HARDWARE",
    cost: 2200,
    hardwareDelta: 2,
  },
  {
    slug: "software-exploit-pack",
    name: "Exploit Pack",
    description: "Fresh 0-days from a fixer. +1 software level.",
    category: "SOFTWARE",
    cost: 800,
    softwareDelta: 1,
  },
  {
    slug: "software-ai-daemon",
    name: "AI Co-pilot Daemon",
    description: "Autonomous attack daemon. +2 software levels.",
    category: "SOFTWARE",
    cost: 2600,
    softwareDelta: 2,
  },
] as const;

async function main() {
  console.log("Seeding actions…");
  for (const action of ACTIONS) {
    await prisma.action.upsert({
      where: { slug: action.slug },
      create: action,
      update: action,
    });
  }

  console.log("Seeding shop items…");
  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { slug: item.slug },
      create: item,
      update: item,
    });
  }

  const counts = await Promise.all([
    prisma.action.count(),
    prisma.shopItem.count(),
  ]);
  console.log(`Done. Actions: ${counts[0]}, ShopItems: ${counts[1]}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
