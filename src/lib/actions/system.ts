'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * Upload image to local public/img folder
 */
export async function uploadLocalImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('File tidak ditemukan');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    
    // Path absolute ke folder public/img
    const uploadDir = path.join(process.cwd(), 'public', 'img');
    
    // Pastikan direktori ada
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Return URL yang bisa diakses publik
    return { success: true, url: `/img/${fileName}` };
  } catch (error: any) {
    console.error('Local Upload Error:', error);
    return { error: error.message };
  }
}

/**
 * Get landing page configuration
 */
export async function getLandingPageConfig() {
  try {
    let config = await prisma.landingPageConfig.findFirst();
    if (!config) {
      config = await prisma.landingPageConfig.create({
        data: { id: "singleton" }
      });
    }
    return serializeData(config);
  } catch (error: any) {
    console.error('Error getting landing page config:', error);
    return { error: error.message };
  }
}

/**
 * Update landing page configuration
 */
export async function updateLandingPageConfig(data: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (profile?.role !== 'admin' && profile?.role !== 'content_manager') {
      throw new Error('Hanya Admin atau Content Manager yang bisa mengubah konten.');
    }

    const updated = await prisma.landingPageConfig.update({
      where: { id: 'singleton' },
      data: {
        hero_title: data.hero_title,
        hero_description: data.hero_description,
        hero_image_url: data.hero_image_url,
        hero_cta_text: data.hero_cta_text,
        hero_cta_link: data.hero_cta_link,
        banners: data.banners,
        navbar_menus: data.navbar_menus,
        features: data.features,
        portfolio: data.portfolio,
        gallery: data.gallery,
        commitment_title: data.commitment_title,
        commitment_content: data.commitment_content,
        portfolio_title: data.portfolio_title,
        portfolio_description: data.portfolio_description,
        legal_content: data.legal_content,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        contact_address: data.contact_address,
      }
    });

    revalidatePath('/');
    return { success: true, data: serializeData(updated) };
  } catch (error: any) {
    console.error('Error updating landing page config:', error);
    return { error: error.message };
  }
}

/**
 * Upload image for landing page (Banners, Hero, etc.)
 */
export async function uploadLandingPageImage(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const file = formData.get('file') as File;
    if (!file) throw new Error('File tidak ditemukan');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `landing-page/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('landing-page') // Menggunakan bucket khusus yang dibuat via UI
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('landing-page')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload Error:', error);
    return { error: error.message };
  }
}

/**
 * Get system stats for maintenance page
 */
export async function getSystemStats() {
  try {
    const [
      quotations, jobs, customers, assistants, 
      travelOrders, financialRecords, invoices, logs
    ] = await Promise.all([
      prisma.quotation.count(),
      prisma.jobOrder.count(),
      prisma.profile.count({ where: { role: 'client' } }),
      prisma.fieldAssistant.count(),
      prisma.travelOrder.count(),
      prisma.financialRecord.count(),
      prisma.invoice.count(),
      prisma.auditLog.count()
    ]);

    return {
      quotations,
      jobs,
      customers,
      assistants,
      travelOrders,
      financialRecords,
      invoices,
      logs
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    return null;
  }
}

/**
 * Export all data for backup
 */
export async function exportSystemData() {
  try {
    // Fetch all relevant data
    const [
      profiles,
      quotations,
      quotationItems,
      jobOrders,
      samplingAssignments,
      fieldAssistants,
      travelOrders,
      labAnalyses,
      sampleHandovers,
      invoices,
      payments,
      financialRecords,
      auditLogs,
      serviceCategories,
      services,
      equipment,
      regulations,
      regulationParameters,
      operationalCatalogs,
      operationalHistory,
      bankAccounts,
      notifications,
      approvalRequests
    ] = await Promise.all([
      prisma.profile.findMany(),
      prisma.quotation.findMany(),
      prisma.quotationItem.findMany(),
      prisma.jobOrder.findMany(),
      prisma.samplingAssignment.findMany(),
      prisma.fieldAssistant.findMany(),
      prisma.travelOrder.findMany(),
      prisma.labAnalysis.findMany(),
      prisma.sampleHandover.findMany(),
      prisma.invoice.findMany(),
      prisma.payment.findMany(),
      prisma.financialRecord.findMany(),
      prisma.auditLog.findMany(),
      prisma.serviceCategory.findMany(),
      prisma.service.findMany(),
      prisma.equipment.findMany(),
      prisma.regulation.findMany(),
      prisma.regulationParameter.findMany(),
      prisma.operationalCatalog.findMany(),
      prisma.operationalHistory.findMany(),
      prisma.bankAccount.findMany(),
      prisma.notification.findMany(),
      prisma.approvalRequest.findMany()
    ]);

    const backupData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      data: {
        profiles,
        quotations,
        quotationItems,
        jobOrders,
        samplingAssignments,
        fieldAssistants,
        travelOrders,
        labAnalyses,
        sampleHandovers,
        invoices,
        payments,
        financialRecords,
        auditLogs,
        serviceCategories,
        services,
        equipment,
        regulations,
        regulationParameters,
        operationalCatalogs,
        operationalHistory,
        bankAccounts,
        notifications,
        approvalRequests
      }
    };

    return serializeData(backupData);
  } catch (error: any) {
    console.error('Export Error:', error);
    return { error: error.message };
  }
}

/**
 * Cleanup a single specific category of data
 */
export async function cleanupSpecificCategory(category: string) {
  try {
    switch (category) {
      case 'logs':
        await prisma.$transaction([
          prisma.notification.deleteMany(),
          prisma.auditLog.deleteMany()
        ]);
        break;
      case 'transactions':
        await prisma.$transaction([
          prisma.financialRecord.deleteMany(),
          prisma.payment.deleteMany(),
          prisma.invoice.deleteMany()
        ]);
        break;
      case 'jobs':
        // Jobs have many dependencies, must delete from leaf to root
        await prisma.$transaction([
          prisma.labAnalysis.deleteMany(),
          prisma.sampleHandover.deleteMany(),
          prisma.travelOrder.deleteMany(),
          prisma.samplingAssignment.deleteMany(),
          // Delete financial dependencies of jobs
          prisma.payment.deleteMany(),
          prisma.invoice.deleteMany(),
          prisma.jobOrder.deleteMany()
        ]);
        break;
      case 'quotations':
        // Quotations are often linked to JobOrders
        await prisma.$transaction([
          // If we delete quotations, we must clear linked jobs first to avoid FK errors
          prisma.labAnalysis.deleteMany(),
          prisma.sampleHandover.deleteMany(),
          prisma.travelOrder.deleteMany(),
          prisma.samplingAssignment.deleteMany(),
          prisma.payment.deleteMany(),
          prisma.invoice.deleteMany(),
          prisma.jobOrder.deleteMany(),
          // Now clear quotation specifics
          prisma.quotationItem.deleteMany(),
          prisma.quotation.deleteMany()
        ]);
        break;
      case 'assistants':
        await prisma.fieldAssistant.deleteMany();
        break;
      case 'customers':
        // Clients might have quotations/jobs
        await prisma.profile.deleteMany({
          where: { role: 'client' }
        });
        break;
      default:
        throw new Error('Kategori tidak valid');
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error(`Cleanup Error (${category}):`, error);
    return { error: error.message };
  }
}

/**
 * Factory Reset: Delete all data except administrator accounts
 */
export async function factoryReset() {
  try {
    // 1. Get all admin IDs to preserve them
    const admins = await prisma.profile.findMany({
      where: { role: 'admin' },
      select: { id: true }
    });
    const adminIds = admins.map(a => a.id);

    // 2. Perform mass deletion in order
    await prisma.$transaction([
      // Operational & Feedback
      prisma.notification.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.approvalRequest.deleteMany(),
      
      // Laboratory & Jobs
      prisma.labAnalysis.deleteMany(),
      prisma.sampleHandover.deleteMany(),
      prisma.travelOrder.deleteMany(),
      prisma.samplingAssignment.deleteMany(),
      
      // Financial
      prisma.financialRecord.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.invoice.deleteMany(),
      
      // Core Business
      prisma.jobOrder.deleteMany(),
      prisma.quotationItem.deleteMany(),
      prisma.quotation.deleteMany(),
      
      // Master Data - Operation
      prisma.operationalHistory.deleteMany(),
      prisma.operationalCatalog.deleteMany(),
      prisma.equipment.deleteMany(),
      prisma.service.deleteMany(),
      prisma.serviceCategory.deleteMany(),
      prisma.regulationParameter.deleteMany(),
      prisma.regulation.deleteMany(),
      
      // Settings & Contacts
      prisma.fieldAssistant.deleteMany(),
      prisma.bankAccount.deleteMany(),
      // prisma.companyProfile.deleteMany(), // Usually keep company profile settings
      
      // Profiles (Keep Admins)
      prisma.profile.deleteMany({
        where: {
          id: { notIn: adminIds }
        }
      })
    ]);

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Factory Reset Error:', error);
    return { error: error.message };
  }
}

/**
 * Restore system data from a backup object
 */
export async function restoreSystemData(backupObj: any) {
  try {
    if (!backupObj || !backupObj.data) {
      throw new Error('Format file backup tidak valid');
    }

    const { data } = backupObj;

    // 1. First, clear EVERYTHING
    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.approvalRequest.deleteMany(),
      prisma.labAnalysis.deleteMany(),
      prisma.sampleHandover.deleteMany(),
      prisma.travelOrder.deleteMany(),
      prisma.samplingAssignment.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.financialRecord.deleteMany(),
      prisma.invoice.deleteMany(),
      prisma.jobOrder.deleteMany(),
      prisma.quotationItem.deleteMany(),
      prisma.quotation.deleteMany(),
      prisma.operationalHistory.deleteMany(),
      prisma.operationalCatalog.deleteMany(),
      prisma.equipment.deleteMany(),
      prisma.service.deleteMany(),
      prisma.serviceCategory.deleteMany(),
      prisma.regulationParameter.deleteMany(),
      prisma.regulation.deleteMany(),
      prisma.fieldAssistant.deleteMany(),
      prisma.bankAccount.deleteMany(),
      prisma.profile.deleteMany(),
    ]);

    // 2. Restore in order of dependencies (Root to Leaf)
    
    // Profiles
    if (data.profiles?.length > 0) {
      await prisma.profile.createMany({ data: data.profiles });
    }

    // Bank Accounts
    if (data.bankAccounts?.length > 0) {
      await prisma.bankAccount.createMany({ data: data.bankAccounts });
    }

    // Service Categories
    if (data.serviceCategories?.length > 0) {
      await prisma.serviceCategory.createMany({ data: data.serviceCategories });
    }

    // Regulations
    if (data.regulations?.length > 0) {
      await prisma.regulation.createMany({ data: data.regulations });
    }

    // Regulation Parameters
    if (data.regulationParameters?.length > 0) {
      await prisma.regulationParameter.createMany({ data: data.regulationParameters });
    }

    // Services
    if (data.services?.length > 0) {
      await prisma.service.createMany({ data: data.services });
    }

    // Equipment
    if (data.equipment?.length > 0) {
      await prisma.equipment.createMany({ data: data.equipment });
    }

    // Operational Catalogs
    if (data.operationalCatalogs?.length > 0) {
      await prisma.operationalCatalog.createMany({ data: data.operationalCatalogs });
    }

    // Operational History
    if (data.operationalHistory?.length > 0) {
      await prisma.operationalHistory.createMany({ data: data.operationalHistory });
    }

    // Quotations
    if (data.quotations?.length > 0) {
      await prisma.quotation.createMany({ data: data.quotations });
    }

    // Quotation Items
    if (data.quotationItems?.length > 0) {
      await prisma.quotationItem.createMany({ data: data.quotationItems });
    }

    // Job Orders
    if (data.jobOrders?.length > 0) {
      await prisma.jobOrder.createMany({ data: data.jobOrders });
    }

    // Field Assistants
    if (data.fieldAssistants?.length > 0) {
      await prisma.fieldAssistant.createMany({ data: data.fieldAssistants });
    }

    // Sampling Assignments
    if (data.samplingAssignments?.length > 0) {
      await prisma.samplingAssignment.createMany({ data: data.samplingAssignments });
    }

    // Travel Orders
    if (data.travelOrders?.length > 0) {
      await prisma.travelOrder.createMany({ data: data.travelOrders });
    }

    // Sample Handovers
    if (data.sampleHandovers?.length > 0) {
      await prisma.sampleHandover.createMany({ data: data.sampleHandovers });
    }

    // Lab Analyses
    if (data.labAnalyses?.length > 0) {
      await prisma.labAnalysis.createMany({ data: data.labAnalyses });
    }

    // Invoices
    if (data.invoices?.length > 0) {
      await prisma.invoice.createMany({ data: data.invoices });
    }

    // Payments
    if (data.payments?.length > 0) {
      await prisma.payment.createMany({ data: data.payments });
    }

    // Financial Records
    if (data.financialRecords?.length > 0) {
      await prisma.financialRecord.createMany({ data: data.financialRecords });
    }

    // Approval Requests
    if (data.approvalRequests?.length > 0) {
      await prisma.approvalRequest.createMany({ data: data.approvalRequests });
    }

    // Notifications
    if (data.notifications?.length > 0) {
      await prisma.notification.createMany({ data: data.notifications });
    }

    // Audit Logs
    if (data.auditLogs?.length > 0) {
      await prisma.auditLog.createMany({ data: data.auditLogs });
    }

    revalidatePath('/admin');
    revalidatePath('/admin/settings/system');
    
    return { success: true };
  } catch (error: any) {
    console.error('Restore Error:', error);
    return { error: error.message };
  }
}
