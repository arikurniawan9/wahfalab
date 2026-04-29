import prisma from "@/lib/prisma";

function toRoman(num: number): string {
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return roman[num - 1] || num.toString();
}

export async function generateInvoiceNumber(prefix: string = "WLI-PH") {
  const now = new Date();
  const year = now.getFullYear();
  const shortYear = year.toString().slice(-2);
  const month = now.getMonth() + 1;
  const romanMonth = toRoman(month);

  // Format: {seq}/WLI-PH/II/26
  // Search pattern for the current month and year
  const searchSuffix = `/${prefix}/${romanMonth}/${shortYear}`;

  // Cari nomor terakhir yang memiliki suffix tersebut
  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotation_number: {
        endsWith: searchSuffix,
      },
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      quotation_number: true,
    },
  });

  let nextNumber = 1;

  if (lastQuotation) {
    // Ambil bagian awal (sequence) sebelum '/'
    const lastParts = lastQuotation.quotation_number.split("/");
    const lastSeq = parseInt(lastParts[0]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  const sequence = nextNumber.toString().padStart(3, "0");
  return `${sequence}${searchSuffix}`;
}

export async function generateHandoverNumber(prefix: string = "BAST") {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const documentPrefix = prefix === "BAST" ? "WL-BAST" : prefix;
  const searchSuffix = `/${documentPrefix}/${month}/${year}`;

  const lastHandover = await prisma.sampleHandover.findFirst({
    where: {
      handover_number: {
        endsWith: searchSuffix,
      },
    },
    orderBy: {
      handover_number: "desc",
    },
    select: {
      handover_number: true,
    },
  });

  let nextNumber = 1;

  if (lastHandover) {
    const lastParts = lastHandover.handover_number.split("/");
    const lastSeq = parseInt(lastParts[0]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  const sequence = nextNumber.toString().padStart(4, "0");
  return `${sequence}${searchSuffix}`;
}

export async function generateTravelOrderNumber(prefix: string = "ST") {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  // Format: ST/wl/2026/02/0001 (ST = Surat Tugas, wl = wahfalab)
  const searchPattern = `${prefix}/wl/${year}/${month}/`;

  // Cari nomor terakhir di bulan dan tahun yang sama
  const lastTravelOrder = await prisma.travelOrder.findFirst({
    where: {
      document_number: {
        startsWith: searchPattern,
      },
    },
    orderBy: {
      document_number: "desc",
    },
    select: {
      document_number: true,
    },
  });

  let nextNumber = 1;

  if (lastTravelOrder) {
    const lastParts = lastTravelOrder.document_number.split("/");
    const lastSeq = parseInt(lastParts[lastParts.length - 1]);
    if (!isNaN(lastSeq)) {
      nextNumber = lastSeq + 1;
    }
  }

  const sequence = nextNumber.toString().padStart(4, "0");
  return `${searchPattern}${sequence}`;
}
