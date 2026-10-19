// Each line: canonical keyword | aliases. A job mentioning any alias counts as that keyword.
const DEFS = `fp&a|financial planning|fpa|fp and a
financial modelling|financial modeling|financial models
valuation|dcf|discounted cash flow
budgeting|budgets|budget
forecasting|forecasts
variance analysis
mis reporting|mis
investment banking|m&a|mergers and acquisitions|ib analyst
equity research|equity analyst|sell-side|buy-side
asset management|portfolio management|fund management
private equity|buyout
venture capital|vc fund
credit analysis|credit risk|credit underwriting
risk management|market risk|operational risk
treasury|cash management|liquidity
accounting|accountant|accounts|bookkeeping
audit|auditing|internal audit|statutory audit
taxation|tax|gst|transfer pricing
ifrs|ind as
us gaap|gaap
financial reporting|financial statements|month-end close
reconciliation|reconciliations
accounts payable|accounts receivable|order to cash|procure to pay
cost accounting|costing
wealth management|private banking
fintech|payments
derivatives|fixed income|capital markets
compliance|regulatory|kyc|aml
due diligence
bloomberg|capital iq|factset
cfa
chartered accountant|ca
mba
cpa|us cpa
strategy|strategic planning
business development|bd|partnerships
operations|operational excellence
project management|program management|pmp|prince2
product management|product manager
business analysis|business analytics|business analyst
market research|competitive analysis
consulting|advisory
stakeholder management
process improvement|lean|six sigma
supply chain|logistics|procurement|sourcing
customer success|account management|client relationship
go-to-market|gtm
pricing
digital marketing|online marketing
seo|search engine optimization
sem|ppc|google ads|paid media
social media|community management
content marketing|content writing|copywriting|content strategy
brand management|branding|brand strategy
performance marketing|growth marketing
email marketing|marketing automation
marketing analytics|google analytics
public relations|pr|communications
product marketing
campaign management
enterprise sales|b2b sales|saas sales
lead generation|prospecting|cold calling
negotiation
pipeline management|sales forecasting
excel|ms excel|advanced excel|spreadsheets
vba|macros
power bi|powerbi
tableau|looker|qlik
sql|mysql|postgresql
python
sap|sap fico|s/4hana
oracle|oracle fusion
tally|quickbooks|zoho books
anaplan|hyperion|essbase|adaptive insights
netsuite
powerpoint|presentations
salesforce|hubspot|crm
data analysis|data analytics
data science|machine learning
javascript|typescript|react|node.js
java|spring
aws|azure|gcp|cloud
jira|agile|scrum
leadership|team management|people management
recruitment|talent acquisition|hr`
  .split("\n").map((l) => l.split("|"));

export const ALIASES = new Map(DEFS.map(([canon, ...rest]) => [canon, [canon, ...rest]] as [string, string[]]));

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const group = (terms: string[]) => `(^|[^\\w])(${terms.map(esc).join("|")})($|[^\\w])`;
const cache = new Map<string, RegExp>();
const kwRe = (k: string) => {
  let r = cache.get(k);
  if (!r) cache.set(k, (r = new RegExp(group(ALIASES.get(k) ?? [k]), "i")));
  return r;
};

// Scan resume text for known skills/roles; most frequent first.
export function extractKeywords(text: string, max = 30): string[] {
  const t = text.toLowerCase().replace(/\s+/g, " ");
  const found: [string, number][] = [];
  for (const [canon, aliases] of ALIASES) {
    const n = aliases.reduce((s, a) => s + (t.match(new RegExp(group([a]), "gi"))?.length ?? 0), 0);
    if (n) found.push([canon, n]);
  }
  return found.sort((a, b) => b[1] - a[1]).slice(0, max).map(([k]) => k);
}

export type Match = { score: number; pct: number; hits: string[] };
type Job = { title: string; company: string; text: string };

// ATS-style: which of the candidate's keywords appear in the posting. A title hit weighs 3, a body hit 1.
export function match(job: Job, kws: string[]): Match {
  const body = `${job.company} ${job.text}`;
  const hits: string[] = [];
  let score = 0;
  for (const k of kws) {
    const re = kwRe(k);
    const inTitle = re.test(job.title);
    if (inTitle || re.test(body)) { hits.push(k); score += inTitle ? 3 : 1; }
  }
  const cap = Math.max(3, Math.min(kws.length, 6) * 3);
  return { score, pct: Math.min(100, Math.round((100 * score) / cap)), hits };
}
