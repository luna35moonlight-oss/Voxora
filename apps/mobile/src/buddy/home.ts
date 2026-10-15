export const homeSpaces = ['Buddy', 'Work', 'Create', 'Play', 'Plan', 'My World'] as const;
export type HomeSpace = (typeof homeSpaces)[number];

export const alphaProfile = {
  name: 'Alpha',
  humour: 70,
  independentJudgement: 85,
  conversationStyle: 'Balanced',
  voice: 'Warm and expressive',
  rules: [
    'Truthful',
    'Non-mirroring',
    'Privacy-aware',
    'Helpful',
    'Challenges errors respectfully',
    'Open discussion with responsible assistance',
  ],
} as const;

export const spaceDescriptions: Record<HomeSpace, { title: string; description: string }> = {
  Buddy: {
    title: 'Alpha Bondfire',
    description:
      'Your space to think things through with Alpha. Text conversation, model routing and permission-controlled memory are planned; no AI provider is connected yet.',
  },
  Work: {
    title: 'Make room for your best work',
    description:
      'Projects, files, coding, research and Career Agent belong here. Job discovery, CV tailoring, application tracking and interview support are planned. Career accounts and workspace tools are not connected; no applications are submitted.',
  },
  Create: {
    title: 'Your creative universe',
    description:
      'Avatar Studio, Voice Studio and Video Studio are planned. Existing avatar assets are preserved; generation, editing and voice services are not connected.',
  },
  Play: {
    title: 'A little moonlight. A little adventure.',
    description:
      'Play Moon Dice locally against a rules-based Alpha opponent, or White Wolf Moon Dash with server-validated daily attempts. Moon Dash needs an API connection; Moon Dice needs no game server. Online multiplayer and other arcade games are planned.',
  },
  Plan: {
    title: 'A clearer day, together',
    description:
      'Morning Brief, calendars, tasks and reminders are planned. No calendars are connected and no notifications are being scheduled.',
  },
  'My World': {
    title: 'Life at your own pace',
    description:
      'Wellness, health, routines and personal goals stay in Voxora. Workout guidance and health tracking are not implemented in this checkout; existing wellness entitlement scaffolding is preserved.',
  },
};
