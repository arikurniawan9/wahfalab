import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const profile = await prisma.companyProfile.findFirst()
    
    if (!profile) {
      // Return default if not exists
      return NextResponse.json({
        company_name: 'WahfaLab',
        tagline: 'Laboratorium Analisis & Kalibrasi',
        logo_url: null
      })
    }

    const p = profile as any;
    return NextResponse.json({
      id: p.id,
      company_name: p.company_name,
      tagline: p.tagline,
      logo_url: p.logo_url,
      address: p.address,
      phone: p.phone,
      email: p.email,
      website: p.website,
      npwp: p.npwp,
      leader_name: p.leader_name,
      signature_url: p.signature_url,
      stamp_url: p.stamp_url,
      upload_storage_provider: p.upload_storage_provider,
      upload_storage_public_path: p.upload_storage_public_path,
      upload_storage_external_url: p.upload_storage_external_url,
      upload_storage_note: p.upload_storage_note
    })
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 })
  }
}
