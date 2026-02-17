import prisma from '@/lib/prisma'

export async function getCompanyProfile() {
  try {
    // Get the first (and only) company profile
    let profile = await prisma.companyProfile.findFirst()

    // If doesn't exist, create default one
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          company_name: 'WahfaLab',
          tagline: 'Laboratorium Analisis & Kalibrasi'
        }
      })
    }

    return profile
  } catch (error: any) {
    console.error('Error fetching company profile:', error)
    return null
  }
}
