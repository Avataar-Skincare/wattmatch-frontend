export interface BlogContentBlock {
  type: 'h2' | 'p';
  text: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description for search results, aim for ~150-160 characters. */
  description: string;
  /** ISO date, e.g. '2026-08-04'. */
  date: string;
  author?: string;
  /** Short teaser shown on the /blog index page. */
  excerpt: string;
  content: BlogContentBlock[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Display-only month/year formatting (e.g. '2026-08-04' -> 'August 2026').
// The underlying ISO date field stays as-is for sorting and structured data.
export function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

// Add new posts here, each gets its own route at /blog/:slug automatically,
// picked up by the sitemap generator on the next build.
export const blogPosts: BlogPost[] = [
  {
    slug: 'msmes-100kw-open-access',
    title: "India's Smaller Industries Just Got a Seat at the Clean Energy Table. The Hard Part Is Making Sure They Can Use It",
    description: "The Green Open Access Rules quietly rewrote who gets to buy clean power. But regulation alone won't make the switch fast, or easy.",
    date: '2026-08-04',
    author: 'Naga Satyam, Co-Founder, Wattmatch',
    excerpt: "The Green Open Access Rules quietly rewrote who gets to buy clean power. But regulation alone won't make the switch fast, or easy.",
    content: [
      { type: 'p', text: "For most of the last decade, India's open access solar market was effectively a large-enterprise club. The eligibility threshold, 1 MW of sanctioned load or connected demand, locked out the vast majority of the country's actual industrial base. A steel plant or a data centre could shop for solar. An auto-components manufacturer, a cold-storage chain, could not." },
      { type: 'p', text: "The Green Open Access Rules of 2022 changed that with a single number: the threshold dropped from 1 MW to 100 kW almost overnight. It's easy to undersell how significant that shift actually is. This wasn't a policy tweak at the margins: it was a tenfold reduction in the qualifying bar, and it landed squarely on the segment that makes up the real weight of India's industrial economy." },
      { type: 'h2', text: 'Why This Segment Matters More Than Its Size Suggests' },
      { type: 'p', text: 'MSMEs alone account for close to half of all the energy consumed by India\'s industrial sector, a striking figure given how little of the open access conversation, until recently, was built around them. This is not a niche addressable market. It is the demand base that the 1 MW-and-above framework was structurally excluding from the cheaper, cleaner side of the power market for years.' },
      { type: 'p', text: "Bring the threshold down to 100 kW, and a huge population of previously ineligible consumers, smaller manufacturing units, commercial complexes, cold chains, auto-ancillary units, etc., become buyers for the first time. That's not just more addressable demand for developers. It's a meaningful de-concentration of India's renewable transition away from a small set of large corporates, toward the businesses that actually employ most of India's industrial workforce." },
      { type: 'h2', text: 'The Case for Switching Has Rarely Been This Clean' },
      { type: 'p', text: 'Strip away the policy narrative, and the underlying business case is straightforward, and increasingly hard to ignore on any single dimension:' },
      { type: 'p', text: 'Cost. Power is one of the largest controllable line items for most C&I operations, and open access RE typically runs 25–30% cheaper than grid tariffs once wheeling and surcharges are accounted for, a direct, recurring hit to the bottom line, not a one-time saving.' },
      { type: 'p', text: "Compliance. The Renewable Consumption Obligation is no longer a soft target: it's a binding requirement for designated consumers, climbing toward 43.33% by FY 2029-30, with real financial penalties for falling short." },
      { type: 'p', text: "Carbon credit monetisation. India's Carbon Credit Trading Scheme gives renewable consumption a second, tradeable economic value beyond the tariff saving itself." },
      { type: 'p', text: 'Tariff stability. A 15–25 year PPA locks in a rate for the life of the contract, insulating a business from grid tariffs that have historically climbed 5–8% a year, and considerably more in some states.' },
      { type: 'p', text: 'Brand and market access. Sustainability credentials are no longer optional for suppliers to large MNCs, many now formally mandate renewable sourcing commitments as a condition of doing business, turning green power from a values statement into a market-access requirement.' },
      { type: 'p', text: "Taken together, this isn't a case that needs to be made anymore. It's already made. What's missing is the infrastructure to act on it quickly." },
      { type: 'h2', text: "Opening the Door Isn't the Same as Making the Room Easy to Walk Into" },
      { type: 'p', text: "Here's the harder truth sitting underneath the good news: dropping the threshold expands who can buy RE power. It does nothing to fix how hard it still is to actually do it. Every structural problem that already slows down large C&I buyers gets worse, not better, once you extend eligibility to a much larger population of smaller, less resourced businesses." },
      { type: 'p', text: 'Price discovery is still broken. A 500 kW cold-storage operator has even less capacity than a large enterprise to run a competitive process across multiple generators. Without a transparent way to compare offers, most will take the first credible quote they get, rarely the best one.' },
      { type: 'p', text: "The 15-year commitment is still unfamiliar and intimidating. If a large industrial buyer with some in-house legal capability finds PPA and SHA terms hard to evaluate, a smaller business with no dedicated function for this at all is even less equipped, and even more likely to simply stay on the grid rather than risk a long contract it can't properly assess." },
      { type: 'p', text: "Generator vetting is now a bigger, not smaller, problem. A newly eligible base of smaller buyers has even less capacity to independently assess a developer's technical and financial credibility, precisely the diligence step most likely to get skipped, and most likely to matter when something goes wrong five years into a fifteen-year contract." },
      { type: 'p', text: "State-level regulatory divergence doesn't disappear. Cross-subsidy surcharges, wheeling charges and banking rules still vary sharply by state, and a smaller consumer has even less ability to navigate that complexity than a large one with dedicated resources." },
      { type: 'p', text: "In other words: expanding eligibility without solving the underlying market structure risks a lot of newly eligible businesses discovering they're eligible on paper, and stuck in practice." },
      { type: 'h2', text: 'Two Reforms, One Outcome' },
      { type: 'p', text: 'The Green Open Access Rules did their job: they removed the eligibility barrier. What remains is removing the execution barrier: an organised, trustworthy layer that gives every newly eligible buyer, regardless of size, the same transparent price discovery, standardised contracting, and vetted generator access that only the largest, most resourced companies could previously assemble for themselves.' },
      { type: 'p', text: "Get both right, open eligibility and an easy way to act on it, and India's next wave of C&I RE adoption won't just be bigger. It will finally reach the businesses the market was built to serve all along." },
      { type: 'p', text: "This is precisely the gap Wattmatch is built to close. By offering a platform to match RE buyers and generators, helping C&I identify the best RE models to optimize their power, running transparent, competitive auction for every C&I requirement, Wattmatch gives buyers real price discovery and a standardised, pre-vetted PPA they don't need an in-house energy or legal team to evaluate, removing the two biggest reasons a cautious buyer stays on the grid. By vetting every generator once, centrally, before they're allowed to bid, Wattmatch extends that same trust to the developers who can build excellent plants but have no way to reach credible buyers on their own, giving both large, established players and small, capable new entrants a constant, qualified deal pipeline instead of an expensive, uncertain sales cycle. Freed from the cost and time of chasing customers, generators can redirect that capital straight into building more capacity, which deepens competition and improves pricing further for buyers, a flywheel that compounds with every deal. It's this combination, easier discovery for buyers, a fair shot for every generator, and capital redirected from business development into capacity, that can move C&I's renewable penetration from today's low single digits toward a genuinely ambitious 40–50% over the next three to five years, turning India's most promising clean energy segment into one of its fastest-growing." },
    ],
  },
  {
    slug: 'indias-ci-renewable-boom',
    title: "India's C&I Renewable Boom Is Real, and the Best Is Yet to Come",
    description: "From 300 megawatts to 33 gigawatts in a decade, India has proven the model works. Closing three structural gaps could turn this into the country's fastest-growing energy market.",
    date: '2026-08-04',
    author: 'Shailesh Kumar Mishra, Co-Founder, Wattmatch',
    excerpt: "From 300 megawatts to 33 gigawatts in a decade, India has proven the model works. Closing three structural gaps could turn this into the country's fastest-growing energy market.",
    content: [
      { type: 'p', text: "Ten years ago, India's commercial and industrial (C&I) open access RE market barely existed: a rounding error of roughly 300 megawatts. Today it stands at 32.9 gigawatts of cumulative installed capacity, according to Mercom India's Q1 2026 Open Access Market report, with a further 45+ gigawatts in the development pipeline. The country added a record 7.8 GW of new open access RE capacity in 2025 alone, and Q1 2026 alone brought 2.7 GW, a 160% jump over the same quarter a year earlier." },
      { type: 'p', text: "By any reasonable measure, this is one of the genuine success stories of India's energy transition. India now ranks third globally in total renewable energy installed capacity, and hit its own target of sourcing 50% of cumulative installed power capacity from non-fossil sources in 2025, five years ahead of schedule. Total non-fossil capacity stood at 291.53 GW as of May 2026, en route to the honorable Prime Minister's stated target of 500 GW by 2030." },
      { type: 'h2', text: 'The Numbers Behind the Momentum' },
      { type: 'p', text: "The growth has been driven by a genuinely supportive policy stack. The Green Open Access Rules of 2022 cut the minimum eligible load for open access from 1 MW to 100 kW overnight, opening the door to a much broader base of mid-sized industrial and commercial consumers who previously couldn't participate at all. The Renewable Consumption Obligation, the successor to the older RPO framework, now legally requires designated large consumers, DISCOMs and captive users to source a rising share of their power from renewables, climbing from roughly 30% today toward 43.33% by FY 2029-30, with financial penalties for falling short. And the economics do the rest of the work: landed open-access RE tariffs of roughly ₹4-6.5 per unit compare favourably against grid/DISCOM industrial tariffs that commonly run ₹6-15 per unit, depending on the state." },
      { type: 'p', text: 'A June 2026 study by the Council on Energy, Environment and Water (CEEW) and NRDC India, conducted with technical guidance from the Ministry of New and Renewable Energy, estimates that India\'s 500 GW target and the National Green Hydrogen Mission together could generate more than 44 lakh full-time-equivalent jobs by 2030. This is no longer a niche corner of the power sector: it is becoming a structural part of how India generates and consumes electricity.' },
      { type: 'h2', text: 'Yet the Country Is Still Leaving the Bulk of the Opportunity on the Table' },
      { type: 'p', text: "Here is the harder number: commercial and industrial consumers account for roughly half of all the electricity India uses, broadly estimated in the region of 830-915 billion units a year. Against that base, even India's genuinely impressive 32.9 GW of cumulative open access RE capacity covers only a modest single-digit share of total C&I demand. Put plainly, the overwhelming majority of India's commercial and industrial electricity still comes from the grid, not the sun, despite the fact that switching is, in most states, now simply cheaper." },
      { type: 'p', text: "This gap looks even starker set against markets that industrialized their renewable transition earlier. The United States has built a C&I RE base several times the size of India's, driven substantially by large-scale corporate virtual power purchase agreements. Germany's industrial Mittelstand has achieved a far higher concentration of rooftop and on-site renewable adoption relative to its industrial base. China, despite a grid still skewed toward coal-fired industrial demand, has installed C&I-adjacent solar capacity an order of magnitude larger than India's. India has the underlying resource advantage, more sun, a larger and faster-growing industrial base, and still trails. The gap is not a resource problem. It is a market structure problem." },
      { type: 'h2', text: 'Three Bottlenecks Are Doing Most of the Damage' },
      { type: 'p', text: 'Talk to any mid-sized C&I buyer who has looked into switching, and three frictions come up again and again.' },
      { type: 'p', text: "The first is price discovery. There is no organised marketplace where a buyer can see multiple generators competing for their business on comparable terms. Most deals still happen the old way: one relationship, one negotiation, one quote, with no real way to know if it's a good one. For a business with no in-house energy team, that's often reason enough to simply stay with the DISCOM." },
      { type: 'p', text: "The second is the length and unfamiliarity of the commitment itself. RE PPAs typically run 15 to 25 years, a genuinely long horizon for a CFO to underwrite, especially when the contract, and often an accompanying shareholders' agreement in captive or group-captive structures, is written in project-finance legal language that most corporate buyers have no in-house capability to properly evaluate. Add to that a young, fragmented generator landscape, many developers are new entrants without a long delivery track record, and the caution is entirely rational, not a failure of ambition." },
      { type: 'p', text: 'The third is regulatory friction that varies sharply by state. Cross-subsidy surcharges, additional surcharges, wheeling charges and banking provisions differ meaningfully across India\'s states, and a recent industry analysis flagged this state-level regulatory divergence as "the biggest execution risk" facing the open access market in 2026. It is precisely why group-captive ownership structures, which qualify for certain surcharge exemptions, have come to dominate deal structuring, adding a further layer of complexity most buyers are not equipped to navigate alone.' },
      { type: 'h2', text: 'What Other Industries Already Solved' },
      { type: 'p', text: "None of these three problems are unique to energy. Retail in India faced a similar trust-and-discovery gap before organised e-commerce platforms solved for price transparency and seller verification at scale. The rental housing market faced a similar problem of information asymmetry and broker friction before platforms rebuilt trust into the transaction directly. In both cases, the fix wasn't a new incentive scheme: it was a neutral intermediary layer that did three things: aggregated supply so buyers could compare on equal terms, vetted and certified participants so trust didn't have to be built deal by deal, and simplified the actual transaction so a non-expert could complete it confidently." },
      { type: 'p', text: "C&I RE in India needs the same layer. A generator today spends as much energy chasing buyers as building plants: sales and business development cost that adds nothing to actual generation capacity, and disproportionately hurts smaller and newer developers who can build perfectly good plants but can't get in front of credible buyers. A buyer today has no efficient way to compare multiple vetted offers, and no simplified path through PPA and SHA terms they were never trained to read. Both sides are, in effect, paying a tax for the market's lack of structure, and that tax is what's capping India's C&I RE growth well below what the underlying economics would otherwise support." },
      { type: 'h2', text: 'The Flywheel This Unlocks' },
      { type: 'p', text: 'Markets grow when every participant in them benefits, and this one is no exception. A platform that gives buyers transparent, competitive price discovery and a standardised, plain-language contracting process removes the two biggest reasons a cautious CFO says no. A platform that vets and certifies generators, doing the technical and financial diligence once, centrally, rather than requiring every buyer to redo it, gives smaller and newer developers a real, merit-based shot at demand they currently can\'t reach. And a generator who no longer has to fund a marketing and business-development function to survive can redirect that capital straight into building more capacity.' },
      { type: 'p', text: 'That is the flywheel: easier discovery and trust drive more deals; more deals give generators a reason to build more capacity without the customer-acquisition drag; more capacity deepens competition and improves pricing further for buyers; better pricing pulls in the next wave of cautious buyers who were sitting on the fence. Every turn of that flywheel is additive to the same 500 GW target the country has already committed to, not a new policy lever, but a more efficient use of the ones already in place.' },
      { type: 'p', text: "India has proven, over the last three years, that the demand exists, the economics work, and the policy environment is genuinely supportive. What remains is the unglamorous, structural work of making the market itself easy to transact in, for both sides of the deal, at the same time. Get that right, and the next phase of India's C&I solar story won't just track the curve of the last five years. It will bend it." },
    ],
  },
];
