export function serializeData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }

  // Handle Objects
  if (typeof data === 'object') {
    // Jika ini adalah objek Decimal dari Prisma/decimal.js
    if (data.constructor && (data.constructor.name === 'Decimal' || typeof data.toNumber === 'function')) {
      return Number(data);
    }

    // Jika ini adalah objek Date (opsional, tapi seringkali lebih aman dikonversi ke string/plain date)
    if (data instanceof Date) {
      return data; // Next.js mendukung Date, tapi jika error lanjut, gunakan data.toISOString()
    }

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
