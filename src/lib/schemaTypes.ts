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
export function* walkNodes(payload: unknown): Generator<Record<string, unknown>> {
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
  // First Organization-like node (for field validation in analyzeAiEra).
  // Microdata sites have this null — we can't extract fields without
  // walking itemprop attributes, which is out of scope for now.
  organizationNode: Record<string, unknown> | null;
}

export interface OrganizationFieldIssues {
  missingRequired: string[]; // name, url — Google requires these
  missingRecommended: string[]; // logo, sameAs, contactPoint — improves Knowledge Graph
}

export function validateOrganizationFields(
  node: Record<string, unknown>
): OrganizationFieldIssues {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  const hasNonEmpty = (key: string): boolean => {
    const v = node[key];
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return false;
  };

  if (!hasNonEmpty("name")) missingRequired.push("name");
  if (!hasNonEmpty("url")) missingRequired.push("url");
  if (!hasNonEmpty("logo")) missingRecommended.push("logo");
  if (!hasNonEmpty("sameAs")) missingRecommended.push("sameAs");
  if (!hasNonEmpty("contactPoint") && !hasNonEmpty("telephone") && !hasNonEmpty("email")) {
    missingRecommended.push("contactPoint (ან telephone/email)");
  }

  return { missingRequired, missingRecommended };
}

// ── Deep field validation ──────────────────────────────────────────────
// Beyond "does Organization have name+url", validate that the actual
// field VALUES are well-formed. Catches a common class of bug: a phone
// like "(+1) (555) 1234" that fails Google's E.164-ish parsing, or an
// "image" pointing to a relative path that Google's crawler can't fetch.
// We walk every JSON-LD node, not just Organization, because Product,
// LocalBusiness, Person etc. all share these field semantics.

export interface SchemaFieldIssue {
  field: string;
  type: string; // @type of the parent node (joined if array)
  value: string;
  reason: string;
}

export interface SchemaFieldIssues {
  invalidPhones: SchemaFieldIssue[];
  invalidEmails: SchemaFieldIssue[];
  invalidUrls: SchemaFieldIssue[];
  invalidCurrencies: SchemaFieldIssue[];
}

// Loose E.164-ish: optional +, then 7–15 digits with allowed separators.
// We don't enforce full E.164 because Google itself accepts national
// formats — we just reject obviously malformed entries like "555-CALL".
const PHONE_OK = /^[+]?[\s\d\-().  ]{7,30}$/;
const PHONE_DIGIT_COUNT = /(?:\d.*){7,15}/;
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_4217 = /^[A-Z]{3}$/;

function isUrlOk(v: string): boolean {
  // mailto:/tel: aren't really URLs in the http sense — Schema accepts
  // them in some contexts but they belong in their own fields.
  if (/^(mailto:|tel:)/i.test(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function nodeTypeLabel(node: Record<string, unknown>): string {
  const t = node["@type"];
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    return t.filter((x) => typeof x === "string").join("/") || "?";
  }
  return "?";
}

// Recursively collect all string values reachable from `node` whose key
// matches `targetKeys`. `node.contactPoint.telephone` should be found
// when walking from an Organization node looking for "telephone".
function* collectFieldStrings(
  node: unknown,
  targetKeys: Set<string>,
  depth = 0
): Generator<{ key: string; value: string; parent: Record<string, unknown> }> {
  if (depth > 6 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) yield* collectFieldStrings(item, targetKeys, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [key, val] of Object.entries(obj)) {
    if (targetKeys.has(key)) {
      if (typeof val === "string") {
        yield { key, value: val, parent: obj };
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === "string") yield { key, value: item, parent: obj };
        }
      }
    }
    if (val && typeof val === "object") {
      yield* collectFieldStrings(val, targetKeys, depth + 1);
    }
  }
}

export function validateSchemaFields(
  $: CheerioAPI
): SchemaFieldIssues {
  const out: SchemaFieldIssues = {
    invalidPhones: [],
    invalidEmails: [],
    invalidUrls: [],
    invalidCurrencies: [],
  };

  const PHONE_KEYS = new Set(["telephone", "faxNumber"]);
  const EMAIL_KEYS = new Set(["email"]);
  const URL_KEYS = new Set(["url", "image", "logo", "sameAs"]);
  const CURRENCY_KEYS = new Set(["priceCurrency", "currency"]);

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).html();
    if (!raw) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    for (const node of walkNodes(parsed)) {
      const typeLabel = nodeTypeLabel(node);
      for (const hit of collectFieldStrings(node, PHONE_KEYS)) {
        const trimmed = hit.value.trim();
        if (!trimmed) continue;
        if (!PHONE_OK.test(trimmed) || !PHONE_DIGIT_COUNT.test(trimmed)) {
          out.invalidPhones.push({
            field: hit.key,
            type: typeLabel,
            value: trimmed,
            reason:
              "ფორმატი არ ჯდება — Google იღებს E.164 ან ეროვნულ ფორმატებს. შემოწმე ციფრების რაოდენობა (7-15) და სიმბოლოები.",
          });
        }
      }
      for (const hit of collectFieldStrings(node, EMAIL_KEYS)) {
        const trimmed = hit.value.trim();
        if (!trimmed) continue;
        // schema spec lets email be "mailto:foo@bar.com" — strip prefix.
        const value = trimmed.replace(/^mailto:/i, "");
        if (!EMAIL_OK.test(value)) {
          out.invalidEmails.push({
            field: hit.key,
            type: typeLabel,
            value: trimmed,
            reason: "ემეილის ფორმატი არასწორია (RFC 5322).",
          });
        }
      }
      for (const hit of collectFieldStrings(node, URL_KEYS)) {
        const trimmed = hit.value.trim();
        if (!trimmed) continue;
        if (!isUrlOk(trimmed)) {
          out.invalidUrls.push({
            field: hit.key,
            type: typeLabel,
            value: trimmed,
            reason:
              "URL უნდა იყოს სრული http:// ან https:// — relative path ან tel:/mailto: Google-ისთვის არ ეთვლება valid.",
          });
        }
      }
      for (const hit of collectFieldStrings(node, CURRENCY_KEYS)) {
        const trimmed = hit.value.trim();
        if (!trimmed) continue;
        if (!ISO_4217.test(trimmed)) {
          out.invalidCurrencies.push({
            field: hit.key,
            type: typeLabel,
            value: trimmed,
            reason:
              "priceCurrency უნდა იყოს 3-ასოიანი ISO 4217 კოდი (USD, EUR, GEL). სიმბოლოები (₾, $) ან სრული სახელი არ მუშაობს.",
          });
        }
      }
    }
  });

  return out;
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
  let organizationNode: Record<string, unknown> | null = null;

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
      if (isOrganizationType(typeValue)) {
        hasOrganization = true;
        // Capture the first Organization-like node for field validation.
        // Pages typically have a primary Organization in @graph plus
        // references; the first hit is usually the canonical one.
        if (!organizationNode) organizationNode = node;
      }
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
    organizationNode,
  };
}
