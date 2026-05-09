import type { CheerioAPI } from "cheerio";

// Schema.org Organization subtype tree (most common ~150 types).
// Anything in this set means "is an Organization" per the schema.org
// hierarchy. Source: https://schema.org/Organization (subtypes are
// transitive — FurnitureStore is-a Store is-a LocalBusiness is-a
// Organization, so listing FurnitureStore alone is enough).
const ORGANIZATION_TYPES: ReadonlySet<string> = new Set([
  "Organization",
  // Direct subtypes
  "Airline",
  "Consortium",
  "Corporation",
  "EducationalOrganization",
  "FundingScheme",
  "GovernmentOrganization",
  "LibrarySystem",
  "LocalBusiness",
  "MedicalOrganization",
  "NewsMediaOrganization",
  "NGO",
  "OnlineBusiness",
  "OnlineStore",
  "PerformingGroup",
  "PoliticalParty",
  "Project",
  "ResearchOrganization",
  "SearchRescueOrganization",
  "SportsOrganization",
  "WorkersUnion",
  "Cooperative",
  // Educational subtypes
  "CollegeOrUniversity",
  "ElementarySchool",
  "HighSchool",
  "MiddleSchool",
  "Preschool",
  "School",
  // PerformingGroup subtypes
  "DanceGroup",
  "MusicGroup",
  "TheaterGroup",
  // SportsOrganization subtypes
  "SportsTeam",
  // LocalBusiness — major subtypes
  "AnimalShelter",
  "ArchiveOrganization",
  "AutomotiveBusiness",
  "ChildCare",
  "Dentist",
  "DryCleaningOrLaundry",
  "EmergencyService",
  "EmploymentAgency",
  "EntertainmentBusiness",
  "FinancialService",
  "FoodEstablishment",
  "GovernmentOffice",
  "HealthAndBeautyBusiness",
  "HomeAndConstructionBusiness",
  "InternetCafe",
  "LegalService",
  "Library",
  "LodgingBusiness",
  "MedicalBusiness",
  "ProfessionalService",
  "RadioStation",
  "RealEstateAgent",
  "RecyclingCenter",
  "SelfStorage",
  "ShoppingCenter",
  "SportsActivityLocation",
  "Store",
  "TelevisionStation",
  "TouristInformationCenter",
  "TravelAgency",
  // FoodEstablishment subtypes
  "Bakery",
  "BarOrPub",
  "Brewery",
  "CafeOrCoffeeShop",
  "Distillery",
  "FastFoodRestaurant",
  "IceCreamShop",
  "Restaurant",
  "Winery",
  // Store subtypes (where coridoor.ge's FurnitureStore lives)
  "BikeStore",
  "BookStore",
  "ClothingStore",
  "ComputerStore",
  "ConvenienceStore",
  "DepartmentStore",
  "ElectronicsStore",
  "Florist",
  "FurnitureStore",
  "GardenStore",
  "GroceryStore",
  "HardwareStore",
  "HobbyShop",
  "HomeGoodsStore",
  "JewelryStore",
  "LiquorStore",
  "MensClothingStore",
  "MobilePhoneStore",
  "MovieRentalStore",
  "MusicStore",
  "OfficeEquipmentStore",
  "OutletStore",
  "PawnShop",
  "PetStore",
  "ShoeStore",
  "SportingGoodsStore",
  "TireShop",
  "ToyStore",
  "WholesaleStore",
  // LodgingBusiness subtypes
  "BedAndBreakfast",
  "Campground",
  "Hostel",
  "Hotel",
  "Motel",
  "Resort",
  "SkiResort",
  "VacationRentals",
  // Medical
  "Hospital",
  "Pharmacy",
  "Physician",
  // Health/Beauty
  "BeautySalon",
  "DaySpa",
  "HairSalon",
  "HealthClub",
  "NailSalon",
  "TattooParlor",
  // Automotive
  "AutoBodyShop",
  "AutoDealer",
  "AutoPartsStore",
  "AutoRental",
  "AutoRepair",
  "AutoWash",
  "GasStation",
  "MotorcycleDealer",
  "MotorcycleRepair",
  // Construction/Home
  "Electrician",
  "GeneralContractor",
  "HVACBusiness",
  "HousePainter",
  "Locksmith",
  "MovingCompany",
  "Plumber",
  "RoofingContractor",
  // Entertainment
  "AdultEntertainment",
  "AmusementPark",
  "ArtGallery",
  "Casino",
  "ComedyClub",
  "MovieTheater",
  "NightClub",
  // Financial
  "AccountingService",
  "AutomatedTeller",
  "BankOrCreditUnion",
  "InsuranceAgency",
  // Legal
  "Attorney",
  "Notary",
  // Sports
  "ExerciseGym",
  "GolfCourse",
  "PublicSwimmingPool",
  "SportsClub",
  "StadiumOrArena",
  "TennisComplex",
  // Emergency
  "FireStation",
  "PoliceStation",
]);

// Extract @type as a string array, regardless of whether the source
// is a string ("Organization"), array (["FurnitureStore", "Organization"]),
// or missing. Empty array means "no type info".
export function getTypeStrings(value: unknown): string[] {
  if (typeof value === "string") return [value.trim()];
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function isOrganizationType(typeValue: unknown): boolean {
  return getTypeStrings(typeValue).some((t) => ORGANIZATION_TYPES.has(t));
}

export function isFAQPageType(typeValue: unknown): boolean {
  return getTypeStrings(typeValue).some(
    (t) => t === "FAQPage" || t === "QAPage"
  );
}

// Walk a parsed JSON-LD payload and yield every node that has a @type,
// flattening @graph nesting. Returns the original `unknown` items so
// callers can inspect other fields too.
function* walkNodes(payload: unknown): Generator<Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return;
  const items = Array.isArray(payload) ? payload : [payload];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (obj["@type"] !== undefined) yield obj;
    const graph = obj["@graph"];
    if (Array.isArray(graph)) {
      for (const g of graph) {
        if (g && typeof g === "object") {
          const gObj = g as Record<string, unknown>;
          if (gObj["@type"] !== undefined) yield gObj;
        }
      }
    }
  }
}

export interface ParsedSchemaInventory {
  // Every distinct @type observed (joined for arrays — kept as raw labels)
  types: string[];
  // Whether at least one node matches Organization / FAQPage
  hasOrganization: boolean;
  hasFAQPage: boolean;
  // Total count of JSON-LD <script> blocks (parsed or not)
  jsonLdBlocks: number;
  // Count of microdata entities (itemtype="schema.org/...")
  microdataBlocks: number;
  // Whether structured data exists at all (JSON-LD OR microdata OR RDFa)
  anyStructuredData: boolean;
}

const SCHEMA_ORG_HOST_RE = /(?:https?:)?\/\/schema\.org\/([A-Z][A-Za-z0-9]*)/;

function extractMicrodataTypes($: CheerioAPI): string[] {
  const types: string[] = [];
  $("[itemtype]").each((_, el) => {
    const raw = $(el).attr("itemtype");
    if (!raw) return;
    // itemtype may contain multiple space-separated URIs
    for (const part of raw.split(/\s+/)) {
      const m = part.match(SCHEMA_ORG_HOST_RE);
      if (m && m[1]) types.push(m[1]);
    }
  });
  return types;
}

function extractRdfaTypes($: CheerioAPI): string[] {
  const types: string[] = [];
  $("[typeof]").each((_, el) => {
    const raw = $(el).attr("typeof");
    if (!raw) return;
    // typeof values are space-separated, may use prefix like "schema:Organization"
    for (const part of raw.split(/\s+/)) {
      const cleaned = part.replace(/^(schema:|sd:|s:)/i, "").trim();
      if (cleaned) types.push(cleaned);
    }
  });
  return types;
}

export function inventorySchema($: CheerioAPI): ParsedSchemaInventory {
  const types: string[] = [];
  let hasOrganization = false;
  let hasFAQPage = false;
  let jsonLdBlocks = 0;

  $('script[type="application/ld+json"]').each((_, el) => {
    jsonLdBlocks++;
    const raw = $(el).html();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    for (const node of walkNodes(parsed)) {
      const typeValue = node["@type"];
      const typeStrings = getTypeStrings(typeValue);
      if (typeStrings.length > 0) types.push(typeStrings.join(", "));
      if (isOrganizationType(typeValue)) hasOrganization = true;
      if (isFAQPageType(typeValue)) hasFAQPage = true;
    }
  });

  const microdataTypes = extractMicrodataTypes($);
  const rdfaTypes = extractRdfaTypes($);
  for (const t of [...microdataTypes, ...rdfaTypes]) {
    types.push(t);
    if (ORGANIZATION_TYPES.has(t)) hasOrganization = true;
    if (t === "FAQPage" || t === "QAPage") hasFAQPage = true;
  }

  const microdataBlocks = microdataTypes.length + rdfaTypes.length;
  const anyStructuredData = jsonLdBlocks > 0 || microdataBlocks > 0;

  // Dedupe types preserving order
  const seen = new Set<string>();
  const uniqueTypes: string[] = [];
  for (const t of types) {
    if (!seen.has(t)) {
      seen.add(t);
      uniqueTypes.push(t);
    }
  }

  return {
    types: uniqueTypes,
    hasOrganization,
    hasFAQPage,
    jsonLdBlocks,
    microdataBlocks,
    anyStructuredData,
  };
}
