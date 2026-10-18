// Top-down: category -> sub-areas. Extend freely; keys are shown as-is in the UI.
export const TAXONOMY: Record<string, string[]> = {
  Finance: ["FP&A", "Investment Banking", "Asset Management", "Private Equity", "Venture Capital", "Equity Research", "Sales & Trading", "Corporate Finance", "Treasury", "Risk Management", "Credit Analysis", "Accounting & Audit", "Taxation", "Wealth Management", "Fintech", "Quant / Trading", "Insurance & Actuarial"],
  Business: ["Business Development", "Strategy", "Operations", "Product Management", "Program / Project Management", "Business Analytics", "Founder's Office", "Chief of Staff", "Supply Chain & Procurement", "Customer Success"],
  Marketing: ["Brand Marketing", "Performance / Growth", "Content & Copy", "SEO / SEM", "Social Media", "Product Marketing", "PR & Communications", "Marketing Analytics", "CRM & Lifecycle"],
  Consulting: ["Strategy Consulting", "Management Consulting", "Technology Consulting", "Financial Advisory", "Risk & Compliance Advisory", "HR Consulting", "Sustainability / ESG"],
  Technology: ["Software Engineering", "Data Science & ML", "Data Engineering", "DevOps / Cloud", "Cybersecurity", "QA / Testing", "UI / UX Design", "Technical Writing", "IT Support"],
  Sales: ["Enterprise Sales", "SDR / BDR", "Inside Sales", "Account Management", "Pre-Sales / Solutions", "Channel & Partnerships"],
  "HR & People": ["Talent Acquisition", "HR Business Partner", "Learning & Development", "Compensation & Benefits", "People Analytics", "Employer Branding"],
  Legal: ["Corporate Law", "Compliance", "Contracts", "IP & Technology Law", "Litigation", "Company Secretary"],
  Healthcare: ["Hospital Administration", "Pharma / Biotech", "Clinical Research", "Healthtech", "Medical Devices"],
  "Energy & Industrials": ["Oil & Gas", "Petrochemicals", "Renewables", "Manufacturing", "Automotive", "Infrastructure", "Logistics"],
  "Consumer & Retail": ["FMCG", "E-commerce", "Retail Operations", "Category Management", "D2C Brands"],
  "Media & Creative": ["Journalism", "Video & Production", "Graphic Design", "Gaming", "Entertainment"],
  Education: ["Teaching & Academia", "EdTech", "Research", "Admissions & Student Services"],
  "Public Sector & NGO": ["Policy & Research", "Development / NGO", "Government Programs", "Public Finance"],
  "Real Estate": ["Real Estate Investment", "Property Management", "Construction & Projects", "Urban Planning"],
};
