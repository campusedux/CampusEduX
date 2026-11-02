/**
 * The current jobs contract has only free-text location/description and work_mode
 * (migrations 0010/0113/0114). Never infer geography from a city, salary or brand.
 * Google: https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
const ISO_REGIONS = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
  "NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
  "UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = new Map(ISO_REGIONS.map(code => [regionNames.of(code)!.toLowerCase(), code]));
// A bare "Georgia" can be a US state. Abbreviations (including IN/CA/GA) are
// deliberately unsupported too; losing markup is safer than guessing a country.
countries.delete("georgia");

type JobGeographySource = {
  location?: string | null;
  work_mode?: string | null;
  description?: string | null;
};
type Place = { "@type": "Place"; name: string; address: { "@type": "PostalAddress"; addressCountry: string } };
type Country = { "@type": "Country"; name: string };
type JobGeography = {
  jobLocation?: Place | Place[];
  jobLocationType?: "TELECOMMUTE";
  applicantLocationRequirements?: Country | Country[];
};

function countryList(text: string): string[] | null {
  const codes = text.split(";").map(name => countries.get(name.trim().toLowerCase()));
  return codes.length && codes.every((code): code is string => Boolean(code)) ? [...new Set(codes)] : null;
}

/**
 * Accept only unambiguous source declarations. Unsupported formats return null,
 * withholding the entire JobPosting, while the page and breadcrumbs remain.
 * This recognizes explicit text; it does not geocode or certify a live record.
 */
export function jobPostingGeography(job: JobGeographySource): JobGeography | null {
  if (job.work_mode === "Remote") {
    const description = job.description ?? "";
    // Work mode alone does not establish 100% remote work or applicant eligibility.
    // These complete lines must be in the visible description. Country-level
    // restrictions only: never broaden a city/state restriction to a whole country.
    if (!/^(?:This (?:job|role|position) is )?(?:100%|fully) remote[.!]?\s*$/im.test(description)
      || /\b(?:hybrid|on[- ]?site)\b/i.test(description)) return null;
    const declarations = [...description.matchAll(/^Applicants must be located in ([^\r\n]+?)\.?\s*$/gim)];
    if (declarations.length !== 1) return null;
    const eligible = countryList(declarations[0][1]);
    if (!eligible) return null;
    // If location itself states countries, they must agree with the description.
    // "Remote"/empty location supplies no additional geographic claim.
    const location = job.location?.trim();
    if (location && location.toLowerCase() !== "remote") {
      const listed = countryList(location);
      if (!listed || listed.length !== eligible.length || listed.some(code => !eligible.includes(code))) return null;
    }
    const requirements: Country[] = eligible.map(code => ({ "@type": "Country", name: regionNames.of(code)! }));
    return {
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: requirements.length === 1 ? requirements[0] : requirements,
    };
  }

  // Unknown work mode cannot establish a physical worksite. Hybrid retains its
  // physical location(s) and must never be advertised as 100% remote.
  if (job.work_mode !== "On-site" && job.work_mode !== "Hybrid") return null;
  if (!job.location?.trim()) return null;
  const places: Place[] = [];
  for (const location of job.location.split(";")) {
    const parts = location.trim().split(",").map(part => part.trim());
    const country = countries.get(parts[parts.length - 1].toLowerCase());
    // Only explicit "place, Country" (optionally with more address components).
    // Preserve the source as Place.name rather than guessing city/region/street
    // roles from comma positions. Every member must have its own full country.
    if (parts.length < 2 || !country || parts.slice(0, -1).some(part =>
      !/^[\p{L}\p{M}\d .’'()-]+$/u.test(part)
      || !/\p{L}/u.test(part)
      || countries.has(part.toLowerCase())
      || /\b(?:remote|hybrid|anywhere|worldwide|global|unknown|unspecified|undisclosed|tbd|n\/a|not|or|and)\b/i.test(part)
    )) return null;
    places.push({
      "@type": "Place",
      name: location.trim(),
      address: { "@type": "PostalAddress", addressCountry: country },
    });
  }
  return { jobLocation: places.length === 1 ? places[0] : places };
}
