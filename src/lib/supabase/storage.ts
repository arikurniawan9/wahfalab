import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKETS = {
  companyAssets: process.env.SUPABASE_BUCKET_COMPANY_ASSETS || "company-assets",
  travelOrders: process.env.SUPABASE_BUCKET_TRAVEL_ORDERS || "travel-orders",
  samplingPhotos: process.env.SUPABASE_BUCKET_SAMPLING_PHOTOS || "sampling-photos",
  labResults: process.env.SUPABASE_BUCKET_LAB_RESULTS || "lab-results",
  paymentProofs: process.env.SUPABASE_BUCKET_PAYMENT_PROOFS || "payment-proofs",
  contentMedia: process.env.SUPABASE_BUCKET_CONTENT_MEDIA || "content-media",
} as const;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function isSupabaseStorageConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseKey());
}

function getSupabaseStorageClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error(
      "Supabase storage belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : "";
}

export function buildStoragePath(folder: string, fileName: string) {
  const ext = getFileExtension(fileName);
  const baseName = ext ? fileName.slice(0, -ext.length) : fileName;
  const safeBaseName = sanitizeSegment(baseName) || "file";
  const safeFolder = folder
    .split("/")
    .map((segment) => sanitizeSegment(segment))
    .filter(Boolean)
    .join("/");

  return `${safeFolder}/${Date.now()}-${safeBaseName}${ext}`;
}

export async function uploadToSupabaseStorage(options: {
  bucket: string;
  folder: string;
  file: File;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}) {
  const { bucket, folder, file, allowedMimeTypes, maxSizeBytes } = options;

  if (allowedMimeTypes && allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
    throw new Error(`Tipe file tidak diizinkan: ${file.type || "unknown"}`);
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    throw new Error(`Ukuran file melebihi batas ${Math.ceil(maxSizeBytes / 1024 / 1024)} MB`);
  }

  const client = getSupabaseStorageClient();
  const objectPath = buildStoragePath(folder, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from(bucket).upload(objectPath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return { path: objectPath, publicUrl: data.publicUrl };
}

function getUrlPathname(fileUrl: string) {
  try {
    return new URL(fileUrl).pathname;
  } catch {
    return "";
  }
}

export function extractStorageObjectPath(bucket: string, fileUrl: string) {
  const pathname = getUrlPathname(fileUrl);
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = pathname.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(pathname.slice(index + marker.length));
}

export async function deleteFromSupabaseStorage(bucket: string, fileUrl: string) {
  const objectPath = extractStorageObjectPath(bucket, fileUrl);
  if (!objectPath) {
    return { success: false, skipped: true };
  }

  const client = getSupabaseStorageClient();
  const { error } = await client.storage.from(bucket).remove([objectPath]);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, skipped: false };
}
