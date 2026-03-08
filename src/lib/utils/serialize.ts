/**
 * Utility to serialize Prisma objects (handling Decimal and Date) 
 * so they can be passed from Server Components to Client Components.
 * 
 * Uses JSON serialization to ensure only plain objects are returned.
 */
export function serializeData(data: any): any {
  if (data === null || data === undefined) return data;
  
  // Using JSON.parse(JSON.stringify()) is the most reliable way 
  // to strip away Prisma-specific classes (like Decimal) 
  // and non-plain object prototypes that Next.js Client Components dislike.
  return JSON.parse(JSON.stringify(data));
}
