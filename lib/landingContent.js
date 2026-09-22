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

export const LANDING_CATEGORIES = [
  { key: "errands", title: "Pabili errands", desc: "Groceries, bills, and same-day pickups", bg: "#E8DCC4", href: "/browse", image: "/images/cards/realistics/pabili-errands.jpg" },
  { key: "transport", title: "Local transport", desc: "Airport runs, van hire, and rides", bg: "#C9D6E0", href: "/browse", image: "/images/cards/realistics/local-transport.jpg" },
  { key: "tourism", title: "Tourism & tours", desc: "Island hopping help and local guides", bg: "#C9CBA3", href: "/browse", image: "/images/cards/realistics/tourism-tours.jpg" },
  { key: "repair", title: "Home repair", desc: "AC, plumbing, and handyman work", bg: "#E2D3B3", href: "/browse", image: "/images/cards/realistics/home-repair.jpg" },
  { key: "cleaning", title: "Home cleaning", desc: "Move-in, deep clean, and tidy-ups", bg: "#DDE5C8", href: "/browse", image: "/images/cards/realistics/home-cleaning.jpg" },
  { key: "digital", title: "Digital tasks", desc: "Thesis help, design, and remote work", bg: "#EDE4C8", href: "/browse", image: "/images/cards/realistics/digital-tasks.jpg" },
  { key: "salon", title: "Salon & wellness", desc: "Gupit, pahilot, and at-home beauty", bg: "#E4D5B5", href: "/browse", image: "/images/cards/realistics/salon-wellness.jpg" },
  { key: "pets", title: "Pet care", desc: "Sitting, walking, and pet errands", bg: "#D5DEC4", href: "/browse", image: "/images/cards/realistics/pet-care.jpg" },
  { key: "other", title: "Something else", desc: "If Palawan locals can do it, post it", bg: "#F0E6D0", href: "/post", image: "/images/cards/realistics/something-else.jpg" },
];

export const LANDING_TASK_TABS = ["Errands", "Transport", "Tourism", "Home", "Something else"];

export const LANDING_TASKS = [
  { tab: "Errands", category: "Pabili", title: "Pabili groceries sa San Pedro", budget: 350, stars: 5 },
  { tab: "Errands", category: "Pabili", title: "Pay electric bill in San Miguel", budget: 200, stars: 5 },
  { tab: "Errands", category: "Assistance", title: "Queue at city hall for documents", budget: 400, stars: 5 },
  { tab: "Transport", category: "Transport", title: "Airport pickup to hotel", budget: 800, stars: 5 },
  { tab: "Transport", category: "Transport", title: "Van hire for 3 with luggage", budget: 1200, stars: 5 },
  { tab: "Transport", category: "Logistics", title: "Send packages PPC to El Nido", budget: 900, stars: 5 },
  { tab: "Tourism", category: "Tours", title: "Island hopping assistant", budget: 1500, stars: 5 },
  { tab: "Tourism", category: "Tours", title: "El Nido photo walk guide", budget: 1800, stars: 5 },
  { tab: "Tourism", category: "Tours", title: "Coron lagoon day-tour helper", budget: 2000, stars: 5 },
  { tab: "Home", category: "Repair", title: "AC cleaning at home", budget: 900, stars: 5 },
  { tab: "Home", category: "Cleaning", title: "End of lease clean", budget: 2500, stars: 5 },
  { tab: "Home", category: "Repair", title: "Fix leaking kitchen faucet", budget: 600, stars: 5 },
  { tab: "Something else", category: "Digital", title: "Thesis formatting help", budget: 1200, stars: 5 },
  { tab: "Something else", category: "Salon", title: "Home gupit this weekend", budget: 250, stars: 5 },
  { tab: "Something else", category: "Pets", title: "Dog sitting in San Pedro", budget: 500, stars: 5 },
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
