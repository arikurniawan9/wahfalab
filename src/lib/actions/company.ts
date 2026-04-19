'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { STORAGE_BUCKETS, deleteFromSupabaseStorage, uploadToSupabaseStorage } from '@/lib/supabase/storage'

// Helper to make string URL friendly
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

export async function getCompanyProfile() {
  try {
    // Get the first company profile
    let profile = await prisma.companyProfile.findFirst({
      orderBy: { created_at: 'asc' }
    })

    // If doesn't exist, create default one
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          company_name: 'WahfaLab',
          tagline: 'Laboratorium Analisis & Kalibrasi',
          address: '',
          phone: '',
          whatsapp: '',
          email: '',
          website: '',
          npwp: ''
        }
      })
    }

    return JSON.parse(JSON.stringify(profile))
  } catch (error: any) {
    console.error('Error fetching company profile:', error)
    return null
  }
}

export async function updateCompanyProfile(data: {
  company_name?: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  logo_url?: string
  tagline?: string
  npwp?: string
  leader_name?: string
  signature_url?: string
  stamp_url?: string
}) {
  try {
    // Get the first company profile
    let profile = await prisma.companyProfile.findFirst()

    if (!profile) {
      // Create new if doesn't exist
      profile = await prisma.companyProfile.create({
        data: {
          company_name: data.company_name || 'WahfaLab',
          address: data.address,
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          website: data.website,
          logo_url: data.logo_url,
          tagline: data.tagline,
          npwp: data.npwp,
          leader_name: data.leader_name,
          signature_url: data.signature_url,
          stamp_url: data.stamp_url
        }
      })
    } else {
      // Update existing
      const updateData: any = {
        updated_at: new Date()
      }

      if (data.company_name !== undefined) updateData.company_name = data.company_name
      if (data.address !== undefined) updateData.address = data.address
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp
      if (data.email !== undefined) updateData.email = data.email
      if (data.website !== undefined) updateData.website = data.website
      if (data.logo_url !== undefined) updateData.logo_url = data.logo_url
      if (data.tagline !== undefined) updateData.tagline = data.tagline
      if (data.npwp !== undefined) updateData.npwp = data.npwp
      if (data.leader_name !== undefined) updateData.leader_name = data.leader_name
      if (data.signature_url !== undefined) updateData.signature_url = data.signature_url
      if (data.stamp_url !== undefined) updateData.stamp_url = data.stamp_url

      profile = await (prisma.companyProfile as any).update({
        where: { id: profile.id },
        data: updateData
      })
    }

    revalidatePath('/admin/settings')
    revalidatePath('/admin/settings/company')
    revalidatePath('/')

    return { success: true, profile }
  } catch (error: any) {
    console.error('Error updating company profile:', error)
    return { error: error.message }
  }
}

export async function uploadCompanyLogo(file: File) {
  return uploadCompanyFile(file, 'logo');
}

export async function uploadCompanySignature(file: File) {
  return uploadCompanyFile(file, 'signature');
}

export async function uploadCompanyStamp(file: File) {
  return uploadCompanyFile(file, 'stamp');
}

async function uploadCompanyFile(file: File, type: 'logo' | 'signature' | 'stamp') {
  try {
    const profile = await getCompanyProfile();
    const companyName = profile?.company_name || 'wahfalab';
    
    // Create slug from company name
    const slug = slugify(companyName);
    const { publicUrl } = await uploadToSupabaseStorage({
      bucket: STORAGE_BUCKETS.companyAssets,
      folder: `${slug}/${type}`,
      file,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
      maxSizeBytes: 5 * 1024 * 1024,
    });

    const updateData: any = {};
    if (type === 'logo') updateData.logo_url = publicUrl;
    if (type === 'signature') updateData.signature_url = publicUrl;
    if (type === 'stamp') updateData.stamp_url = publicUrl;

    await updateCompanyProfile(updateData);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error(`Error uploading ${type} to Supabase:`, error);
    return { error: error.message };
  }
}

export async function deleteCompanyFile(type: 'logo' | 'signature' | 'stamp') {
  try {
    const profile = await getCompanyProfile();
    let currentUrl = '';
    
    if (type === 'logo') currentUrl = profile?.logo_url;
    if (type === 'signature') currentUrl = profile?.signature_url;
    if (type === 'stamp') currentUrl = profile?.stamp_url;
    
    if (currentUrl?.startsWith('http')) {
      await deleteFromSupabaseStorage(STORAGE_BUCKETS.companyAssets, currentUrl);
    }

    // Update database, setting field back to null
    const existing = await prisma.companyProfile.findFirst();
    if (existing) {
      const updateData: any = {};
      if (type === 'logo') updateData.logo_url = null;
      if (type === 'signature') updateData.signature_url = null;
      if (type === 'stamp') updateData.stamp_url = null;

      await prisma.companyProfile.update({
        where: { id: existing.id },
        data: updateData
      });
    }

    revalidatePath('/admin/settings/company');
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting ${type} from Supabase:`, error);
    return { error: error.message };
  }
}

export async function deleteCompanyLogo() {
  return deleteCompanyFile('logo');
}
