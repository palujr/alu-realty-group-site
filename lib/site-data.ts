export type Listing = {
  id: number;
  badge: string;
  location: string;
  price: number;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  status: "For sale" | "For lease" | "Sold";
  imagePosition: string;
};

export type TeamMember = {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  bio: string;
  specialties: string[];
  imageUrl?: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  clientName: string;
  context: string;
  scope: "team" | "individual";
  teamMemberId?: string;
  saleDate?: string;
};

export const listings: Listing[] = [
  {
    id: 1,
    badge: "NEW",
    location: "McCormick Ranch · Scottsdale",
    price: 1275000,
    address: "8421 E. San Miguel Avenue",
    beds: 4,
    baths: 3,
    sqft: 2842,
    status: "For sale",
    imagePosition: "center 53%"
  },
  {
    id: 2,
    badge: "OPEN SAT 11-2",
    location: "Arcadia Lite · Phoenix",
    price: 895000,
    address: "3927 N. 41st Place",
    beds: 3,
    baths: 2,
    sqft: 2135,
    status: "For sale",
    imagePosition: "center 67%"
  },
  {
    id: 3,
    badge: "PRICE IMPROVED",
    location: "Kierland · Scottsdale",
    price: 1549000,
    address: "6502 E. Helena Drive",
    beds: 4,
    baths: 4,
    sqft: 3268,
    status: "For sale",
    imagePosition: "center 45%"
  },
  {
    id: 4,
    badge: "FOR LEASE",
    location: "Old Town · Scottsdale",
    price: 4850,
    address: "7147 E. Rancho Vista Drive",
    beds: 2,
    baths: 2,
    sqft: 1375,
    status: "For lease",
    imagePosition: "center 58%"
  },
  {
    id: 5,
    badge: "NEW",
    location: "Paradise Valley",
    price: 2325000,
    address: "6840 E. Hummingbird Lane",
    beds: 5,
    baths: 4,
    sqft: 4150,
    status: "For sale",
    imagePosition: "center 38%"
  },
  {
    id: 6,
    badge: "RECENTLY SOLD",
    location: "North Scottsdale",
    price: 1140000,
    address: "10218 E. Desert Cove Avenue",
    beds: 3,
    baths: 3,
    sqft: 2690,
    status: "Sold",
    imagePosition: "center 72%"
  }
];

export const teamMembers: TeamMember[] = [
  {
    id: "phil-alu",
    name: "Phil Alu",
    title: "Realtor | Alu Realty Group",
    phone: "(480) 555-0124",
    email: "phil@whatmovesyou.com",
    bio: "Phil helps Arizona buyers and sellers make confident decisions with practical market guidance, clear communication, and a steady process from first conversation to closing.",
    specialties: ["Buyers", "Sellers", "Relocation", "Market strategy"]
  },
  {
    id: "denise-alu",
    name: "Denise Alu",
    title: "Realtor | Alu Realty Group",
    phone: "(480) 555-0125",
    email: "denise@whatmovesyou.com",
    bio: "Denise brings warmth, detail, and follow-through to the client experience, helping people feel informed and cared for through each step of the move.",
    specialties: ["Client care", "Home preparation", "Buyer guidance", "Follow-up"]
  }
];

export const testimonials: Testimonial[] = [
  {
    id: "team-1",
    quote: "Phil and Denise made the process feel calm and organized from the first showing through closing.",
    clientName: "Buyer Client",
    context: "Scottsdale purchase",
    scope: "team"
  },
  {
    id: "phil-1",
    quote: "Phil explained the market clearly and helped us make a smart offer without feeling rushed.",
    clientName: "Relocation Client",
    context: "North Scottsdale",
    scope: "individual",
    teamMemberId: "phil-alu"
  },
  {
    id: "denise-1",
    quote: "Denise stayed on top of the details and made sure we always knew what came next.",
    clientName: "Seller Client",
    context: "Phoenix sale",
    scope: "individual",
    teamMemberId: "denise-alu"
  }
];
