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

    return NextResponse.json({
      id: profile.id,
      company_name: profile.company_name,
      tagline: profile.tagline,
      logo_url: profile.logo_url,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      npwp: profile.npwp
    })
  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 })
  }
}
