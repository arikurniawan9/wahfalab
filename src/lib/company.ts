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

export async function getLandingPageConfig() {
  try {
    const config = await prisma.landingPageConfig.findFirst()
    
    // If doesn't exist, return default structure or create one
    if (!config) {
      // Return basic structure to avoid crashes
      return {
        navbar_menus: [
          { label: "Home", href: "/", icon: "Home", is_dropdown: false },
          { label: "Layanan", href: "/catalog", icon: "Briefcase", is_dropdown: false },
          { label: "Galeri", href: "/gallery", icon: "ImageIcon", is_dropdown: false },
          { label: "Berita", href: "/news", icon: "Newspaper", is_dropdown: false },
          { label: "Kontak", href: "/contact", icon: "Phone", is_dropdown: false },
        ]
      }
    }
    
    return config
  } catch (error) {
    console.error('Error fetching landing page config:', error)
    return {
      navbar_menus: []
    }
  }
}
