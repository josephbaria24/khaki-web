import { SERVICE_CATEGORIES } from "@/lib/khaki";

export const LANDING = {
  olive: "#3D5C6E",
  oliveDeep: "#2A3F4D",
  oliveMid: "#4A7082",
  sand: "#E8DCC4",
  tan: "#C4B07A",
  khaki: "#B8A86A",
  /** Global app canvas — matches top nav */
  page: "#FBF8F1",
  cream: "#F7F4EC",
  moss: "#8BA8B8",
  sage: "#C9D6E0",
  ink: "#2C2A22",
};

export const LANDING_STATS = [
  { value: "Palawan-wide", label: "Every town, one marketplace" },
  { value: "2% posting fee", label: "Until February 2027" },
  { value: "Direct pay", label: "You and the tasker settle" },
];

export const LANDING_STEPS = [
  { num: "1", title: "I-describe kung ano'ng kailangan gawin", desc: "Errands, transport, repairs, tours — i-post mo ang Palawan task mo in minutes.", image: "/images/cards/hiw1.png" },
  { num: "2", title: "I-set ang budget mo", desc: "Ikaw mag-name ng price. Magse-send ng bids ang local taskers, so ikaw pa rin ang in control.", image: "/images/cards/hiw2.png" },
  { num: "3", title: "Piliin ang best tasker", desc: "I-compare ang ratings, mag-chat, tapos mag-usap kayo sa payment — hindi hawak ni Khaki ang task fee.", image: "/images/cards/hiw3.png" },
];

export const LANDING_CATEGORIES = SERVICE_CATEGORIES.map((cat) => {
  const extras = {
    transport: { bg: "#C9D6E0", href: "/browse", image: "/images/cards/realistics/local-transport.jpg" },
    tourism: { bg: "#C9CBA3", href: "/browse", image: "/images/cards/realistics/tourism-tours.jpg" },
    repair: { bg: "#E2D3B3", href: "/browse", image: "/images/cards/realistics/home-repair.jpg" },
    cleaning: { bg: "#DDE5C8", href: "/browse", image: "/images/cards/realistics/home-cleaning.jpg" },
    digital: { bg: "#EDE4C8", href: "/browse", image: "/images/cards/realistics/digital-tasks.jpg" },
    salon: { bg: "#E4D5B5", href: "/browse", image: "/images/cards/realistics/salon-wellness.jpg" },
    pets: { bg: "#D5DEC4", href: "/browse", image: "/images/cards/realistics/pet-care.jpg" },
    other: { bg: "#F0E6D0", href: "/post", image: "/images/cards/realistics/something-else.jpg" },
  };
  return { ...cat, ...(extras[cat.key] || { bg: "#E8DCC4", href: "/browse" }) };
});

export const LANDING_TASK_TABS = SERVICE_CATEGORIES.map((c) => c.title);

export const LANDING_TASKS = [
  { tab: "Transport & Rides", category: "Transport", title: "Airport pickup to hotel", budget: 800, stars: 5 },
  { tab: "Transport & Rides", category: "Transport", title: "Van hire Puerto to El Nido", budget: 2500, stars: 5 },
  { tab: "Tourism & Tours", category: "Tours", title: "Island hopping boat hire", budget: 1500, stars: 5 },
  { tab: "Tourism & Tours", category: "Tours", title: "Mt. Tapyas trekking guide", budget: 1800, stars: 5 },
  { tab: "Home Repair", category: "Repair", title: "AC cleaning at home", budget: 900, stars: 5 },
  { tab: "Home Repair", category: "Repair", title: "Fix leaking kitchen faucet", budget: 600, stars: 5 },
  { tab: "Home Cleaning", category: "Cleaning", title: "Move-out deep clean", budget: 2500, stars: 5 },
  { tab: "Home Cleaning", category: "Cleaning", title: "Weekly housekeeping", budget: 800, stars: 5 },
  { tab: "Digital Tasks", category: "Digital", title: "Thesis formatting help", budget: 1200, stars: 5 },
  { tab: "Digital Tasks", category: "Digital", title: "Social video edit this week", budget: 800, stars: 5 },
  { tab: "Salon & Wellness", category: "Salon", title: "Home gupit this weekend", budget: 250, stars: 5 },
  { tab: "Salon & Wellness", category: "Salon", title: "Pahilot after a long week", budget: 500, stars: 5 },
  { tab: "Pet Care", category: "Pets", title: "Dog sitting in San Pedro", budget: 500, stars: 5 },
  { tab: "Pet Care", category: "Pets", title: "Mobile pet bath", budget: 400, stars: 5 },
  { tab: "Something Else", category: "Errands", title: "Queue at city hall for documents", budget: 400, stars: 5 },
  { tab: "Something Else", category: "Errands", title: "Palengke run this morning", budget: 350, stars: 5 },
];

export const LANDING_TRUST = [
  {
    title: "You pay the tasker",
    desc: "Khaki charges a 2% posting fee to list the task. The job payment is negotiated and paid directly between you and the tasker.",
  },
  {
    title: "Trusted ratings and reviews",
    desc: "Pick the right person for the task based on real ratings and reviews from other Palaweños.",
  },
  {
    title: "Built for Palawan",
    desc: "Local towns, local taskers, and a 2% posting fee so more of the budget stays in the community.",
  },
];

export const LANDING_EARN_POINTS = [
  "Free access to jobs across Palawan",
  "No subscription — 2% posting fee only",
  "Earn extra income on a flexible schedule",
  "Grow your client base in your own town",
];

export const LANDING_TASKERS = [
  {
    name: "Juan Dela Cruz",
    location: "El Nido",
    rating: "4.9",
    ratings: 86,
    completion: "96%",
    specialties: "Island hopping, airport runs, van hire",
    bio: "Licensed tour assistance in El Nido. Khaki lets him pick up airport runs between tours.",
    quote: "On time, careful with luggage, and knew every shortcut from the airport.",
    reviewer: "Maria S.",
    initial: "J",
    tone: "#C9D6E0",
  },
  {
    name: "Ana Reyes",
    location: "Coron",
    rating: "4.8",
    ratings: 42,
    completion: "94%",
    specialties: "Home repair, AC cleaning, handyman",
    bio: "Ana takes home repair jobs around Coron and likes the flexibility of choosing her day.",
    quote: "Fixed both window-type units the same afternoon. Clean, honest, and clear on price.",
    reviewer: "Paolo R.",
    initial: "A",
    tone: "#E8DCC4",
  },
  {
    name: "Liza Mendoza",
    location: "Puerto Princesa",
    rating: "5.0",
    ratings: 31,
    completion: "98%",
    specialties: "Pabili, bills, personal assistance",
    bio: "Liza treats errands like a route. Same-day pabili is her specialty in San Pedro and San Miguel.",
    quote: "Groceries were complete, receipts were sent, and she even returned the extra change.",
    reviewer: "Nina C.",
    initial: "L",
    tone: "#C9CBA3",
  },
  {
    name: "Rico Banzon",
    location: "San Vicente",
    rating: "4.7",
    ratings: 19,
    completion: "93%",
    specialties: "Cleaning, pet sitting, odd jobs",
    bio: "Rico picked up Khaki for weekend work and now covers move-in cleans along the west coast.",
    quote: "Thorough, on time, and great with our dog while we were out.",
    reviewer: "Art H.",
    initial: "R",
    tone: "#E4D5B5",
  },
];

export const LANDING_FAQS = [
  {
    q: "What is KHAKI?",
    a: "KHAKI is Palawan's trusted platform to post tasks and find local help.",
  },
  {
    q: "How do I pay?",
    a: "Khaki charges a 2% posting fee when you list a task. The task payment itself is between you and the tasker — we do not hold it.",
  },
  {
    q: "Is it safe?",
    a: "Yes. We verify users and you can rate each other after every task.",
  },
];

export const LANDING_DISCLAIMER = {
  title: "Khaki is a platform only",
  body: "Khaki connects task posters with taskers but is not a party to any agreement between them. All arrangements, communications, payments, and outcomes are solely between the tasker and the task poster. Khaki charges a posting fee to list a task and provides platform features, but does not hold task payments, guarantee quality, safety, or completion of any task. Users engage at their own discretion and risk.",
};
