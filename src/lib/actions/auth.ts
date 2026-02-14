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
  const profile = await prisma.profile.findUnique({
    where: { id: data.user?.id },
    select: { role: true }
  })

  // Redirect berdasarkan role
  if (profile?.role === 'admin') {
    redirect('/admin')
  } else if (profile?.role === 'operator') {
    redirect('/operator')
  } else {
    redirect('/dashboard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string

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
        update: { full_name },
        create: {
          id: data.user.id,
          full_name,
          role: 'client',
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
