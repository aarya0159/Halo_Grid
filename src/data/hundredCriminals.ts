import { FaceWatchlistRecord, StatusType } from '../types';

// Let's seed a core group of realistic criminals
const FIRST_NAMES_MALE = [
  "Marcus", "David", "Kenji", "Liam", "Robert", "Viktor", "Julian", "Dante", "Zayn", "Arthur", 
  "Suresh", "Carlos", "Omar", "Hans", "Pierre", "Ivan", "Rajesh", "Hiroshi", "Ahmed", "Mateo",
  "Connor", "Dmitry", "Ethan", "Mustafa", "Lucas", "Arjun", "Leo", "Tyler", "Ryan", "Aleksei"
];

const LAST_NAMES_MALE = [
  "Vance", "Kovic", "Sato", "O'Connor", "Chen", "Petrov", "Alvarez", "Rossi", "Malik", "Pendelton",
  "Pillai", "Mendez", "Haddad", "Schmidt", "Dubois", "Smirnov", "Gupta", "Tanaka", "Mansoor", "Silva",
  "Gallagher", "Volkov", "Carter", "Demir", "Moreau", "Kumar", "Ricci", "Blackwood", "Sweeney", "Orlov"
];

const FIRST_NAMES_FEMALE = [
  "Elena", "Chloe", "Aisha", "Zara", "Sophia", "Nisha", "Emily", "Isabella", "Yuki", "Fatima",
  "Clara", "Sonia", "Anna", "Mei", "Amara", "Camila", "Lucia", "Heidi", "Tasha", "Priya",
  "Natasha", "Grace", "Olivia", "Ji-Woo", "Zahra", "Leila", "Svetlana", "Maya", "Emma", "Sora"
];

const LAST_NAMES_FEMALE = [
  "Rostova", "Tan", "binte Omar", "Sterling", "Martinez", "Patel", "Watson", "Vance", "Tanaka", "Farah",
  "Lefevre", "Fernandez", "Kuznetsova", "Chen", "Diallo", "Gomez", "Bianchi", "Weber", "Romanov", "Nair",
  "Sokolov", "Harding", "Brooks", "Kim", "Al-Jamil", "Hussain", "Ivanova", "Sen", "Davis", "Park"
];

const COUNTRIES_AND_LOCATIONS = [
  "Orchard Road Crossing", "Jurong East Bus Interchange", "Tampines Junction", 
  "City Hall Pedestrian Crossing", "Serangoon Road Traffic Light", "Bugis Street Junction",
  "Yishun Avenue Bus Stop", "Downtown Core Crossing", "Changi Airport Terminal 1",
  "Woodlands Checkpoint", "Tuas Second Link", "Marina Bay Promenade", "Sentosa Boardwalk"
];

const CRIME_PROMPTS = [
  {
    status: "Fugitive" as StatusType,
    notes: "Wanted for high-value cyber financial fraud and evasion of arrest. Known tech expert.",
    risk: "High" as const
  },
  {
    status: "Active Arrest Warrant" as StatusType,
    notes: "Subject of Interpol red notice for corporate espionage. Expert in disguised travel documents.",
    risk: "High" as const
  },
  {
    status: "Missing Person" as StatusType,
    notes: "Reported missing under suspicious circumstances. Relatives extremely concerned. Medical care required.",
    risk: "Medium" as const
  },
  {
    status: "Urgent Locate" as StatusType,
    notes: "Key material witness in an ongoing judicial inquiry. Evading service process under high security threat.",
    risk: "Medium" as const
  },
  {
    status: "Fugitive" as StatusType,
    notes: "Wanted for armed robbery at a secure warehouse facility. Extreme flight risk and potential access to weapons.",
    risk: "High" as const
  },
  {
    status: "Active Arrest Warrant" as StatusType,
    notes: "Warrant issued for severe commercial building code violations and failure to appear in court.",
    risk: "Low" as const
  },
  {
    status: "Fugitive" as StatusType,
    notes: "Accused of high-end jewelry heist. Known to use dramatic hairstyles, dyes, and cosmetics to alter appearance.",
    risk: "High" as const
  },
  {
    status: "Missing Person" as StatusType,
    notes: "Elderly individual suffering from advanced dementia. Wandered off from nursing care home. Vulnerable person.",
    risk: "High" as const
  },
  {
    status: "Urgent Locate" as StatusType,
    notes: "Required for court deposition regarding a major traffic accident. Evading service process.",
    risk: "Low" as const
  },
  {
    status: "Active Arrest Warrant" as StatusType,
    notes: "Violated terms of parole regarding wire fraud. Last seen driving a black executive sedan.",
    risk: "Medium" as const
  },
  {
    status: "Fugitive" as StatusType,
    notes: "Wanted in connection with international supply chain smuggling. Highly elusive with various aliases.",
    risk: "High" as const
  },
  {
    status: "Missing Person" as StatusType,
    notes: "Runaway youth, last seen boarding public transit with an unidentified individual. Immediate attention required.",
    risk: "High" as const
  },
  {
    status: "Active Arrest Warrant" as StatusType,
    notes: "Arrest warrant issued for multiple counts of aggravated assault following a major neighborhood altercation.",
    risk: "Medium" as const
  },
  {
    status: "Urgent Locate" as StatusType,
    notes: "Required for critical health safety contact. Believed to have contracted a highly transmissible disease.",
    risk: "Low" as const
  },
  {
    status: "Fugitive" as StatusType,
    notes: "Wanted for money laundering and organizing underground gambling rings. Extremist syndicate affiliations.",
    risk: "High" as const
  }
];

// Portrait images for variety
const PORTRAIT_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop", // Male 1
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop", // Female 1
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop", // Male 2
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop", // Female 2
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop", // Female 3
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop", // Male 3
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop", // Female 4
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop", // Male 4
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop", // Female 5
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop", // Male 5
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop", // Male 6
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop", // Female 6
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&h=300&fit=crop", // Male 7
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=300&h=300&fit=crop", // Female 7
  "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=300&h=300&fit=crop", // Male 8
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop", // Female 8
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop", // Male 9
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop", // Female 9
  "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=300&h=300&fit=crop", // Male 10
  "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=300&h=300&fit=crop"  // Male 11
];

export const generateHundredCriminals = (): FaceWatchlistRecord[] => {
  const criminals: FaceWatchlistRecord[] = [];

  // Seed the first 20 carefully as defined in original seededData
  const originalSeedData = [
    { name: "Marcus Vance", gender: "Male", image: PORTRAIT_IMAGES[0], notes: "Wanted for high-value cyber financial fraud and evasion of arrest. Known to frequent transport hubs.", age: "35-40", status: "Fugitive" as StatusType, risk: "High" as const },
    { name: "Elena Rostova", gender: "Female", image: PORTRAIT_IMAGES[1], notes: "Subject of Interpol red notice for corporate espionage. Expert in disguised travel documents.", age: "28-32", status: "Active Arrest Warrant" as StatusType, risk: "High" as const },
    { name: "Chloe Tan", gender: "Female", image: PORTRAIT_IMAGES[3], notes: "University student missing since Friday night. Family is extremely concerned. Depressed state indicated.", age: "19-22", status: "Missing Person" as StatusType, risk: "Medium" as const },
    { name: "David Kovic", gender: "Male", image: PORTRAIT_IMAGES[2], notes: "Wanted for armed robbery at a secure warehouse facility. Extreme flight risk and potential access to weapons.", age: "42-46", status: "Fugitive" as StatusType, risk: "High" as const },
    { name: "Aisha binte Omar", gender: "Female", image: PORTRAIT_IMAGES[4], notes: "Key material witness in an ongoing judicial inquiry. Relatives reported her missing under suspicious events.", age: "31-35", status: "Urgent Locate" as StatusType, risk: "Medium" as const },
    { name: "Kenji Sato", gender: "Male", image: PORTRAIT_IMAGES[5], notes: "Warrant issued for severe commercial building code violations and subsequent failure to appear in court.", age: "48-52", status: "Active Arrest Warrant" as StatusType, risk: "Low" as const },
    { name: "Zara Sterling", gender: "Female", image: PORTRAIT_IMAGES[6], notes: "Accused of high-end jewelry heist. Known to use dramatic hairstyles, dyes, and cosmetics to alter appearance.", age: "26-30", status: "Fugitive" as StatusType, risk: "High" as const },
    { name: "Liam O'Connor", gender: "Male", image: PORTRAIT_IMAGES[7], notes: "Elderly gentleman suffering from advanced dementia. Wandered off from nursing care home. Vulnerable person.", age: "65-70", status: "Missing Person" as StatusType, risk: "High" as const },
    { name: "Sophia Martinez", gender: "Female", image: PORTRAIT_IMAGES[8], notes: "Required for court deposition regarding a major traffic accident. Evading service process.", age: "23-27", status: "Urgent Locate" as StatusType, risk: "Low" as const },
    { name: "Robert Chen", gender: "Male", image: PORTRAIT_IMAGES[9], notes: "Violated terms of parole regarding wire fraud. Last seen driving a black executive sedan.", age: "33-37", status: "Active Arrest Warrant" as StatusType, risk: "Medium" as const },
    { name: "Viktor Petrov", gender: "Male", image: PORTRAIT_IMAGES[10], notes: "Wanted in connection with international supply chain smuggling. Highly elusive with various aliases.", age: "38-42", status: "Fugitive" as StatusType, risk: "High" as const },
    { name: "Nisha Patel", gender: "Female", image: PORTRAIT_IMAGES[11], notes: "Runaway youth, last seen boarding public transit with an unidentified individual. Immediate attention required.", age: "14-16", status: "Missing Person" as StatusType, risk: "High" as const },
    { name: "Julian Alvarez", gender: "Male", image: PORTRAIT_IMAGES[12], notes: "Arrest warrant issued for multiple counts of aggravated assault following a major neighborhood altercation.", age: "29-33", status: "Active Arrest Warrant" as StatusType, risk: "Medium" as const },
    { name: "Emily Watson", gender: "Female", image: PORTRAIT_IMAGES[13], notes: "Required for critical health safety contact. Believed to have contracted a highly transmissible disease.", age: "24-28", status: "Urgent Locate" as StatusType, risk: "Low" as const },
    { name: "Dante Rossi", gender: "Male", image: PORTRAIT_IMAGES[14], notes: "Wanted for money laundering and organizing underground gambling rings. Extremist syndicate affiliations.", age: "45-50", status: "Fugitive" as StatusType, risk: "High" as const },
    { name: "Isabella Vance", gender: "Female", image: PORTRAIT_IMAGES[15], notes: "Warrant issued for corporate wire fraud and illegal conversion of capital assets.", age: "32-36", status: "Active Arrest Warrant" as StatusType, risk: "Medium" as const },
    { name: "Zayn Malik", gender: "Male", image: PORTRAIT_IMAGES[16], notes: "Last seen at bus interchange heading north. Left behind luggage and mobile phone. Highly unusual behavior.", age: "21-25", status: "Missing Person" as StatusType, risk: "Medium" as const },
    { name: "Yuki Tanaka", gender: "Female", image: PORTRAIT_IMAGES[17], notes: "Owner of abandoned vehicle spotted on a major arterial bridge. Believed to be in distress.", age: "27-31", status: "Urgent Locate" as StatusType, risk: "Low" as const },
    { name: "Arthur Pendelton", gender: "Male", image: PORTRAIT_IMAGES[18], notes: "Convicted cyber hacker who violated house arrest. Extremist skills in altering identity traces.", age: "50-55", status: "Fugitive" as StatusType, risk: "High" as const },
    { name: "Suresh Pillai", gender: "Male", image: PORTRAIT_IMAGES[19], notes: "Sought for default on major financial regulatory summons and active contempt warrants.", age: "40-44", status: "Active Arrest Warrant" as StatusType, risk: "Medium" as const }
  ];

  // 1. Add first 20 records
  originalSeedData.forEach((orig, index) => {
    const idNum = String(index + 1).padStart(3, '0');
    criminals.push({
      watchlist_id: `WF-2026-${idNum}`,
      candidate_name: orig.name,
      case_id: `CASE-${1000 + index}-${orig.name[0]}`,
      status_type: orig.status,
      reference_face_image: orig.image,
      age_range: orig.age,
      gender: orig.gender,
      last_seen_location: COUNTRIES_AND_LOCATIONS[index % COUNTRIES_AND_LOCATIONS.length],
      last_seen_date: `2026-06-${String(Math.floor(10 + Math.random() * 14)).padStart(2, '0')}`,
      risk_priority: orig.risk,
      alert_threshold: orig.status === 'Missing Person' ? 70 : 75,
      notes: orig.notes
    });
  });

  // 2. Generate remaining 80 records programmatically with rich random combinations
  for (let i = 20; i < 100; i++) {
    const idNum = String(i + 1).padStart(3, '0');
    const isMale = Math.random() > 0.5;
    
    let candidate_name = "";
    let gender = "";
    if (isMale) {
      const fn = FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length];
      const ln = LAST_NAMES_MALE[(i * 3) % LAST_NAMES_MALE.length];
      candidate_name = `${fn} ${ln}`;
      gender = "Male";
    } else {
      const fn = FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
      const ln = LAST_NAMES_FEMALE[(i * 3) % LAST_NAMES_FEMALE.length];
      candidate_name = `${fn} ${ln}`;
      gender = "Female";
    }

    const crimeIndex = i % CRIME_PROMPTS.length;
    const crime = CRIME_PROMPTS[crimeIndex];
    
    // Cycle portrait images or add some random seeds for variety
    const image_index = i % PORTRAIT_IMAGES.length;
    const ref_image = PORTRAIT_IMAGES[image_index];

    const age_min = 18 + (i % 8) * 6;
    const age_range = `${age_min}-${age_min + 4}`;

    criminals.push({
      watchlist_id: `WF-2026-${idNum}`,
      candidate_name,
      case_id: `CASE-${2000 + i}-${candidate_name[0]}`,
      status_type: crime.status,
      reference_face_image: ref_image,
      age_range,
      gender,
      last_seen_location: COUNTRIES_AND_LOCATIONS[i % COUNTRIES_AND_LOCATIONS.length],
      last_seen_date: `2026-06-${String(Math.floor(5 + Math.random() * 19)).padStart(2, '0')}`,
      risk_priority: crime.risk,
      alert_threshold: crime.status === 'Missing Person' ? 70 : 75,
      notes: `${crime.notes} Last flagged near surveillance sector.`
    });
  }

  return criminals;
};

export const HUNDRED_CRIMINALS = generateHundredCriminals();
