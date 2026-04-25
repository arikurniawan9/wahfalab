import fs from 'fs/promises'
import crypto from 'crypto'
import path from 'path'
import prisma from '@/lib/prisma'
import { STORAGE_BUCKETS, buildStoragePath, deleteFromSupabaseStorage, uploadToSupabaseStorage } from '@/lib/supabase/storage'

export type ManagedUploadProvider = 'supabase' | 'public' | 'google_drive' | 'google_form'

export async function getManagedUploadConfig() {
  const profile = await prisma.companyProfile.findFirst({
    select: {
      upload_storage_provider: true,
      upload_storage_public_path: true,
      upload_storage_external_url: true,
      upload_storage_note: true,
    }
  })

  return {
    provider: (profile?.upload_storage_provider || 'supabase') as ManagedUploadProvider,
    publicPath: profile?.upload_storage_public_path || '',
    externalUrl: profile?.upload_storage_external_url || '',
    note: profile?.upload_storage_note || '',
  }
}

export async function getManagedUploadHealth() {
  const config = await getManagedUploadConfig()
  const googleDriveServiceAccountEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || ''
  const googleDrivePrivateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY || ''

  return {
    provider: config.provider,
    providerLabel:
      config.provider === 'public'
        ? 'Project / Public'
        : config.provider === 'google_drive'
          ? 'Google Drive'
          : config.provider === 'google_form'
            ? 'Google Form'
            : 'Supabase Storage',
    configured: Boolean(config.provider),
    publicPath: config.publicPath,
    externalUrl: config.externalUrl,
    note: config.note,
    googleDrive: {
      envReady: Boolean(googleDriveServiceAccountEmail && googleDrivePrivateKey),
      folderReady: Boolean(getGoogleDriveFolderId(config.externalUrl)),
      serviceAccountEmail: googleDriveServiceAccountEmail,
    },
  }
}

function sanitizePathSegment(value: string) {
  return value
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
}

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function getGoogleDriveFolderId(rawValue?: string | null) {
  const value = (rawValue || '').trim()
  if (!value) return ''

  const folderMatch = value.match(/\/folders\/([a-zA-Z0-9_-]+)/i)
  if (folderMatch?.[1]) {
    return folderMatch[1]
  }

  const idMatch = value.match(/[a-zA-Z0-9_-]{20,}/)
  if (idMatch?.[0]) {
    return idMatch[0]
  }

  return value
}

async function getGoogleDriveAccessToken() {
  const serviceAccountEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      'Google Drive belum dikonfigurasi. Isi GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_DRIVE_PRIVATE_KEY.'
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = toBase64Url(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  )
  const unsignedToken = `${header}.${claim}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsignedToken)
  signer.end()
  const signature = signer.sign(privateKey)
  const assertion = `${unsignedToken}.${toBase64Url(signature)}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || 'Gagal mengambil token Google Drive')
  }

  if (!data.access_token) {
    throw new Error('Token Google Drive tidak ditemukan')
  }

  return data.access_token as string
}

async function uploadToGoogleDriveStorage(options: {
  file: File
  bucket: string
  folder: string
  externalUrl?: string | null
}) {
  const { file, bucket, folder, externalUrl } = options
  const folderId = getGoogleDriveFolderId(externalUrl)
  const accessToken = await getGoogleDriveAccessToken()
  const safeName = buildStoragePath(folder, file.name).replace(/\//g, '-')

  const boundary = `wahfalab-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const metadata: Record<string, any> = {
    name: safeName,
  }

  if (folderId) {
    metadata.parents = [folderId]
  }

  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
  const filePartHeader = `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
  const endPart = `\r\n--${boundary}--`
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const body = Buffer.concat([
    Buffer.from(metadataPart, 'utf8'),
    Buffer.from(filePartHeader, 'utf8'),
    fileBuffer,
    Buffer.from(endPart, 'utf8'),
  ])

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || 'Gagal upload ke Google Drive')
  }

  if (!data.id) {
    throw new Error('Google Drive tidak mengembalikan file ID')
  }

  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    })
  } catch {
    // Ignore permission errors so uploads still succeed even if public sharing is restricted.
  }

  return {
    provider: 'google_drive' as const,
    path: data.id,
    publicUrl: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view?usp=sharing`,
    externalTargetUrl: externalUrl || null,
    note: null,
    bucket,
  }
}

function normalizePublicBasePath(publicPath: string | undefined | null, bucket: string, folder: string) {
  const configured = (publicPath || '').trim()

  if (configured) {
    const normalized = configured
      .replace(/^\/+/, '')
      .replace(/^public\//i, '')
      .replace(/\\/g, '/')
      .split('/')
      .map((segment) => sanitizePathSegment(segment))
      .filter(Boolean)
      .join('/')

    return normalized || `uploads/${bucket}/${folder}`
  }

  return `uploads/${bucket}/${folder}`
}

async function uploadToPublicStorage(options: {
  file: File
  bucket: string
  folder: string
  publicPath?: string | null
}) {
  const { file, bucket, folder, publicPath } = options
  const basePath = normalizePublicBasePath(publicPath, bucket, folder)
  const publicDir = path.join(process.cwd(), 'public', basePath)
  await fs.mkdir(publicDir, { recursive: true })

  const objectPath = buildStoragePath('', file.name).replace(/^\/+/, '')
  const fullPath = path.join(publicDir, objectPath)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(fullPath, buffer)

  return {
    provider: 'public' as const,
    path: path.posix.join(basePath.replace(/\\/g, '/'), objectPath.replace(/\\/g, '/')),
    publicUrl: `/${path.posix.join(basePath.replace(/\\/g, '/'), objectPath.replace(/\\/g, '/'))}`,
  }
}

export async function uploadManagedStorageFile(options: {
  bucket: string
  folder: string
  file: File
  allowedMimeTypes?: string[]
  maxSizeBytes?: number
}) {
  const { bucket, folder, file, allowedMimeTypes, maxSizeBytes } = options
  const config = await getManagedUploadConfig()

  if (allowedMimeTypes && allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
    throw new Error(`Tipe file tidak diizinkan: ${file.type || 'unknown'}`)
  }

  if (maxSizeBytes && file.size > maxSizeBytes) {
    throw new Error(`Ukuran file melebihi batas ${Math.ceil(maxSizeBytes / 1024 / 1024)} MB`)
  }

  if (config.provider === 'public') {
    return uploadToPublicStorage({
      file,
      bucket,
      folder,
      publicPath: config.publicPath,
    })
  }

  if (config.provider === 'google_drive') {
    return uploadToGoogleDriveStorage({
      file,
      bucket,
      folder,
      externalUrl: config.externalUrl,
    })
  }

  if (config.provider === 'google_form') {
    throw new Error(
      config.externalUrl
        ? `Mode Google Form aktif. Gunakan form eksternal: ${config.externalUrl}`
        : 'Mode Google Form aktif, tetapi URL form belum diisi di pengaturan admin.'
    )
  }

  const supabaseUpload = await uploadToSupabaseStorage({
    bucket,
    folder,
    file,
    allowedMimeTypes,
    maxSizeBytes,
  })

  return {
    provider: config.provider,
    ...supabaseUpload,
    externalTargetUrl: config.externalUrl || null,
    note: config.note || null,
  }
}

export async function deleteManagedStorageFile(bucket: string, fileUrl: string) {
  if (!fileUrl) {
    return { success: false, skipped: true }
  }

  const isLocalPublicFile = fileUrl.startsWith('/')

  if (isLocalPublicFile) {
    const filePath = fileUrl.replace(/^\/+/, '')
    const fullPath = path.join(process.cwd(), 'public', filePath)
    await fs.rm(fullPath, { force: true })
    return { success: true, skipped: false, provider: 'public' as const }
  }

  const isGoogleDriveFile =
    fileUrl.includes('drive.google.com/file/d/') ||
    fileUrl.includes('drive.google.com/open?id=') ||
    fileUrl.includes('googleusercontent.com')

  if (isGoogleDriveFile) {
    const accessToken = await getGoogleDriveAccessToken()
    const match =
      fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
      fileUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i)
    const fileId = match?.[1] || ''

    if (!fileId) {
      return { success: false, skipped: true }
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data?.error?.message || 'Gagal menghapus file Google Drive')
    }

    return { success: true, skipped: false, provider: 'google_drive' as const }
  }

  return deleteFromSupabaseStorage(bucket, fileUrl)
}

export { STORAGE_BUCKETS }
