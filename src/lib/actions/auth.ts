'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Ambil role dari database menggunakan Prisma
  let profile = await prisma.profile.findUnique({
    where: { id: data.user?.id },
    select: { role: true }
  })

  // SELF-HEALING: Jika user ada di Auth tapi profil hilang di DB (misal habis reset)
  if (!profile && data.user) {
    console.log("Self-healing: Creating missing profile for user", data.user.id);
    profile = await prisma.profile.create({
      data: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 'User',
        role: 'client' // Default untuk user yang mendaftar sendiri
      },
      select: { role: true }
    });
  }

  // Redirect berdasarkan role
  if (profile?.role === 'admin') {
    redirect('/admin')
  } else if (profile?.role === 'operator') {
    redirect('/operator')
  } else if (profile?.role === 'field_officer') {
    redirect('/field')
  } else if (profile?.role === 'finance') {
    redirect('/finance')
  } else {
    redirect('/dashboard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const company_name = formData.get('company_name') as string | null
  const address = formData.get('address') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Ensure profile is created in Prisma if trigger fails or for redundancy
  if (data.user) {
    try {
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: {
          full_name,
          email,
          role: 'client', // Always set to client for self-registration
          company_name: company_name || undefined,
          address,
        },
        create: {
          id: data.user.id,
          full_name,
          email,
          role: 'client', // Always set to client for self-registration
          company_name: company_name || undefined,
          address,
        },
      })
    } catch (e) {
      console.error('Prisma Profile Creation Error:', e)
    }
  }

  redirect('/login?message=Cek email Anda untuk verifikasi')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return await prisma.profile.findUnique({
    where: { id: user.id }
  })
}

export async function updateProfile(formData: { full_name: string; email: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Update profile in Prisma
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        full_name: formData.full_name,
        email: formData.email,
      }
    })

    // Update user metadata in Supabase Auth
    await supabase.auth.updateUser({
      email: formData.email,
      data: {
        full_name: formData.full_name,
      }
    })

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal update profil" }
  }
}

export async function updatePassword(formData: { 
  current_password: string; 
  new_password: string; 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Sign in with current password to verify
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: formData.current_password,
    })

    if (signInError) {
      return { error: "Password saat ini salah" }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: formData.new_password,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah password" }
  }
}
