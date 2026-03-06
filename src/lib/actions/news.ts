'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'

export async function getNews() {
  try {
    const news = await (prisma as any).news.findMany({
      orderBy: { created_at: 'desc' }
    });
    return serializeData(news);
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return { error: error.message };
  }
}

export async function getPublishedNews() {
  try {
    const news = await (prisma as any).news.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' }
    });
    return serializeData(news);
  } catch (error: any) {
    console.error('Error fetching published news:', error);
    return { error: error.message };
  }
}

export async function getNewsBySlug(slug: string) {
  try {
    if (!slug) return { error: "Slug is required" };

    const item = await (prisma as any).news.findUnique({
      where: { slug }
    });
    
    if (item && item.is_published) {
      await (prisma as any).news.update({
        where: { id: item.id },
        data: { view_count: { increment: 1 } }
      });
    }
    
    return serializeData(item);
  } catch (error: any) {
    console.error('Error fetching news by slug:', error);
    return { error: error.message };
  }
}

export async function upsertNews(data: any) {
  try {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (data.id) {
      const updated = await (prisma as any).news.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: data.slug || slug,
          content: data.content,
          image_url: data.image_url,
          category: data.category,
          tags: data.tags || [],
          show_tags: data.show_tags !== undefined ? data.show_tags : true,
          is_published: data.is_published,
        }
      });
      revalidatePath('/news');
      revalidatePath('/content-manager/news');
      return { success: true, data: serializeData(updated) };
    } else {
      const created = await (prisma as any).news.create({
        data: {
          title: data.title,
          slug: slug,
          content: data.content,
          image_url: data.image_url,
          category: data.category,
          tags: data.tags || [],
          show_tags: data.show_tags !== undefined ? data.show_tags : true,
          is_published: data.is_published !== undefined ? data.is_published : true,
        }
      });
      revalidatePath('/news');
      revalidatePath('/content-manager/news');
      return { success: true, data: serializeData(created) };
    }
  } catch (error: any) {
    console.error('Error upserting news:', error);
    return { error: error.message };
  }
}

export async function deleteNews(id: string) {
  try {
    await (prisma as any).news.delete({
      where: { id }
    });
    revalidatePath('/news');
    revalidatePath('/content-manager/news');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting news:', error);
    return { error: error.message };
  }
}

/**
 * Contact Message Actions
 */
export async function sendContactMessage(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    const created = await (prisma as any).contactMessage.create({
      data: { name, email, phone, subject, message }
    });

    return { success: true, data: serializeData(created) };
  } catch (error: any) {
    console.error('Error sending contact message:', error);
    return { error: error.message };
  }
}

export async function getContactMessages() {
  try {
    const messages = await (prisma as any).contactMessage.findMany({
      orderBy: { created_at: 'desc' }
    });
    return serializeData(messages);
  } catch (error: any) {
    console.error('Error fetching contact messages:', error);
    return { error: error.message };
  }
}

export async function markMessageAsRead(id: string) {
  try {
    await (prisma as any).contactMessage.update({
      where: { id },
      data: { is_read: true }
    });
    revalidatePath('/content-manager/messages');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    return { error: error.message };
  }
}

export async function deleteContactMessage(id: string) {
  try {
    await (prisma as any).contactMessage.delete({
      where: { id }
    });
    revalidatePath('/content-manager/messages');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return { error: error.message };
  }
}
