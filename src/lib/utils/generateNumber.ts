import prisma from "@/lib/prisma";

export async function generateInvoiceNumber(prefix: string = "INV") {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  
  // Format dasar untuk pencarian (contoh: INV/2026/02/)
  const searchPattern = `${prefix}/${year}/${month}/`;

  // Cari nomor terakhir di bulan dan tahun yang sama
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotation_number: {
        startsWith: searchPattern,
      },
    },
    orderBy: {
      quotation_number: "desc",
    },
    select: {
      quotation_number: true,
    },
  });

  let nextNumber = 1;

  if (lastQuotation) {
    // Ambil 4 digit terakhir dan tambah 1
    const lastParts = lastQuotation.quotation_number.split("/");
    const lastSeq = parseInt(lastParts[lastParts.length - 1]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  const sequence = nextNumber.toString().padStart(4, "0");
  return `${searchPattern}${sequence}`;
}
