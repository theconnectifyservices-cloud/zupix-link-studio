/** Detect a coarse industry from bio page name/description/keywords. */
export type Industry =
  | "restaurant"
  | "doctor"
  | "salon"
  | "jewellery"
  | "realestate"
  | "agency"
  | "gym"
  | "travel"
  | "education"
  | "creator"
  | "generic";

const RULES: Array<[Industry, RegExp]> = [
  ["restaurant", /\b(restaurant|cafe|café|bistro|kitchen|diner|food|bakery|brew|coffee)\b/i],
  ["doctor", /\b(clinic|doctor|dr\.?|hospital|dental|dentist|physio|ayurvedic|wellness centre)\b/i],
  ["salon", /\b(salon|spa|beauty|hair|barber|makeup|nails)\b/i],
  ["jewellery", /\b(jewell?ery|jewell?ers|gold|diamond|silver|ornaments)\b/i],
  ["realestate", /\b(real ?estate|properties|homes|realty|builders|apartments|villas)\b/i],
  ["agency", /\b(agency|studio|marketing|design|forge|creative|consultancy|associates)\b/i],
  ["gym", /\b(gym|fitness|crossfit|yoga|pilates|athletic|iron)\b/i],
  ["travel", /\b(travel|tours|trails|expedition|wanderlust|holidays|adventure)\b/i],
  ["education", /\b(school|academy|coaching|institute|university|college|tutor)\b/i],
];

export function detectIndustry(input: string): Industry {
  const s = input || "";
  for (const [ind, rx] of RULES) if (rx.test(s)) return ind;
  return "generic";
}

const CTA_BY_INDUSTRY: Record<Industry, string> = {
  restaurant: "Build your Restaurant Bio Page FREE",
  doctor: "Create your Clinic Bio Page FREE",
  salon: "Launch your Salon Profile FREE",
  jewellery: "Build your Jewellery Showcase FREE",
  realestate: "Create your Property Landing Page FREE",
  agency: "Launch your Agency Bio Link FREE",
  gym: "Create your Fitness Bio Page FREE",
  travel: "Launch your Travel Profile FREE",
  education: "Launch your Academy Bio Page FREE",
  creator: "Build your Creator Bio Page FREE",
  generic: "Create your Bio Page FREE in 60 seconds",
};

export function industryCta(industry: Industry): string {
  return CTA_BY_INDUSTRY[industry];
}
