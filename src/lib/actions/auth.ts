'use server'

import prisma from '@/lib/prisma'
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hashPassword, verifyPassword, getRedirectPath } from '@/lib/auth-helpers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch (error: any) {
    // Handle auth errors and translate to user-friendly Indonesian messages
    const message = error.message || "";
    if (message.includes("CredentialsSignin")) {
      return { error: "Email atau password yang Anda masukkan salah" };
    }
    return { error: "Terjadi kesalahan saat login. Silakan coba lagi." };
  }

  // Ambil profile user
  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { role: true }
  })

  if (!profile) {
    return { error: "Profil tidak ditemukan" }
  }

  // Redirect berdasarkan role
  const redirectPath = await getRedirectPath(profile.role, email)
  redirect(redirectPath)
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const company_name = formData.get('company_name') as string | null
  const address = formData.get('address') as string

  // Cek apakah email sudah terdaftar
  const existingUser = await prisma.profile.findUnique({
    where: { email }
  })

  if (existingUser) {
    return { error: "Email sudah terdaftar" }
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Buat user baru
  try {
    await prisma.profile.create({
      data: {
        email,
        password: hashedPassword,
        full_name,
        role: 'client',
        company_name: company_name || undefined,
        address,
      }
    })
  } catch (error: any) {
    return { error: error.message || "Gagal mendaftar" }
  }

  redirect('/login?message=Registrasi berhasil. Silakan login')
}

export async function logout() {
  await nextAuthSignOut({ redirectTo: '/login' })
}

export async function verifyPasswordAction(password: string) {
  const profile = await prisma.profile.findUnique({
    where: { email: (await getCurrentUserEmail()) || '' }
  })

  if (!profile || !profile.password) {
    return { error: "Sesi berakhir, silakan login kembali" }
  }

  const isValid = await verifyPassword(password, profile.password)

  if (!isValid) {
    return { error: "Password yang Anda masukkan salah" }
  }

  return { success: true }
}

async function getCurrentUserEmail(): Promise<string | null> {
  // Import di sini untuk menghindari circular dependency
  const { auth } = await import('@/lib/auth')
  const session = await auth()
  return session?.user?.email || null
}

export async function getProfile() {
  try {
    const email = await getCurrentUserEmail()
    if (!email) return null

    return await prisma.profile.findUnique({
      where: { email }
    })
  } catch (error: any) {
    // If it's a database connection error, return null instead of crashing the whole page
    if (error.message?.includes('Can\'t reach database server') || 
        error.message?.includes('PrismaClientInitializationError')) {
      console.error("Database connection error in getProfile:", error.message);
      return null;
    }
    console.error("Error in getProfile:", error);
    return null;
  }
}

export async function updateProfile(formData: {
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
}) {
  const email = await getCurrentUserEmail()
  if (!email) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.profile.update({
      where: { email },
      data: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      }
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal update profil" }
  }
}

export async function updatePasswordAction(formData: {
  current_password: string;
  new_password: string;
}) {
  const email = await getCurrentUserEmail()
  if (!email) {
    return { error: "Unauthorized" }
  }

  const profile = await prisma.profile.findUnique({
    where: { email }
  })

  if (!profile || !profile.password) {
    return { error: "Profil tidak ditemukan" }
  }

  // Verifikasi password saat ini
  const isValid = await verifyPassword(formData.current_password, profile.password)

  if (!isValid) {
    return { error: "Password saat ini salah" }
  }

  // Hash password baru
  const hashedPassword = await hashPassword(formData.new_password)

  try {
    await prisma.profile.update({
      where: { email },
      data: { password: hashedPassword }
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah password" }
  }
}
