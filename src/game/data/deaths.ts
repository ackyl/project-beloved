// The Death Board: a hand-written registry. Each death has a trigger predicate
// over a DeathEvent. The first matching entry wins, so specific combinations
// sit above the general causes they refine.

export type Cause =
  | "fall"
  | "tram"
  | "compactor"
  | "fryer"
  | "canal"
  | "bonk"
  | "vending"
  | "power"
  | "solar"
  | "drip"
  | "kindness"
  | "pigeons"
  | "zipline"
  | "powerline"
  | "bored"
  | "planted"
  | "laughing";

export type CorpsePose = "upright" | "flat" | "upside" | "cube";
export type CorpseTint = "none" | "fried" | "wet" | "zapped" | "melted" | "rusty" | "leafy";

export type DeathEvent = {
  cause: Cause;
  /** Tiles fallen, for falls. */
  fall: number;
  /** What lifted the android before the fall, if anything. */
  lifted: "crane" | null;
  /** Carrying an old body at the moment of death. */
  holdingCorpse: boolean;
  /** For bonks: what landed on the android, and how many bonks in a short window. */
  bonkKind: "corpse" | "prop" | null;
  bonks: number;
  /** Neighbours who could see the death. */
  watchers: number;
};

export type DeathId =
  | "gravity"
  | "tram"
  | "compacted"
  | "fried"
  | "canal"
  | "vending"
  | "overclocked"
  | "solar"
  | "crane"
  | "rusted"
  | "kindness"
  | "pigeons"
  | "clothesline"
  | "selfInflicted"
  | "twoForOne"
  | "stairway"
  | "groupHug"
  | "bored"
  | "embarrassment"
  | "plant"
  | "laughing";

export type DeathDef = {
  id: DeathId;
  /** Board number, 1–21. */
  n: number;
  name: string;
  /** The card's punchline. */
  joke: string;
  /** The android's research log entry. */
  learned: string;
  /** Rook's hint for a locked slot. */
  hint: string;
  /** Rook's rating, out of five. */
  stars: number;
  secret?: boolean;
  /** Needs old bodies to set up. */
  corpses?: boolean;
  /** Awarded alongside another death rather than instead of it. */
  bonus?: boolean;
  /** Only the twist awards it. */
  twist?: boolean;
  pose: CorpsePose;
  tint: CorpseTint;
  match: (e: DeathEvent) => boolean;
};

const never = () => false;

/** In board order. Matching order is MATCH_ORDER below. */
export const DEATHS: DeathDef[] = [
  {
    id: "gravity",
    n: 1,
    name: "Gravity Research",
    joke: "Fell a very long way. Landed with excellent posture.",
    learned: "Gravity is consistent. Annoyingly so.",
    hint: "the roof is very tall. just saying.",
    stars: 2,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "fall",
  },
  {
    id: "tram",
    n: 2,
    name: "Mind the Gap",
    joke: "The 7:15 was on time. You were not.",
    learned: "Trams have right of way. And weight.",
    hint: "the tram doesn't brake for robots.",
    stars: 3,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "tram",
  },
  {
    id: "compacted",
    n: 3,
    name: "Compacted",
    joke: "Now available in a convenient cube.",
    learned: "I am 40% more portable than previously believed.",
    hint: "bas's big squisher. stand in it.",
    stars: 3,
    pose: "cube",
    tint: "none",
    match: (e) => e.cause === "compactor",
  },
  {
    id: "fried",
    n: 4,
    name: "Deep Fried",
    joke: "Golden. Crispy. Still not human.",
    learned: "Auntie Pell's oil is 180 degrees. I am not.",
    hint: "auntie pell's cart has a very hot pot.",
    stars: 3,
    pose: "upright",
    tint: "fried",
    match: (e) => e.cause === "fryer",
  },
  {
    id: "canal",
    n: 5,
    name: "Not Waterproof",
    joke: "The warranty was very clear about this.",
    learned: "The canal is wet. I am now also wet. And off.",
    hint: "the canal. you know what to do.",
    stars: 2,
    pose: "flat",
    tint: "wet",
    match: (e) => e.cause === "canal",
  },
  {
    id: "vending",
    n: 6,
    name: "Vending Machine Revenge",
    joke: "It kept the coin, too.",
    learned: "Vending machines hold grudges.",
    hint: "shake the drinks machine. a LOT.",
    stars: 4,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "vending",
  },
  {
    id: "overclocked",
    n: 7,
    name: "Overclocked",
    joke: "Briefly, you could hear colours.",
    learned: "The market power strip is 240 volts of opinion.",
    hint: "the power strip by the building. plug in. trust me.",
    stars: 3,
    pose: "upright",
    tint: "zapped",
    match: (e) => e.cause === "power",
  },
  {
    id: "solar",
    n: 8,
    name: "Solar Flair",
    joke: "Fashionably melted.",
    learned: "Concentrated sunlight: excellent for tea, bad for me.",
    hint: "where all bas's mirrors point. stand there. wait.",
    stars: 4,
    pose: "upright",
    tint: "melted",
    match: (e) => e.cause === "solar",
  },
  {
    id: "crane",
    n: 9,
    name: "Crane Game",
    joke: "You won! The prize was you. Dropped.",
    learned: "I am magnetic. I am also not a prize.",
    hint: "the magnet picks up metal stuff. you're metal stuff.",
    stars: 4,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "fall" && e.lifted === "crane",
  },
  {
    id: "rusted",
    n: 10,
    name: "Rusted Through",
    joke: "Juniper says you're 'very compostable'.",
    learned: "Patience plus water equals rust.",
    hint: "juniper's drippy pipe on the roof. stand under it. for ages.",
    stars: 2,
    pose: "upright",
    tint: "rusty",
    match: (e) => e.cause === "drip",
  },
  {
    id: "kindness",
    n: 11,
    name: "Crushed by Kindness",
    joke: "Auntie Pell says sorry. Auntie Pell says eat something.",
    learned: "Helping is dangerous. I will do it again anyway.",
    hint: "help auntie pell. she needs a crate at her cart.",
    stars: 5,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "kindness",
  },
  {
    id: "pigeons",
    n: 12,
    name: "Pigeon Rapture",
    joke: "They took you up. They did not bring you down gently.",
    learned: "Pigeons are a community. A strong one.",
    hint: "pell gives out crumbs. pigeons LOVE crumbs. then don't move.",
    stars: 5,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "pigeons",
  },
  {
    id: "clothesline",
    n: 13,
    name: "Clothesline Express",
    joke: "Next stop: the sign. Last stop: also the sign.",
    learned: "Washing lines are not public transport.",
    hint: "the washing line goes from the roof to the tram stop. wheee.",
    stars: 4,
    pose: "upside",
    tint: "none",
    match: (e) => e.cause === "zipline",
  },
  {
    id: "selfInflicted",
    n: 14,
    name: "Self-Inflicted",
    joke: "Hit by yourself. Technically a team effort.",
    learned: "My old body is heavier than I remember.",
    hint: "throw an old you straight up. then look up.",
    stars: 4,
    corpses: true,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "bonk" && e.bonkKind === "corpse",
  },
  {
    id: "twoForOne",
    n: 15,
    name: "Two for One",
    joke: "Bulk discount.",
    learned: "Cubes stack better than I do.",
    hint: "take an old you into the squisher. hold it tight.",
    stars: 5,
    corpses: true,
    pose: "cube",
    tint: "none",
    match: (e) => e.cause === "compactor" && e.holdingCorpse,
  },
  {
    id: "stairway",
    n: 16,
    name: "Stairway to Heaven",
    joke: "Climbed yourself to touch the sky. The sky was a power line.",
    learned: "I am, in fact, my own ladder.",
    hint: "the power line over the street is too high. for ONE of you.",
    stars: 5,
    corpses: true,
    pose: "upright",
    tint: "zapped",
    match: (e) => e.cause === "powerline",
  },
  {
    id: "groupHug",
    n: 17,
    name: "Group Hug",
    joke: "Three of you, one of you, all very flat.",
    learned: "I love me. Maybe too much.",
    hint: "get three old yous to land on you at once.",
    stars: 5,
    corpses: true,
    pose: "flat",
    tint: "none",
    match: (e) => e.cause === "bonk" && e.bonks >= 3,
  },
  {
    id: "bored",
    n: 18,
    name: "Bored to Death",
    joke: "Stood still for three minutes. Rook fell asleep too.",
    learned: "Doing nothing is surprisingly fatal.",
    hint: "do NOTHING. for ages.",
    stars: 3,
    secret: true,
    pose: "upright",
    tint: "none",
    match: (e) => e.cause === "bored",
  },
  {
    id: "embarrassment",
    n: 19,
    name: "Died of Embarrassment",
    joke: "Everyone saw. Everyone.",
    learned: "Being watched makes it count more.",
    hint: "die where all four of us can see you.",
    stars: 5,
    secret: true,
    bonus: true,
    pose: "flat",
    tint: "none",
    match: (e) => e.watchers >= 4,
  },
  {
    id: "plant",
    n: 20,
    name: "Tried Being a Plant",
    joke: "Juniper watered you. You did not grow.",
    learned: "Photosynthesis is not supported on this model.",
    hint: "juniper's planter has room for one more.",
    stars: 4,
    secret: true,
    pose: "upright",
    tint: "leafy",
    match: (e) => e.cause === "planted",
  },
  {
    id: "laughing",
    n: 21,
    name: "Died Laughing",
    joke: "Not technically a death. Human: provisionally confirmed.",
    learned: "Only humans die laughing. I laughed.",
    hint: "",
    stars: 5,
    twist: true,
    pose: "upright",
    tint: "none",
    match: never,
  },
];

export const deathById = Object.fromEntries(DEATHS.map((d) => [d.id, d])) as Record<DeathId, DeathDef>;

/** Specific combinations first. Bonus and twist deaths are matched separately. */
const MATCH_ORDER: DeathId[] = [
  "twoForOne",
  "groupHug",
  "crane",
  "selfInflicted",
  ...DEATHS.filter((d) => !d.bonus && !d.twist).map((d) => d.id),
];

export function classify(e: DeathEvent): DeathDef | null {
  for (const id of MATCH_ORDER) if (deathById[id].match(e)) return deathById[id];
  return null;
}

export function bonusFor(e: DeathEvent): DeathDef[] {
  return DEATHS.filter((d) => d.bonus && d.match(e));
}

/** Pose and tint for a cause that matched nothing on the board. */
export const UNCATALOGUED = {
  pose: "flat" as CorpsePose,
  tint: "none" as CorpseTint,
  name: "Uncatalogued",
  joke: "Rook says it doesn't count. Too normal.",
  learned: "Some deaths are just not original enough.",
};

/** The board without the twist entry: what the player can find by playing. */
export const BOARD = DEATHS.filter((d) => !d.twist);
