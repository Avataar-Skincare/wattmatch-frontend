export interface BlogContentBlock {
  type: 'h2' | 'p' | 'ul';
  text?: string;
  items?: string[];
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
      { type: 'p', text: "This is precisely the gap Wattmatch is built to close. By offering a marketplace to match RE buyers and generators, helping C&I identify the best RE models to optimize their power, running transparent, competitive auction for every C&I requirement, Wattmatch gives buyers real price discovery and a standardised, pre-vetted PPA they don't need an in-house energy or legal team to evaluate, removing the two biggest reasons a cautious buyer stays on the grid. By vetting every generator once, centrally, before they're allowed to bid, Wattmatch extends that same trust to the developers who can build excellent plants but have no way to reach credible buyers on their own, giving both large, established players and small, capable new entrants a constant, qualified deal pipeline instead of an expensive, uncertain sales cycle. Freed from the cost and time of chasing customers, generators can redirect that capital straight into building more capacity, which deepens competition and improves pricing further for buyers, a flywheel that compounds with every deal. It's this combination, easier discovery for buyers, a fair shot for every generator, and capital redirected from business development into capacity, that can move C&I's renewable penetration from today's low single digits toward a genuinely ambitious 40–50% over the next three to five years, turning India's most promising clean energy segment into one of its fastest-growing." },
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
      { type: 'p', text: 'Markets grow when every participant in them benefits, and this one is no exception. A marketplace that gives buyers transparent, competitive price discovery and a standardised, plain-language contracting process removes the two biggest reasons a cautious CFO says no. A marketplace that vets and certifies generators, doing the technical and financial diligence once, centrally, rather than requiring every buyer to redo it, gives smaller and newer developers a real, merit-based shot at demand they currently can\'t reach. And a generator who no longer has to fund a marketing and business-development function to survive can redirect that capital straight into building more capacity.' },
      { type: 'p', text: 'That is the flywheel: easier discovery and trust drive more deals; more deals give generators a reason to build more capacity without the customer-acquisition drag; more capacity deepens competition and improves pricing further for buyers; better pricing pulls in the next wave of cautious buyers who were sitting on the fence. Every turn of that flywheel is additive to the same 500 GW target the country has already committed to, not a new policy lever, but a more efficient use of the ones already in place.' },
      { type: 'p', text: "India has proven, over the last three years, that the demand exists, the economics work, and the policy environment is genuinely supportive. What remains is the unglamorous, structural work of making the market itself easy to transact in, for both sides of the deal, at the same time. Get that right, and the next phase of India's C&I solar story won't just track the curve of the last five years. It will bend it." },
    ],
  },
  {
    slug: 'rooftop-open-access-or-captive',
    title: 'Rooftop, Open Access, or Captive? How to Actually Decide.',
    description: "A practical guide for any C&I business trying to figure out which route to renewable power actually fits them, and why so many end up stuck before they even start.",
    date: '2026-08-05',
    author: 'Shailesh Kumar Mishra, Co-Founder, Wattmatch',
    excerpt: "A practical guide for any C&I business trying to figure out which route to renewable power actually fits them, and why so many end up stuck before they even start.",
    content: [
      { type: 'p', text: "Ask ten C&I energy heads how they should switch to renewable power, and you'll likely get ten different half-answers. Rooftop? Open access? Captive? Group captive? Most businesses know they should be doing something. Very few can tell you, with real confidence, which structure actually fits their load, their site, their balance sheet and their risk appetite, and that uncertainty, more than the technology or the economics, is what keeps most switches stuck at the \"we should look into this\" stage." },
      { type: 'p', text: "This isn't a knowledge problem that reflects badly on anyone. Nobody outside the power sector is expected to know the difference between a captive and a group captive structure, or why a Cross-Subsidy Surcharge changes the math on open access. It's genuinely unfamiliar territory for a CFO or plant head whose day job is running a business, not structuring power contracts. So before anything else, here's what each option actually means, in plain terms." },
      { type: 'h2', text: 'The Three Routes, Explained Simply' },
      { type: 'h2', text: '1. Rooftop Solar' },
      { type: 'p', text: 'Rooftop means installing solar panels on your own premises, your factory roof, your warehouse, your open land, and consuming the power directly, with no grid transmission involved.' },
      { type: 'ul', items: [
        'Fastest to get moving, with the fewest regulatory approvals of the three options',
        'No wheeling charges or cross-subsidy surcharges, since the power never touches the shared grid',
        'Can be capex-owned (you fund and own the system) or opex/RESCO-owned (a developer installs, owns and maintains it, and you simply pay for the power you use: zero upfront cost)',
        "The catch: it's capped by your physical roof or land area. For most mid-to-large industrial loads, rooftop alone can typically offset only a fraction of total consumption: it's rarely, by itself, a complete answer",
      ] },
      { type: 'h2', text: '2. Open Access (Third-Party PPA)' },
      { type: 'p', text: 'Open access lets you buy power from a solar (or wind, or hybrid) plant located elsewhere, often in a different state, delivered to your site through the shared grid, under a direct power purchase agreement with the generator.' },
      { type: 'ul', items: [
        'Effectively unlimited scale: you can contract for your entire load, not just what your roof can hold',
        "No equity investment required: it's a procurement contract, not an ownership stake",
        "The catch: you pay wheeling charges, and typically a Cross-Subsidy Surcharge and Additional Surcharge set by your state: charges that exist precisely because you're using the shared grid and stepping outside your DISCOM's tariff structure. These vary meaningfully by state and can materially affect your actual savings",
      ] },
      { type: 'h2', text: '3. Captive & Group Captive' },
      { type: 'p', text: 'A captive structure means you (or, in a group captive, a consortium of businesses) hold at least 26% equity ownership in the generating plant itself, and consume at least 51% of the electricity it produces, broadly in proportion to your shareholding. In exchange, most states exempt captive consumers from the Cross-Subsidy Surcharge and Additional Surcharge that apply to plain open access, often the single biggest lever on total savings.' },
      { type: 'ul', items: [
        'The deepest potential savings of the three routes, precisely because of the surcharge exemptions',
        'Group captive lets smaller buyers pool together to collectively meet the 26% equity threshold, without any single business needing to fund a plant alone',
        'The catch: it requires real equity investment, not just an offtake contract: capital gets locked in, the structuring is more complex, and for group captive, you need compatible co-investors willing to commit alongside you',
      ] },
      { type: 'p', text: '"Most businesses don\'t pick one and walk away. They blend: rooftop for whatever the roof can hold, and open access or captive for the rest."' },
      { type: 'h2', text: 'So How Should a Business Actually Decide?' },
      { type: 'p', text: "There's no universal right answer, but there is a reasonably clear set of questions that gets most businesses to the right one:" },
      { type: 'ul', items: [
        "How much of your load can your roof or land physically hold? If it's a meaningful share, rooftop is close to a free decision: there's little downside to taking it (especially via a zero-capex RESCO model) as a first step, even if it can't cover everything.",
        "Are you set up to hold equity in a power plant, or do you want a pure procurement relationship? Captive and group captive change your balance sheet and require ongoing governance involvement. If that's not something your business is set up for, or wants, open access keeps things at arm's length.",
        "What does your state's surcharge structure actually look like? Cross-subsidy and additional surcharges vary significantly by state, and in some states they're steep enough that the captive exemption is the difference between a marginal saving and a genuinely compelling one.",
        "Is your load large enough to structure a captive alone, or would you need partners? Group captive exists exactly for businesses whose load doesn't justify going it alone, but it does mean finding co-investors you're willing to be in a plant with for 15+ years.",
        'How much certainty do you need versus how much complexity can you absorb? Rooftop is simple and contained. Open access is simple to contract but grid-dependent. Captive is the most complex to set up but can deliver the deepest, most durable savings.',
      ] },
      { type: 'p', text: "In practice, most businesses don't pick one of these and walk away from the other two. They blend: take whatever rooftop capacity the site can hold as a fast, low-risk first step, and layer open access or a captive structure on top for the remainder of the load. The right mix depends entirely on your specific site, state and appetite, which is exactly where most businesses get stuck, because working that out today requires expertise almost no C&I business has in-house." },
      { type: 'h2', text: "Here's What That Actually Looks Like Today" },
      { type: 'p', text: "Walk into this process without help, and here is roughly what it involves: first, you need to even understand which of the three routes fits your situation, no small task on its own. Then you need to find a generator, or several, to compare, not a simple Google search, but a genuine search for a credible, financially sound developer with a track record, often through word-of-mouth or a broker relationship. Once you have a quote or two, you have almost no independent way to know if the pricing or terms are actually good, because there's no organised market showing you what else is on offer." },
      { type: 'p', text: "At this point, most businesses turn to a consultant, except finding a good one is its own separate search, with its own uncertainty about quality and cost. And even with a consultant in the room, you're now signing a 15-25 year power purchase agreement, sometimes alongside a shareholders' agreement for captive structures, full of legal and technical language that very few in-house teams are equipped to properly evaluate." },
      { type: 'p', text: "Every one of these steps adds weeks. Strung together, they add months: rounds of discussion, renegotiation, second opinions, and second-guessing. It's not that businesses don't want to switch. It's that the path to actually doing it is long, unfamiliar, and dependent on the right consultant, the right generator, and a fair amount of luck lining up at the same time. Multiply that friction across thousands of C&I businesses trying to make the same decision independently, and it becomes obvious why India's C&I renewable adoption still lags so far behind what the economics alone would predict." },
      { type: 'h2', text: 'How Wattmatch Removes Each Step' },
      { type: 'p', text: 'This is precisely the gap Wattmatch exists to close, not by pushing every business toward the same structure, but by making all three routes equally easy to evaluate and execute.' },
      { type: 'ul', items: [
        'We help you work out the right structure for your site and load: rooftop, open access, captive or a blend, based on your actual consumption pattern, location and appetite, not a one-size-fits-all pitch.',
        "Every generator on Wattmatch is pre-vetted on technical and financial credibility before they're allowed to bid, so you're never choosing blind, and never starting your own search from zero.",
        'A live, competitive auction gives you real price discovery: multiple vetted generators bidding for your demand, so you know your pricing is actually competitive, not just "whatever the one developer you found quoted."',
        "A standardised, pre-vetted PPA (and SHA, for captive structures) means you're not relying on a consultant you had to independently find and vet: the contract is already built around fair, standard terms.",
        "We manage the relationship for the life of the contract: escrow, performance monitoring, regulatory compliance across states, so the decision to switch isn't also a decision to take on 15 years of ongoing legal and operational oversight yourself.",
      ] },
      { type: 'p', text: "The technology has been ready for years. The economics have worked for a while now. What's been missing is a way to make the decision, and the execution that follows it, fast, transparent and trustworthy, for a rooftop installation, an open access contract, or a captive structure alike. That is what Wattmatch is built to be: not another consultant to go find, but the marketplace that removes the need to." },
    ],
  },
];
