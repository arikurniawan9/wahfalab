import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ALLOWED_ROLES = new Set(['admin', 'operator']);

async function getAuthorizedProfile() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { id: true, role: true, full_name: true, email: true },
  });

  if (!profile || !ALLOWED_ROLES.has(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { profile };
}

export async function POST(request: Request) {
  try {
    const authResult = await getAuthorizedProfile();
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const { catalog_id, action, old_price, new_price } = body;

    const history = await prisma.operationalHistory.create({
      data: {
        catalog_id,
        action,
        old_price: old_price ? parseFloat(old_price) : null,
        new_price: new_price ? parseFloat(new_price) : null,
        changed_by: authResult.profile.full_name || authResult.profile.email || authResult.profile.id,
      },
      include: {
        catalog: true
      }
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error creating history:', error);
    return NextResponse.json(
      { error: 'Gagal membuat history' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await getAuthorizedProfile();
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(request.url);
    const catalogId = searchParams.get('catalog_id');

    if (!catalogId) {
      return NextResponse.json(
        { error: 'catalog_id required' },
        { status: 400 }
      );
    }

    const history = await prisma.operationalHistory.findMany({
      where: { catalog_id: catalogId },
      orderBy: { changed_at: 'desc' },
      include: {
        catalog: true
      }
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil history' },
      { status: 500 }
    );
  }
}
