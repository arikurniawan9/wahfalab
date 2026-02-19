import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { catalog_id, action, old_price, new_price, changed_by } = body;

    const history = await prisma.operationalHistory.create({
      data: {
        catalog_id,
        action,
        old_price: old_price ? parseFloat(old_price) : null,
        new_price: new_price ? parseFloat(new_price) : null,
        changed_by: changed_by || null,
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
