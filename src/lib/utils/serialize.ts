/**
 * Utility to serialize Prisma objects (handling Decimal and Date) 
 * so they can be passed from Server Components to Client Components.
 */
export function serializeData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }

  // Handle Objects
  if (typeof data === 'object') {
    // 1. Handle Decimal (Prisma / Decimal.js)
    // Check for common Decimal.js properties/methods
    if (data.constructor?.name === 'Decimal' || 
        typeof data.toNumber === 'function' || 
        data.d !== undefined && data.s !== undefined) {
      return Number(data.toString());
    }

    // 2. Handle Dates
    if (data instanceof Date) {
      return data.toISOString(); // Convert to ISO string for maximum compatibility
    }

    // 3. Recursive serialization for nested objects
    const newObj: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = serializeData(data[key]);
      }
    }
    return newObj;
  }

  return data;
}
