export const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/for-ci', label: 'For C&I' },
  { href: '/for-generators', label: 'For generators' },
  { href: '/blog', label: 'Blogs' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export const resourceLinks = [
  { href: '/things-to-know', label: 'Things to know before switching' },
  { href: '/regulatory-guide', label: 'Regulatory guide' },
  { href: '/glossary', label: 'Glossary of terms' },
  { href: '/savings-calculator', label: 'Savings calculator' },
];

export const legalLinks = [
  { href: '/privacy-terms', label: 'Privacy Policy & Terms' },
];

export const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export interface LaunchPhoto {
  src: string;
  caption: string;
  /** CSS rotation fix, in degrees, for a source file that lost its EXIF orientation. */
  rotate?: number;
  /** CSS aspect-ratio value (e.g. '854 / 1139'), for a set whose photos aren't all the same
   *  shape. Measured from the actual source file, not guessed — see LaunchCarousel.tsx for how
   *  it's applied. Omit when every photo in the set shares one known ratio (default 1/1). */
  aspectRatio?: string;
}

export const launchCaptionMeta = '7th CII International Energy Conference & Exhibition · India · 2026';

const inauguralCaption =
  "WattMatch's stall inaugurated by Shri Prahlad Joshi, Hon'ble Union Minister for New and Renewable Energy, Education and Consumer Affairs, Food & Public Distribution.";

export const launchPhotos: LaunchPhoto[] = [
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaugural_1.webp', caption: inauguralCaption },
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaugural_2.webp', caption: inauguralCaption },
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaugural_3.webp', caption: inauguralCaption },
];

// Same event/stall as launchPhotos above (7th CII International Energy Conference & Exhibition),
// a different notable visitor.
const gujaratMinisterCaption =
  "We were honoured to welcome the Hon'ble Minister of Health & Family Welfare, Government of Gujarat, to the WattMatch stall.";

export const inaugDayPhotos: LaunchPhoto[] = [
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaug_photo_1.webp', caption: gujaratMinisterCaption, aspectRatio: '854 / 1139' },
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaug_photo_2.webp', caption: gujaratMinisterCaption, aspectRatio: '1280 / 672' },
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaug_photo_3.webp', caption: gujaratMinisterCaption, aspectRatio: '854 / 1137' },
  { src: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/inaug_photo_4.webp', caption: gujaratMinisterCaption, aspectRatio: '960 / 1280' },
];

export const heroStats = [
  { value: '~50%', label: "of India's electricity is C&I" },
  { value: '~915 TWh', label: 'annual C&I demand' },
  { value: '~6%', label: 'of it currently solar' },
  { value: '271 → 458 GW', label: 'peak demand by 2032' },
];

export const beyondCostReasons = [
  {
    color: 'var(--solar)',
    title: 'Carbon credits & ESG disclosure',
    body: "Under the Carbon Credit Trading Scheme (CCTS), 2023, obligated industrial facilities can earn tradeable carbon credit certificates for cutting emissions. SEBI's BRSR framework already requires India's top 1,000 listed companies to disclose Scope 1 & 2 emissions: solar directly improves that number.",
  },
  {
    color: 'var(--ink)',
    title: 'Energy security & tariff predictability',
    body: 'A 25-year RE PPA locks in your rate for the life of the contract, insulating your P&L from DISCOM hikes that have run 5–8% a year, and as high as 15% in some states.',
  },
  {
    color: 'var(--copper)',
    title: 'Global supply-chain access',
    body: 'International buyers increasingly expect RE100-style commitments from their Indian suppliers. For exporters, credible renewable sourcing is becoming a market-access requirement, not just a preference.',
  },
  {
    color: '#6B4A9E',
    title: 'Regulatory compliance (RCO)',
    body: "India's Renewable Consumption Obligation is legally binding for large consumers, DISCOMs and captive users, rising to 43.33% by FY 2029–30, with financial penalties for falling short.",
  },
  {
    color: 'var(--solar-dark)',
    title: 'Competitiveness & margins',
    body: 'For energy-intensive sectors like steel, cement and textiles, power is a meaningful share of operating cost. A 25–50% reduction in the energy line flows straight through to margin.',
  },
];

export const guaranteeCards = [
  {
    label: 'Best output',
    title: 'Generation you can rely on',
    body: 'Every generator on the marketplace passes technical due-diligence before they can bid, and we keep monitoring performance after the deal is live, not just at signing.',
  },
  {
    label: 'Best terms',
    title: 'Priced by competition, not negotiation',
    body: 'Multiple vetted generators compete for your demand in a live auction, and every contract runs on a standardised, pre-vetted PPA: no clause-by-clause back-and-forth.',
  },
  {
    label: 'Best quality',
    title: 'Financially and technically sound partners',
    body: "We screen every generator's financial health and delivery track record, so the name on your contract is one you can actually count on for 25 years.",
  },
];

export const withoutWattmatch = [
  'Hire or assign an in-house energy manager',
  'Retain a consultant to benchmark tariffs',
  'Negotiate PPA clauses with a lawyer, generator by generator',
  "Vet each generator's technical and financial credibility yourself",
  'Track performance and compliance on your own',
];

export const withWattmatch = [
  'One team sources and manages your entire renewable transition',
  'Pricing benchmarked continuously through live competitive auctions',
  'Standardised, pre-vetted PPAs: signed, not negotiated line by line',
  'Every generator pre-screened before they ever reach you',
  'Ongoing monitoring and ESG/RCO-ready reporting, handled for you',
];

export const howItWorksSteps = [
  { num: '01', title: 'Submit', body: 'Share your load profile, location and requirement. That’s your only job.' },
  { num: '02', title: 'Bid', body: 'Verified generators compete for your demand in a live auction.' },
  { num: '03', title: 'Benchmark', body: 'We score every bid on price and credibility: no benchmarking effort on your end.' },
  { num: '04', title: 'Match', body: 'Review your best-fit offer under a pre-vetted PPA, ready to sign.' },
  { num: '05', title: 'Manage', body: 'Power flows, and we keep monitoring performance and terms for as long as the contract runs.' },
];

export const ciBenefits: { strong?: string; text: string }[] = [
  { strong: 'Zero in-house lift', text: ': no energy team, no outside consultant, no market benchmarking. We source, vet, negotiate and monitor on your behalf.' },
  { text: 'Best-in-market pricing through a live, competitive auction, not one-to-one bargaining.' },
  { text: 'Standardised, pre-vetted PPAs: no clause-by-clause legal hassle.' },
  { text: 'Every generator pre-screened on technical and financial credibility, so the name on your contract is one you can trust.' },
  { text: "Access to sharply-priced smaller generators you'd never find on your own." },
  { text: 'A ready pipeline of offers, not months of vendor hunting, zero sourcing effort on your side.' },
  { text: 'Documentation that supports your ESG and RCO compliance reporting, generated as a by-product, not extra work.' },
];

export const generatorBenefits: { strong?: string; text: string }[] = [
  { strong: 'No sales or BD team required', text: ': Wattmatch brings qualified, ready-to-transact C&I demand straight to your pipeline.' },
  { text: "We vet you once: clients don't have to take our word for it, they see the check." },
  { text: 'Trust, transferred: our mechanisms give buyers the confidence to back a smaller or newer name.' },
  { text: 'Best-terms outcomes: compete on merit and price, not brand recognition.' },
  { text: 'A constant, qualified pipeline: instead of expensive, uncertain business development.' },
];

export const modelStats = [
  { value: '~50%', label: "of India's electricity is consumed by commercial & industrial users" },
  { value: '~6%', label: 'of that C&I demand is currently met by RE' },
  { value: '25–50%', label: 'typical cost saving available by switching, depending on state and load profile' },
];

export const fullJourneySteps = [
  { title: 'Registration', body: 'Basic details on location, annual electricity bills, and consumption shift patterns: takes about 20 minutes.' },
  { title: 'Requirement finalisation', body: 'Alignment on tender conditions, capacity, structure (rooftop or open access), timelines and generator criteria.' },
  { title: 'Tender published', body: "Your requirement goes live to Wattmatch's vetted generator pool." },
  { title: 'Generators quote', body: 'Vetted developers submit bids with tariff, technology, delivery timeline and performance guarantees.' },
  { title: 'Reverse auction', body: 'Price competition drives the tariff down. You see every bid, ranked transparently.' },
  { title: 'Contract signed', body: 'A Wattmatch-standardised PPA is executed between generator and C&I on the marketplace and reviewed by marketplace legal.' },
  { title: 'Escrow opened', body: 'The developer deposits performance security into a marketplace-managed escrow, protecting you against non-delivery.' },
  { title: 'Electricity flows', body: "Post-commissioning, metered units flow, DISCOM billing hits escrow, repeating monthly for the life of the contract." },
  { title: 'Ongoing management', body: 'Contract enforcement, performance monitoring, regulatory compliance tracking, refinancing support and carbon credit registry: all handled for you.' },
];

export const over15YearsItems = [
  { title: 'Contract enforcement', body: 'Monitors PPA compliance, escalates breaches, manages dispute resolution as an independent arbiter.' },
  { title: 'Performance monitoring', body: 'Tracks actual generation against the PPA guarantee, and alerts you if generation falls below contracted levels.' },
  { title: 'Escrow management', body: 'Administers monthly payment flows, ensures the generator is paid only for units actually delivered, and processes penalty deductions.' },
  { title: 'Regulatory compliance', body: 'Monitors changing open-access rules, RCO updates and banking policies across states, and flags changes to both parties.' },
  { title: 'Refinancing support', body: "Assists developers in refinancing projects at better rates post-commissioning, using the marketplace's aggregated track record." },
  { title: 'Carbon credit registry', body: 'Registers your renewable consumption and helps manage tradeable carbon credits under India’s CCTS framework.' },
];

export const whySwitchNow = [
  { title: "It's no longer optional", body: "India's RCO mandate rises from ~30% today to 43.33% by FY 2029–30, with financial penalties for falling short." },
  { title: 'Costs only move one way', body: 'Grid tariffs keep climbing. A renewable PPA is largely fixed for the life of the contract.' },
  { title: 'Investors are asking', body: 'ESG commitments, RE100-style disclosures and carbon credit upside turn renewables into a differentiator.' },
  { title: 'The window is wide open', body: 'Only ~6% of C&I demand runs on solar today: moving early means better pricing and first pick of generators.' },
];

export const generatorOffers = [
  { title: 'Qualified deal pipeline', body: 'Access to live C&I tenders that match your capacity and location, not cold leads.' },
  { title: 'Substation & grid intelligence', body: 'Marketplace-level data on connectivity and grid access to help you plan and bid smarter.' },
  { title: 'Project finance facilitation', body: 'Support connecting to the PE and infrastructure capital actively looking for bankable C&I offtake agreements.' },
  { title: 'Refinancing support', body: "Assistance refinancing projects at better rates post-commissioning, using the marketplace's aggregated track record." },
  { title: 'Escrow-backed, on-time payment', body: "Monthly payment flows administered by the marketplace: you're paid for units delivered, on schedule." },
  { title: 'Group captive facilitation', body: 'Support structuring and aggregating demand for group captive project models.' },
];

export const vettingProcess = [
  { title: 'Technical review', body: 'Track record, project quality, technology and delivery capability assessed.' },
  { title: 'Financial screening', body: "Balance sheet strength and delivery reliability checked before you're allowed to bid." },
  { title: 'Live on the marketplace', body: "Once vetted, you're visible to every matching C&I tender: no cold outreach needed." },
];

export const faqItems = [
  { q: 'What exactly is Wattmatch?', a: 'Wattmatch is a neutral marketplace connecting commercial & industrial (C&I) electricity buyers with vetted RE generators across India. We run a competitive auction for price discovery, provide a standardised pre-vetted PPA, and manage the relationship: escrow, performance monitoring, compliance, for the life of the contract.' },
  { q: 'Is Wattmatch a generator, or does it buy/sell power?', a: 'No. Wattmatch is never a principal buyer or seller of power. We facilitate the match between a C&I client and a generator: the two parties transact directly under a PPA.' },
  { q: 'How does Wattmatch make money?', a: 'We charge a marketplace fee per unit of electricity delivered under a matched contract, charged only once power is flowing, with minimal upfront cost to either side. We may also charge a modest processing fee to cover vetting costs.' },
 
  { q: "What's the minimum load required to use Wattmatch?", a: "India's Green Open Access Rules (2022) lowered the minimum eligible load for open access from 1 MW to 100 kW, opening the door to a much larger set of C&I consumers. Wattmatch is built to serve this broader range from 100kW onwards, with a particular focus on small and mid-sized consumers who are currently underserved." },
  { q: 'How long is a typical contract?', a: "Most C&I RE PPAs run 15–25 years, matching the useful life of a RE asset. Wattmatch's standardised PPA framework is built around this horizon, with ongoing monitoring and support for the full term, not just at signing." },
  { q: 'What happens if a generator underperforms or defaults?', a: 'Every generator deposits performance security into a marketplace-managed escrow at contract signing. If generation falls below the contracted guarantee, Wattmatch tracks it, alerts the C&I client, and manages penalty deductions and dispute resolution as an independent arbiter.' },
  { q: 'How are generators vetted?', a: "Every generator goes through a technical review (track record, project quality, delivery capability) and a financial screening (balance sheet strength, delivery reliability) before they're allowed to bid on any C&I tender." },
  { q: 'Can smaller or newer generators really compete?', a: 'Yes, that\'s a core part of why Wattmatch exists. Once vetted, a new entrant competes on price and terms in the same auction as established players, rather than being shut out purely for lack of brand recognition or an existing sales relationship.' },
  { q: 'How much can a C&I buyer typically save?', a: 'Based on current published tariff data, typical savings range from 25–50% versus grid/DISCOM rates, depending on state, load profile and contract structure. Use our savings calculator for an estimate specific to your load.' },
  { q: 'Do I need my own legal or energy team to use Wattmatch?', a: "No, that's the point. Wattmatch's standardised, pre-vetted PPA and end-to-end management are designed so you don't need an in-house energy manager, an outside consultant, or your own market benchmarking exercise." },
  { q: 'What states does Wattmatch operate in?', a: "We're building state-by-state, prioritising markets with the largest concentration of C&I demand and generator supply. Open access rules, wheeling and banking provisions vary by state: see our Regulatory Guide for more detail." },
];

export const thingsToKnow = [
  { title: 'Rooftop vs. open access: two different models', body: 'Rooftop solar is installed on your own premises and directly offsets your consumption, simple, but limited by how much roof or land you actually have. Open access lets you buy power from a renewables plant located elsewhere (including a different state), delivered to you through the grid, unlocking much larger capacity than your rooftop could ever support, but bringing in transmission and wheeling charges, cross-subsidy surcharges, and more regulatory moving parts.' },
  { title: 'Know your eligibility threshold', body: "India's Green Open Access Rules (2022) lowered the minimum load eligible for open access from 1 MW to 100 kW, opening the door to a much wider set of mid-sized C&I consumers who previously couldn't participate. Check your connected load and consumption pattern before assuming you don't qualify." },
  { title: 'Contracts run long: plan accordingly', body: "Most RE PPAs run 15–25 years, matched to the useful life of the asset. That's a real commitment: think through your facility's expected life, any planned relocation or expansion, and how a long tariff lock-in interacts with your own growth plans before signing." },
  { title: 'Fixed tariff vs. escalating tariff', body: 'Some PPAs offer a flat tariff for the full term; others build in a small annual escalation. A flat tariff is easier to forecast; an escalating one may start lower but rise over time. Understand which structure you’re being offered, and model both against your expected DISCOM tariff trajectory.' },
  { title: 'Vet the generator, not just the price', body: "The lowest bid isn't automatically the best deal if the generator lacks the financial strength or track record to deliver reliably over 15+ years. Look at technical capability, financial health, and delivery history, not tariff alone." },
  { title: 'Understand wheeling, banking and losses', body: '"Banking" provisions let you export surplus daytime solar and draw it back later; banking rules and any associated charges differ significantly by state. If you\'re buying power generated elsewhere, it travels through the grid to reach you, incurring wheeling charges and transmission losses along the way, both of which vary by state.' },
  { title: 'Factor in your compliance obligations', body: "India's Renewable Consumption Obligation (RCO) requires large consumers to source a rising share of power from renewables, currently around 30%, climbing to 43.33% by FY 2029–30, with financial penalties for shortfalls. If you're a designated consumer, switching isn't just an economic choice; it's increasingly a compliance one." },
  { title: "Don't underestimate the admin burden, or the ways to avoid it", body: 'Negotiating a PPA, vetting a generator, and managing a 15-year relationship is real, ongoing work if you do it yourself, which is exactly the gap a marketplace like Wattmatch is built to close.' },
];

export const regulatoryProcessSteps = [
  { title: 'Confirm eligibility', body: "Check your connected/contracted load against your state's open access threshold (100 kW minimum, per the 2022 rules)." },
  { title: 'Choose your structure', body: 'Decide between a captive, group captive, or third-party open access model: each has different ownership and regulatory implications.' },
  { title: 'Apply for connectivity', body: 'Submit a formal application to your DISCOM / state transmission utility for grid connectivity and open access approval.' },
  { title: 'Secure regulatory approval', body: 'Your SERC reviews and approves the open access application, including wheeling and banking terms.' },
  { title: 'Execute agreements', body: 'Sign the PPA with your generator and the wheeling/connection agreements with the relevant DISCOM(s).' },
  { title: 'Commissioning & metering', body: 'Once the generator commissions the plant, net/gross metering is installed and billing begins flowing through the agreed structure.' },
];

export const regulatoryCharges = [
  { charge: 'Wheeling charges', what: 'Fee for using the grid to transport power from the generator to your site, set by the state.' },
  { charge: 'Cross-subsidy surcharge (CSS) (for non-captive plants)', what: 'A charge that compensates the DISCOM for the subsidy it would otherwise have collected from you as a captive tariff customer.' },
  { charge: 'Additional surcharge (for non-captive plants)', what: "Charged in some states to cover the DISCOM's stranded fixed costs when a large consumer moves to open access." },
  { charge: 'Transmission & distribution losses', what: 'A small percentage of energy lost in transit, typically deducted from the units you’re billed for.' },
  { charge: 'Banking charges', what: 'Where applicable, a fee (sometimes in-kind, as a percentage of banked units) for the ability to export excess solar and draw it back later.' },
];

export const glossaryTerms = [
  { term: 'Renewable Energy', abbr: 'RE', body: 'Electricity generated from renewable sources such as solar and wind, as distinct from conventional fossil-fuel-based grid power.' },
  { term: 'Power Purchase Agreement', abbr: 'PPA', body: 'The contract between a power buyer and a generator, setting out tariff, term, delivery and performance obligations, typically 15–25 years for RE.' },
  { term: 'Open Access', abbr: 'OA', body: 'The regulatory right for an eligible consumer to buy electricity from a generator other than their local DISCOM, using the shared grid to transport it.' },
  { term: 'Distribution Company', abbr: 'DISCOM', body: 'The state-licensed utility responsible for distributing and billing electricity to consumers in a given area.' },
  { term: 'State Electricity Regulatory Commission', abbr: 'SERC', body: 'The state-level regulator that sets tariffs for utilities, approves open access applications, and oversees electricity distribution within a state.' },
  { term: 'Capacity Utilisation Factor', abbr: 'CUF', body: 'The ratio of actual energy a plant generates over a year to what it would generate running at full rated capacity 24/7. Indian solar plants typically run at 19–22% CUF.' },
  { term: 'Wheeling', abbr: null, body: 'The use of the shared electricity grid to transport power from a generator to a buyer located elsewhere, in exchange for a wheeling charge.' },
  { term: 'Banking', abbr: null, body: 'A provision allowing a consumer to export surplus solar generation to the grid during the day and draw an equivalent amount back later (e.g. at night), subject to state-specific rules and charges.' },
  { term: 'Renewable Consumption Obligation', abbr: 'RCO', body: 'A binding requirement for designated large consumers, DISCOMs and captive users to source a rising share of their electricity from renewables, the successor to the older RPO framework.' },
  { term: 'Renewable Purchase Obligation', abbr: 'RPO', body: 'The older procurement-focused mandate that RCO has largely superseded; RPO required DISCOMs to purchase a share of renewable power, with lighter enforcement at the individual consumer level.' },
  { term: 'Green Open Access Rules, 2022', abbr: 'GOA', body: 'The central rules that lowered the minimum load eligible for open access from 1 MW to 100 kW, and simplified the application process.' },
  { term: 'Captive / Group Captive', abbr: null, body: 'An ownership model where a consumer (or a group of consumers) holds at least 26% equity in the generating plant and consumes a minimum share of its output, which can unlock certain regulatory and charge exemptions.' },
  { term: 'Cross-Subsidy Surcharge', abbr: 'CSS', body: 'A charge levied on a consumer moving to open access, compensating the DISCOM for the subsidy revenue it would otherwise have collected from that consumer.' },
  { term: 'Additional Surcharge', abbr: 'AS', body: "A charge in some states covering the DISCOM's stranded fixed costs when a large consumer shifts load away to open access." },
  { term: 'Net Metering', abbr: null, body: "A billing arrangement (typically for smaller rooftop systems) that nets a consumer's exported solar generation against their grid consumption." },
  { term: 'Renewable Energy Certificate', abbr: 'REC', body: 'A tradeable certificate representing proof that one unit of electricity was generated from a renewable source, separable from the underlying power itself.' },
  { term: 'Carbon Credit Trading Scheme, 2023', abbr: 'CCTS', body: "India's domestic carbon market framework, under which obligated entities can generate and trade carbon credit certificates for emissions reductions." },
  { term: 'Business Responsibility & Sustainability Reporting', abbr: 'BRSR', body: "SEBI's mandatory ESG disclosure framework for India's largest listed companies, requiring reporting on emissions including Scope 1 and 2." },
  { term: 'Commercial & Industrial', abbr: 'C&I', body: 'Shorthand for commercial and industrial electricity consumers: offices, retail, hospitality, manufacturing, and similar large non-residential loads.' },
];

export const teamMembers = [
  {
    initials: 'SM',
    name: 'Shailesh Kumar Mishra',
    role: 'Co-Founder',
    bg: 'Background with SECI and Power Grid Corporation of India',
    why: 'First-hand institutional experience at the organisations behind India’s largest renewable aggregation and grid-scale power trading model, direct credibility with DISCOMs, regulators and generators.',
    lead: false,
    photo: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/final_img1_sk.webp',
  },
  {
    initials: 'NS',
    name: 'Naga Satyam',
    role: 'Co-Founder',
    bg: "2.5 decades building and backing India's clean mobility and energy infrastructure, as a founder, operator, and early-stage investor.",
    why: 'Sector fluency across the power value chain, bringing the technical and market grounding to structure PPAs, price discovery and generator due-diligence.',
    lead: false,
    photo: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/final_img2.webp',
  },
  /*
  {
    initials: 'SM',
    name: 'Saumya Misra',
    role: 'Founder & CEO',
    bg: 'Currently building and running an AI-driven consumer tech platform',
    why: 'Hands-on experience managing one-on-one client relationships and executing a consumer-facing platform from the ground up, the product and operating muscle Wattmatch needs.',
    lead: true,
    photo: 'https://cdn.avataarskin.com/static/cms/production/CONSULTATION_PORTAL/img3.webp',
  },
  */
];
