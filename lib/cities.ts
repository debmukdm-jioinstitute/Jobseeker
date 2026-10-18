// Canonical cities with aliases. A locality like "Koramangala, Bangalore" or "Delhi, Noida" resolves to real cities.
export const CITIES: [string, RegExp][] = [
  ["Delhi NCR", /\b(delhi|ncr|noida|gurugram|gurgaon|ghaziabad|faridabad)\b/i],
  ["Gurugram", /\b(gurugram|gurgaon)\b/i],
  ["Noida", /\bnoida\b/i],
  ["Mumbai", /\b(mumbai|navi mumbai|thane)\b/i],
  ["Bengaluru", /\b(bengaluru|bangalore)\b/i],
  ["Hyderabad", /\bhyderabad\b/i],
  ["Chennai", /\bchennai\b/i],
  ["Pune", /\bpune\b/i],
  ["Kolkata", /\bkolkata\b/i],
  ["Ahmedabad", /\bahmedabad\b/i],
];
export const citiesIn = (loc: string) => CITIES.filter(([, r]) => r.test(loc)).map(([c]) => c);
