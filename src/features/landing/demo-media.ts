/**
 * demo-media.ts — curated royalty-free imagery for landing demo content.
 *
 * People:    randomuser.me portraits (real photos, always available, diverse).
 * Business:  Unsplash direct photo URLs (stable, hotlink-friendly).
 *
 * Rule: never reuse a portrait across visible demos in the same section.
 */

const RU = (gender: "men" | "women", n: number, size = 200) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg?w=${size}`;

/** 30 curated portraits — diverse ages, genders, professional feel. */
export const PORTRAITS = {
  rohan: RU("men", 32),
  ayesha: RU("women", 44),
  karan: RU("men", 45),
  ananya: RU("women", 68),
  rajesh: RU("men", 52),
  rehan: RU("men", 78),
  priya: RU("women", 21),
  meera: RU("women", 33),
  arjun: RU("men", 11),
  nisha: RU("women", 12),
  farhan: RU("men", 27),
  anaya: RU("women", 55),
  vikram: RU("men", 61),
  kavya: RU("women", 47),
  aditya: RU("men", 8),
  priyaKapoor: RU("women", 65),
  drAnanya: RU("women", 26),
  mehtaLawyer: RU("men", 83),
  chefRestaurant: RU("men", 40),
  jewellerOwner: RU("men", 15),
  fashionDesigner: RU("women", 39),
  salonOwner: RU("women", 71),
  gymTrainer: RU("men", 91),
  teacher: RU("women", 18),
  realEstate: RU("men", 74),
  travelAgent: RU("women", 30),
  cafeOwner: RU("men", 22),
  ngoFounder: RU("women", 50),
  architect: RU("men", 36),
  contentCreator: RU("women", 9),
};

const UN = (id: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

/** Business cover imagery keyed by category. */
export const COVERS = {
  jewellery: UN("1611652022419-a9419f74343d"),
  restaurant: UN("1414235077428-338989a2e8c0"),
  doctor: UN("1519494026892-80bbd2d6fd0d"),
  salon: UN("1560066984-138dadb4c035"),
  school: UN("1523240795612-9a054b0db644"),
  gym: UN("1534438327276-14e5300c3a48"),
  travel: UN("1476514525535-07fb3b4ae5f1"),
  cafe: UN("1445116572660-236099ec97a0"),
  hotel: UN("1566073771259-6a8506099945"),
  electronics: UN("1523275335684-37898b6baf30"),
  furniture: UN("1555041469-a586c61ea9bc"),
  fashion: UN("1441986300917-64674bd600d8"),
  books: UN("1481627834876-b7833e8f5570"),
  realestate: UN("1560518883-ce09059eeffa"),
  agency: UN("1497366216548-37526070297c"),
  law: UN("1589829545856-d10d557cf95f"),
  construction: UN("1541888946425-d81bb19240f5"),
  coaching: UN("1503676260728-1c00da094a0b"),
  creator: UN("1522542550221-31fd19575a2d"),
  coffee: UN("1447933601403-0c6688de566e"),
};

/** Product tile imagery — realistic, aspect-square friendly. */
export const PRODUCTS = {
  jewellery: UN("1611591437281-460bfbe1220a", 600, 600),
  food: UN("1585937421612-70a008356fbe", 600, 600),
  salonKit: UN("1522337360788-8b13dee7a37e", 600, 600),
  gymPass: UN("1517836357463-d25dfeac3438", 600, 600),
  furniture: UN("1567538096630-e0c55bd6374c", 600, 600),
  electronics: UN("1512499617640-c74ae3a79d37", 600, 600),
  books: UN("1519681393784-d120267933ba", 600, 600),
  fashion: UN("1490481651871-ab68de25d43d", 600, 600),
  travel: UN("1499856871958-5b9627545d1a", 600, 600),
  coffee: UN("1442512595331-e89e73853f31", 600, 600),
};
