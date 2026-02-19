'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
          npwp: data.npwp
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

      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: updateData
      })
    }

    revalidatePath('/admin/settings')
    revalidatePath('/')

    return { success: true, profile }
  } catch (error: any) {
    console.error('Error updating company profile:', error)
    return { error: error.message }
  }
}

export async function uploadCompanyLogo(file: File) {
  try {
    const supabase = await createClient()
    
    // Upload ke Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `company-logo-${Date.now()}.${fileExt}`
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Coba bucket 'company-assets', jika tidak ada gunakan 'public' atau buat bucket
    const bucketName = 'company-assets'
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      // Jika bucket tidak ditemukan, coba gunakan bucket 'public' sebagai fallback
      if (error.message.includes('Bucket not found') || error.statusCode === '404') {
        console.log('Bucket not found, trying to use default storage...')
        // Return error yang lebih informatif
        return { 
          error: 'Bucket storage belum dibuat. Silakan buat bucket "company-assets" di Supabase Dashboard terlebih dahulu.',
          bucketName 
        }
      }
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    // Update company profile with new logo
    await updateCompanyProfile({ logo_url: publicUrl })

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('Error uploading logo:', error)
    return { error: error.message }
  }
}

export async function deleteCompanyLogo() {
  try {
    const profile = await getCompanyProfile()
    
    if (profile?.logo_url) {
      // Extract filename from URL
      const urlParts = profile.logo_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      const supabase = await createClient()
      const bucketName = 'company-assets'
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName])
      
      if (error && !error.message.includes('Bucket not found')) {
        console.error('Error removing from storage:', error)
      }
    }

    // Update database
    await updateCompanyProfile({ logo_url: undefined })

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting logo:', error)
    return { error: error.message }
  }
}
