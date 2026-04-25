import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getManagedUploadHealth } from '@/lib/storage/upload-router'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const health = await getManagedUploadHealth()
    return NextResponse.json(health)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
