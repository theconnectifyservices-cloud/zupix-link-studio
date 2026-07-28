/**
 * demo-media.ts — Global Demo Content Population Engine
 *
 * Centralized, category-keyed media manifest so every landing surface
 * (Showcase themes, Experience live phone, Hero, Ecosystem cards, etc.)
 * renders real Indian-business imagery instead of empty gradient/emoji tiles.
 *
 * Sources:
 *   People:   randomuser.me (real portraits, diverse ages/genders)
 *   Business: images.unsplash.com direct photo URLs (stable, CDN-cached)
 *
 * Rules:
 *   - Never reuse the same portrait across visible demos in the same section.
 *   - Every category exposes: owner, cover, products[6], gallery[6].
 *   - All URLs are deterministic strings — safe under SSR/hydration.
 */

const RU = (gender: "men" | "women", n: number, size = 240) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg?w=${size}`;

const UN = (id: string, w = 1200, h = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

/**
 * Authentic Indian founder/business-owner portraits.
 * The testimonial roster uses photorealistic Indian headshots hosted on
 * the Lovable CDN, matched to each founder name and industry. Supporting
 * portraits used only by category tiles fall back to randomuser.me.
 */
export const PORTRAITS = {
  // ---- Testimonial roster (authentic Indian portraits, CDN-hosted) ----
  jewellerOwner: "/__l5e/assets-v1/33746a26-4bfb-4601-a832-57369f0de333/portrait-jewellerOwner.jpg",
  chefRestaurant: "/__l5e/assets-v1/f5ec19f1-f235-40d9-9236-0a83f51d5fb9/portrait-chefRestaurant.jpg",
  karan: "/__l5e/assets-v1/a4017472-146c-4ba2-9f2b-f829ad98f4d6/portrait-karan.jpg",
  drAnanya: "/__l5e/assets-v1/c62e7b6a-d14b-4a57-b933-95d8bb916188/portrait-drAnanya.jpg",
  rajesh: "/__l5e/assets-v1/0a97d19d-cae6-4393-9571-dd7c47911155/portrait-rajesh.jpg",
  gymTrainer: "/__l5e/assets-v1/a6013e15-d305-4678-98f7-c25da3f7ab45/portrait-gymTrainer.jpg",
  priya: "/__l5e/assets-v1/2145a5d7-7954-4937-9c87-a65550ba534b/portrait-priya.jpg",
  meera: "/__l5e/assets-v1/66f60457-bde4-4f40-9449-8a31dbda50e9/portrait-meera.jpg",
  cafeOwner: "/__l5e/assets-v1/76af1886-6f7a-4498-aa57-b17226cfb489/portrait-cafeOwner.jpg",
  nisha: "/__l5e/assets-v1/223b2090-58b9-4181-aa4e-3e92d1a12207/portrait-nisha.jpg",
  farhan: "/__l5e/assets-v1/c755b3d7-193c-42c6-885d-d9222343f6c1/portrait-farhan.jpg",
  anaya: "/__l5e/assets-v1/17df939c-720a-47c3-b27e-ef2f77f1c0b1/portrait-anaya.jpg",
  vikram: "/__l5e/assets-v1/93270a7d-868b-4450-bad8-de83a7cbd87e/portrait-vikram.jpg",
  kavya: "/__l5e/assets-v1/fccd5266-3e20-4c7d-8310-84878be57184/portrait-kavya.jpg",
  aditya: "/__l5e/assets-v1/b7e78058-41d2-451c-8cc8-0b0742c804f8/portrait-aditya.jpg",

  // ---- Supporting roster (category tiles only) ----
  rohan: RU("men", 32),
  ayesha: RU("women", 44),
  ananya: RU("women", 68),
  rehan: RU("men", 78),
  arjun: RU("men", 11),
  priyaKapoor: RU("women", 65),
  mehtaLawyer: RU("men", 83),
  fashionDesigner: RU("women", 39),
  salonOwner: RU("women", 71),
  teacher: RU("women", 18),
  realEstate: RU("men", 74),
  travelAgent: RU("women", 30),
  ngoFounder: RU("women", 50),
  architect: RU("men", 36),
  contentCreator: RU("women", 9),
};

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
  spa: UN("1540555700478-4be289fbecef"),
  hospital: UN("1587351021355-a7bcb3e3ba1c"),
  ngo: UN("1488521787991-ed7bbaae773c"),
  interior: UN("1616486338812-3dadae4b4ace"),
  photographer: UN("1502920917128-1aa500764cbd"),
  temple: UN("1518709414768-a88981a4515d"),
  ca: UN("1554224155-6726b3ff858f"),
  software: UN("1461749280684-dccba630e2f6"),
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

/* ============================================================================
 * CATEGORY_MEDIA — the population engine.
 * Every category maps to a full media set consumed by any tile renderer.
 * ==========================================================================*/

export interface CategoryMedia {
  owner: string;
  cover: string;
  products: string[]; // 6 square product images
  gallery: string[]; // 6 landscape gallery images
}

const p = (id: string) => UN(id, 600, 600);
const g = (id: string) => UN(id, 800, 600);

/** Category key → full media set. Keys normalized to lower-case single words. */
export const CATEGORY_MEDIA: Record<string, CategoryMedia> = {
  jewellery: {
    owner: PORTRAITS.jewellerOwner,
    cover: COVERS.jewellery,
    products: [
      p("1611591437281-460bfbe1220a"), p("1599643478518-a784e5dc4c8f"),
      p("1602173574767-37ac01994b2a"), p("1515562141207-7a88fb7ce338"),
      p("1573408301185-9146fe634ad0"), p("1535632066927-ab7c9ab60908"),
    ],
    gallery: [
      g("1611652022419-a9419f74343d"), g("1599643478518-a784e5dc4c8f"),
      g("1602751584547-1c2848f6bea2"), g("1601121141461-9d6647bca1ed"),
      g("1535632066927-ab7c9ab60908"), g("1573408301185-9146fe634ad0"),
    ],
  },
  restaurant: {
    owner: PORTRAITS.chefRestaurant,
    cover: COVERS.restaurant,
    products: [
      p("1585937421612-70a008356fbe"), p("1565958011703-44f9829ba187"),
      p("1567620905732-2d1ec7ab7445"), p("1546069901-ba9599a7e63c"),
      p("1543353071-10c8ba85a904"), p("1550547660-d9450f859349"),
    ],
    gallery: [
      g("1414235077428-338989a2e8c0"), g("1552566626-52f8b828add9"),
      g("1517248135467-4c7edcad34c4"), g("1555396273-367ea4eb4db5"),
      g("1559339352-11d035aa65de"), g("1544025162-d76694265947"),
    ],
  },
  cafe: {
    owner: PORTRAITS.cafeOwner,
    cover: COVERS.cafe,
    products: [
      p("1442512595331-e89e73853f31"), p("1509042239860-f550ce710b93"),
      p("1461023058943-07fcbe16d735"), p("1447933601403-0c6688de566e"),
      p("1495474472287-4d71bcdd2085"), p("1442975631115-c4f7b05b8a2c"),
    ],
    gallery: [
      g("1445116572660-236099ec97a0"), g("1554118811-1e0d58224f24"),
      g("1497515114629-f71d768fd07c"), g("1521017432531-fbd92d768814"),
      g("1442975631115-c4f7b05b8a2c"), g("1509042239860-f550ce710b93"),
    ],
  },
  doctor: {
    owner: PORTRAITS.drAnanya,
    cover: COVERS.doctor,
    products: [
      p("1584982751601-97dcc096659c"), p("1587854692152-cbe660dbde88"),
      p("1512070679279-8988d32161be"), p("1631815589968-fdb09a223b1e"),
      p("1666214280557-f1b5022eb634"), p("1583912267550-d6c2ac3196c0"),
    ],
    gallery: [
      g("1519494026892-80bbd2d6fd0d"), g("1576091160399-112ba8d25d1d"),
      g("1584982751601-97dcc096659c"), g("1631815587646-b85a1bb027e1"),
      g("1666214280557-f1b5022eb634"), g("1587854692152-cbe660dbde88"),
    ],
  },
  hospital: {
    owner: PORTRAITS.drAnanya,
    cover: COVERS.hospital,
    products: [
      p("1631815589968-fdb09a223b1e"), p("1584982751601-97dcc096659c"),
      p("1666214280557-f1b5022eb634"), p("1587854692152-cbe660dbde88"),
      p("1583912267550-d6c2ac3196c0"), p("1631815587646-b85a1bb027e1"),
    ],
    gallery: [
      g("1587351021355-a7bcb3e3ba1c"), g("1516549655169-df83a0774514"),
      g("1519494026892-80bbd2d6fd0d"), g("1631815587646-b85a1bb027e1"),
      g("1666214280557-f1b5022eb634"), g("1584982751601-97dcc096659c"),
    ],
  },
  salon: {
    owner: PORTRAITS.salonOwner,
    cover: COVERS.salon,
    products: [
      p("1522337360788-8b13dee7a37e"), p("1560869713-da86a9ec0744"),
      p("1583001809873-a128495da465"), p("1595476108010-b4d1f102b1b1"),
      p("1610992015762-45dca7a55dfa"), p("1503951914875-452162b0f3f1"),
    ],
    gallery: [
      g("1560066984-138dadb4c035"), g("1522337360788-8b13dee7a37e"),
      g("1560869713-da86a9ec0744"), g("1595476108010-b4d1f102b1b1"),
      g("1522337994330-4b3c9d7d2c37"), g("1503951914875-452162b0f3f1"),
    ],
  },
  spa: {
    owner: PORTRAITS.priya,
    cover: COVERS.spa,
    products: [
      p("1544161515-4ab6ce6db874"), p("1519415943484-9fa1873496d4"),
      p("1596178065887-1198b6148b2b"), p("1600334129128-685c5582fd35"),
      p("1591343395082-e120087004b4"), p("1552693673-1bf958298935"),
    ],
    gallery: [
      g("1540555700478-4be289fbecef"), g("1544161515-4ab6ce6db874"),
      g("1600334129128-685c5582fd35"), g("1519415943484-9fa1873496d4"),
      g("1596178065887-1198b6148b2b"), g("1591343395082-e120087004b4"),
    ],
  },
  gym: {
    owner: PORTRAITS.gymTrainer,
    cover: COVERS.gym,
    products: [
      p("1517836357463-d25dfeac3438"), p("1534438327276-14e5300c3a48"),
      p("1571019613454-1cb2f99b2d8b"), p("1583500178690-f7fd39a72da5"),
      p("1518611012118-696072aa579a"), p("1594381898411-846e7d193883"),
    ],
    gallery: [
      g("1534438327276-14e5300c3a48"), g("1517836357463-d25dfeac3438"),
      g("1571019613454-1cb2f99b2d8b"), g("1583500178690-f7fd39a72da5"),
      g("1594381898411-846e7d193883"), g("1518611012118-696072aa579a"),
    ],
  },
  hotel: {
    owner: PORTRAITS.priyaKapoor,
    cover: COVERS.hotel,
    products: [
      g("1566073771259-6a8506099945"), g("1611892440504-42a792e24d32"),
      g("1590490360182-c33d57733427"), g("1520250497591-112f2f40a3f4"),
      g("1582719508461-905c673771fd"), g("1584132967334-10e028bd69f7"),
    ],
    gallery: [
      g("1566073771259-6a8506099945"), g("1611892440504-42a792e24d32"),
      g("1590490360182-c33d57733427"), g("1520250497591-112f2f40a3f4"),
      g("1582719508461-905c673771fd"), g("1584132967334-10e028bd69f7"),
    ],
  },
  travel: {
    owner: PORTRAITS.travelAgent,
    cover: COVERS.travel,
    products: [
      p("1499856871958-5b9627545d1a"), p("1476514525535-07fb3b4ae5f1"),
      p("1523805009345-7448845a9e53"), p("1502920917128-1aa500764cbd"),
      p("1533105079780-92b9be482077"), p("1512343879784-a960bf40e7f2"),
    ],
    gallery: [
      g("1476514525535-07fb3b4ae5f1"), g("1499856871958-5b9627545d1a"),
      g("1523805009345-7448845a9e53"), g("1512343879784-a960bf40e7f2"),
      g("1502920917128-1aa500764cbd"), g("1533105079780-92b9be482077"),
    ],
  },
  ngo: {
    owner: PORTRAITS.ngoFounder,
    cover: COVERS.ngo,
    products: [
      p("1488521787991-ed7bbaae773c"), p("1593113598332-cd288d649433"),
      p("1469571486292-0ba58a3f068b"), p("1517486808906-6ca8b3f04846"),
      p("1509099836639-18ba1795216d"), p("1541971875076-8f970d573be6"),
    ],
    gallery: [
      g("1488521787991-ed7bbaae773c"), g("1593113598332-cd288d649433"),
      g("1469571486292-0ba58a3f068b"), g("1509099836639-18ba1795216d"),
      g("1517486808906-6ca8b3f04846"), g("1541971875076-8f970d573be6"),
    ],
  },
  realestate: {
    owner: PORTRAITS.realEstate,
    cover: COVERS.realestate,
    products: [
      p("1560518883-ce09059eeffa"), p("1512917774080-9991f1c4c750"),
      p("1600585154340-be6161a56a0c"), p("1600596542815-ffad4c1539a9"),
      p("1600607687939-ce8a6c25118c"), p("1613490493576-7fde63acd811"),
    ],
    gallery: [
      g("1560518883-ce09059eeffa"), g("1512917774080-9991f1c4c750"),
      g("1600585154340-be6161a56a0c"), g("1600596542815-ffad4c1539a9"),
      g("1600607687939-ce8a6c25118c"), g("1613490493576-7fde63acd811"),
    ],
  },
  interior: {
    owner: PORTRAITS.architect,
    cover: COVERS.interior,
    products: [
      p("1616486338812-3dadae4b4ace"), p("1616486788371-62d930495c44"),
      p("1618221195710-dd6b41faaea6"), p("1616137466211-f939a420be84"),
      p("1615874959474-d609969a20ed"), p("1618219944342-824e40a13285"),
    ],
    gallery: [
      g("1616486338812-3dadae4b4ace"), g("1616486788371-62d930495c44"),
      g("1618221195710-dd6b41faaea6"), g("1616137466211-f939a420be84"),
      g("1615874959474-d609969a20ed"), g("1618219944342-824e40a13285"),
    ],
  },
  architect: {
    owner: PORTRAITS.architect,
    cover: COVERS.construction,
    products: [
      p("1541888946425-d81bb19240f5"), p("1503387762-b81e8b3c8ec5"),
      p("1503387837-b154d5074bd2"), p("1449158743715-0a90ebb6d2d8"),
      p("1487958449943-2429e8be8625"), p("1481253127861-534498168948"),
    ],
    gallery: [
      g("1541888946425-d81bb19240f5"), g("1503387762-b81e8b3c8ec5"),
      g("1503387837-b154d5074bd2"), g("1449158743715-0a90ebb6d2d8"),
      g("1487958449943-2429e8be8625"), g("1481253127861-534498168948"),
    ],
  },
  law: {
    owner: PORTRAITS.mehtaLawyer,
    cover: COVERS.law,
    products: [
      p("1589829545856-d10d557cf95f"), p("1450101499163-c8848c66ca85"),
      p("1505664194779-8beaceb93744"), p("1521587760476-6c12a4b040da"),
      p("1554224155-6726b3ff858f"), p("1499750310107-5fef28a66643"),
    ],
    gallery: [
      g("1589829545856-d10d557cf95f"), g("1450101499163-c8848c66ca85"),
      g("1505664194779-8beaceb93744"), g("1521587760476-6c12a4b040da"),
      g("1554224155-6726b3ff858f"), g("1499750310107-5fef28a66643"),
    ],
  },
  ca: {
    owner: PORTRAITS.vikram,
    cover: COVERS.ca,
    products: [
      p("1554224155-6726b3ff858f"), p("1554224154-26032cbc65d5"),
      p("1450101499163-c8848c66ca85"), p("1554224155-8d04421cd6e2"),
      p("1543286386-2e659306cd6c"), p("1554224154-22dec7ec8818"),
    ],
    gallery: [
      g("1554224155-6726b3ff858f"), g("1554224154-26032cbc65d5"),
      g("1450101499163-c8848c66ca85"), g("1543286386-2e659306cd6c"),
      g("1554224155-8d04421cd6e2"), g("1554224154-22dec7ec8818"),
    ],
  },
  photographer: {
    owner: PORTRAITS.karan,
    cover: COVERS.photographer,
    products: [
      p("1502920917128-1aa500764cbd"), p("1554048612-b6a482bc67e5"),
      p("1516035069371-29a1b244cc32"), p("1520549233664-03f65c1d1327"),
      p("1519741497674-611481863552"), p("1519225421980-715cb0215aed"),
    ],
    gallery: [
      g("1502920917128-1aa500764cbd"), g("1554048612-b6a482bc67e5"),
      g("1516035069371-29a1b244cc32"), g("1520549233664-03f65c1d1327"),
      g("1519741497674-611481863552"), g("1519225421980-715cb0215aed"),
    ],
  },
  creator: {
    owner: PORTRAITS.contentCreator,
    cover: COVERS.creator,
    products: [
      p("1522542550221-31fd19575a2d"), p("1516251193007-45ef944ab0c6"),
      p("1571908599407-cdb918ed83bf"), p("1611162617213-7d7a39e9b1d7"),
      p("1583394293214-28ded15ee548"), p("1611162616805-6a67c37f2d02"),
    ],
    gallery: [
      g("1522542550221-31fd19575a2d"), g("1516251193007-45ef944ab0c6"),
      g("1571908599407-cdb918ed83bf"), g("1611162617213-7d7a39e9b1d7"),
      g("1583394293214-28ded15ee548"), g("1611162616805-6a67c37f2d02"),
    ],
  },
  electronics: {
    owner: PORTRAITS.farhan,
    cover: COVERS.electronics,
    products: [
      p("1512499617640-c74ae3a79d37"), p("1526738549149-8e07eca6c147"),
      p("1585298723682-7115561c51b7"), p("1587202372775-e229f172b9d7"),
      p("1592899677977-9c10ca588bbd"), p("1580910051074-3eb694886505"),
    ],
    gallery: [
      g("1523275335684-37898b6baf30"), g("1526738549149-8e07eca6c147"),
      g("1585298723682-7115561c51b7"), g("1587202372775-e229f172b9d7"),
      g("1592899677977-9c10ca588bbd"), g("1580910051074-3eb694886505"),
    ],
  },
  furniture: {
    owner: PORTRAITS.rohan,
    cover: COVERS.furniture,
    products: [
      p("1567538096630-e0c55bd6374c"), p("1555041469-a586c61ea9bc"),
      p("1493663284031-b7e3aefcae8e"), p("1540574163026-643ea20ade25"),
      p("1524758631624-e2822e304c36"), p("1567016432779-094069958ea5"),
    ],
    gallery: [
      g("1555041469-a586c61ea9bc"), g("1567538096630-e0c55bd6374c"),
      g("1493663284031-b7e3aefcae8e"), g("1540574163026-643ea20ade25"),
      g("1524758631624-e2822e304c36"), g("1567016432779-094069958ea5"),
    ],
  },
  fashion: {
    owner: PORTRAITS.fashionDesigner,
    cover: COVERS.fashion,
    products: [
      p("1490481651871-ab68de25d43d"), p("1483985988355-763728e1935b"),
      p("1485231183945-fffde7cc051e"), p("1479064555552-3ef4979f8908"),
      p("1495121605193-b116b5b9c5fe"), p("1509631179647-0177331693ae"),
    ],
    gallery: [
      g("1441986300917-64674bd600d8"), g("1483985988355-763728e1935b"),
      g("1490481651871-ab68de25d43d"), g("1485231183945-fffde7cc051e"),
      g("1479064555552-3ef4979f8908"), g("1495121605193-b116b5b9c5fe"),
    ],
  },
  school: {
    owner: PORTRAITS.teacher,
    cover: COVERS.school,
    products: [
      p("1503676260728-1c00da094a0b"), p("1509062522246-3755977927d7"),
      p("1497633762265-9d179a990aa6"), p("1523240795612-9a054b0db644"),
      p("1481627834876-b7833e8f5570"), p("1519452635265-7b1fbfd1e1f5"),
    ],
    gallery: [
      g("1523240795612-9a054b0db644"), g("1503676260728-1c00da094a0b"),
      g("1509062522246-3755977927d7"), g("1497633762265-9d179a990aa6"),
      g("1481627834876-b7833e8f5570"), g("1519452635265-7b1fbfd1e1f5"),
    ],
  },
  coaching: {
    owner: PORTRAITS.rajesh,
    cover: COVERS.coaching,
    products: [
      p("1503676260728-1c00da094a0b"), p("1524178232363-1fb2b075b655"),
      p("1509062522246-3755977927d7"), p("1497633762265-9d179a990aa6"),
      p("1523240795612-9a054b0db644"), p("1519452635265-7b1fbfd1e1f5"),
    ],
    gallery: [
      g("1503676260728-1c00da094a0b"), g("1524178232363-1fb2b075b655"),
      g("1509062522246-3755977927d7"), g("1497633762265-9d179a990aa6"),
      g("1523240795612-9a054b0db644"), g("1519452635265-7b1fbfd1e1f5"),
    ],
  },
  agency: {
    owner: PORTRAITS.ayesha,
    cover: COVERS.agency,
    products: [
      p("1497366216548-37526070297c"), p("1522071820081-009f0129c71c"),
      p("1552664730-d307ca884978"), p("1517245386807-bb43f82c33c4"),
      p("1553877522-43269d4ea984"), p("1600880292203-757bb62b4baf"),
    ],
    gallery: [
      g("1497366216548-37526070297c"), g("1522071820081-009f0129c71c"),
      g("1552664730-d307ca884978"), g("1517245386807-bb43f82c33c4"),
      g("1553877522-43269d4ea984"), g("1600880292203-757bb62b4baf"),
    ],
  },
  software: {
    owner: PORTRAITS.karan,
    cover: COVERS.software,
    products: [
      p("1461749280684-dccba630e2f6"), p("1555066931-4365d14bab8c"),
      p("1517694712202-14dd9538aa97"), p("1504639725590-34d0984388bd"),
      p("1587620962725-abab7fe55159"), p("1516116216624-53e697fedbea"),
    ],
    gallery: [
      g("1461749280684-dccba630e2f6"), g("1555066931-4365d14bab8c"),
      g("1517694712202-14dd9538aa97"), g("1504639725590-34d0984388bd"),
      g("1587620962725-abab7fe55159"), g("1516116216624-53e697fedbea"),
    ],
  },
  construction: {
    owner: PORTRAITS.architect,
    cover: COVERS.construction,
    products: [
      p("1541888946425-d81bb19240f5"), p("1503387762-b81e8b3c8ec5"),
      p("1503387837-b154d5074bd2"), p("1487958449943-2429e8be8625"),
      p("1449158743715-0a90ebb6d2d8"), p("1481253127861-534498168948"),
    ],
    gallery: [
      g("1541888946425-d81bb19240f5"), g("1503387762-b81e8b3c8ec5"),
      g("1503387837-b154d5074bd2"), g("1487958449943-2429e8be8625"),
      g("1449158743715-0a90ebb6d2d8"), g("1481253127861-534498168948"),
    ],
  },
  temple: {
    owner: PORTRAITS.ananya,
    cover: COVERS.temple,
    products: [
      p("1518709414768-a88981a4515d"), p("1466442929976-97f336a657be"),
      p("1583405032353-88db7a26e8dc"), p("1509233725247-49e657c54213"),
      p("1544427920-c49ccfb85579"), p("1614089720900-1b21b0e10cea"),
    ],
    gallery: [
      g("1518709414768-a88981a4515d"), g("1466442929976-97f336a657be"),
      g("1583405032353-88db7a26e8dc"), g("1509233725247-49e657c54213"),
      g("1544427920-c49ccfb85579"), g("1614089720900-1b21b0e10cea"),
    ],
  },
};

/** Normalize any human category label to a CATEGORY_MEDIA key. */
export function mediaForCategory(label: string | undefined | null): CategoryMedia {
  const key = (label ?? "").toLowerCase().trim();
  const map: Record<string, keyof typeof CATEGORY_MEDIA> = {
    jewellery: "jewellery", jeweller: "jewellery", jewelry: "jewellery",
    restaurant: "restaurant", food: "restaurant", diner: "restaurant",
    cafe: "cafe", coffee: "cafe", café: "cafe",
    doctor: "doctor", clinic: "doctor", dermatology: "doctor",
    hospital: "hospital",
    school: "school",
    salon: "salon",
    spa: "spa",
    gym: "gym", fitness: "gym",
    hotel: "hotel", resort: "hotel",
    travel: "travel", tourism: "travel",
    ngo: "ngo", charity: "ngo", trust: "ngo",
    "real estate": "realestate", realestate: "realestate", realty: "realestate", property: "realestate",
    interior: "interior", "interior design": "interior",
    architect: "architect", architecture: "architect",
    "law firm": "law", law: "law", lawyer: "law", legal: "law",
    ca: "ca", accountant: "ca", accounting: "ca",
    photographer: "photographer", photography: "photographer", photo: "photographer",
    creator: "creator", influencer: "creator", content: "creator",
    electronics: "electronics",
    furniture: "furniture",
    fashion: "fashion", boutique: "fashion",
    coaching: "coaching", tutor: "coaching", education: "coaching",
    "digital agency": "agency", agency: "agency", marketing: "agency",
    "software company": "software", software: "software", tech: "software",
    construction: "construction",
    temple: "temple", "temple trust": "temple",
  };
  const norm = map[key] ?? "creator";
  return CATEGORY_MEDIA[norm];
}
