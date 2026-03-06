"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils/serialize";
import { audit } from "@/lib/audit-log";

/**
 * Get system statistics for maintenance dashboard
 */
export async function getSystemStats() {
  try {
    const [
      quotations,
      jobs,
      logs,
      financialRecords,
      assistants,
      customers,
      staff
    ] = await Promise.all([
      prisma.quotation.count(),
      prisma.jobOrder.count(),
      prisma.auditLog.count(),
      prisma.financialRecord.count(),
      prisma.fieldAssistant.count(),
      prisma.profile.count({ where: { role: 'client' } }),
      prisma.profile.count({ 
        where: { 
          role: { 
            in: ['operator', 'analyst', 'field_officer', 'reporting', 'finance', 'content_manager'] 
          } 
        } 
      })
    ]);

    const total_records = quotations + jobs + logs + financialRecords + assistants + customers + staff;

    return {
      quotations,
      jobs,
      logs,
      financialRecords,
      assistants,
      customers,
      staff,
      total_records
    };
  } catch (error) {
    console.error('Stats Error:', error);
    return null;
  }
}

/**
 * Get recent system maintenance activities from audit logs
 */
export async function getRecentMaintenanceLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['export_system_data', 'restore_system_data', 'cleanup_category', 'factory_reset', 'login', 'logout']
        }
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    return serializeData(logs);
  } catch (error) {
    console.error('Maintenance Logs Error:', error);
    return [];
  }
}

/**
 * Export specific or all data for backup
 */
export async function exportSystemData(categories?: string[]) {
  try {
    const isFull = !categories || categories.length === 0 || categories.includes('all');
    
    // Define what tables belong to which category
    const categoryMap: Record<string, string[]> = {
      users: ['profiles', 'bankAccounts'],
      staff: ['profiles'],
      quotations: ['quotations', 'quotationItems'],
      jobs: ['jobOrders', 'samplingAssignments', 'fieldAssistants', 'travelOrders', 'labAnalyses', 'sampleHandovers'],
      finance: ['invoices', 'payments', 'financialRecords'],
      master: ['serviceCategories', 'services', 'equipment', 'regulations', 'regulationParameters', 'operationalCatalogs'],
      system: ['auditLogs', 'notifications', 'approvalRequests', 'operationalHistory']
    };

    const tablesToFetch = new Set<string>();
    if (isFull) {
      Object.values(categoryMap).forEach(tables => tables.forEach(t => tablesToFetch.add(t)));
    } else {
      categories?.forEach(cat => {
        if (categoryMap[cat]) {
          categoryMap[cat].forEach(t => tablesToFetch.add(t));
        }
      });
    }

    // Role definitions for filtering
    const staffRoles = ['operator', 'analyst', 'field_officer', 'reporting', 'finance', 'content_manager'];

    const [
      profilesRaw, quotations, quotationItems, jobOrders, samplingAssignments,
      fieldAssistants, travelOrders, labAnalyses, sampleHandovers, invoices,
      payments, financialRecords, auditLogs, serviceCategories, services,
      equipment, regulations, regulationParameters, operationalCatalogs,
      operationalHistory, bankAccounts, notifications, approvalRequests
    ] = await Promise.all([
      // Only fetch profiles if needed, and handle filtering based on categories
      (tablesToFetch.has('profiles')) ? prisma.profile.findMany() : Promise.resolve([]),
      tablesToFetch.has('quotations') ? prisma.quotation.findMany() : Promise.resolve([]),
      tablesToFetch.has('quotationItems') ? prisma.quotationItem.findMany() : Promise.resolve([]),
      tablesToFetch.has('jobOrders') ? prisma.jobOrder.findMany() : Promise.resolve([]),
      tablesToFetch.has('samplingAssignments') ? prisma.samplingAssignment.findMany() : Promise.resolve([]),
      tablesToFetch.has('fieldAssistants') ? prisma.fieldAssistant.findMany() : Promise.resolve([]),
      tablesToFetch.has('travelOrders') ? prisma.travelOrder.findMany() : Promise.resolve([]),
      tablesToFetch.has('labAnalyses') ? prisma.labAnalysis.findMany() : Promise.resolve([]),
      tablesToFetch.has('sampleHandovers') ? prisma.sampleHandover.findMany() : Promise.resolve([]),
      tablesToFetch.has('invoices') ? prisma.invoice.findMany() : Promise.resolve([]),
      tablesToFetch.has('payments') ? prisma.payment.findMany() : Promise.resolve([]),
      tablesToFetch.has('financialRecords') ? prisma.financialRecord.findMany() : Promise.resolve([]),
      tablesToFetch.has('auditLogs') ? prisma.auditLog.findMany() : Promise.resolve([]),
      tablesToFetch.has('serviceCategories') ? prisma.serviceCategory.findMany() : Promise.resolve([]),
      tablesToFetch.has('services') ? prisma.service.findMany() : Promise.resolve([]),
      tablesToFetch.has('equipment') ? prisma.equipment.findMany() : Promise.resolve([]),
      tablesToFetch.has('regulations') ? prisma.regulation.findMany() : Promise.resolve([]),
      tablesToFetch.has('regulationParameters') ? prisma.regulationParameter.findMany() : Promise.resolve([]),
      tablesToFetch.has('operationalCatalogs') ? prisma.operationalCatalog.findMany() : Promise.resolve([]),
      tablesToFetch.has('operationalHistory') ? prisma.operationalHistory.findMany() : Promise.resolve([]),
      tablesToFetch.has('bankAccounts') ? prisma.bankAccount.findMany() : Promise.resolve([]),
      tablesToFetch.has('notifications') ? prisma.notification.findMany() : Promise.resolve([]),
      tablesToFetch.has('approvalRequests') ? prisma.approvalRequest.findMany() : Promise.resolve([])
    ]);

    // FILTER PROFILES BASED ON CATEGORIES
    let profiles = profilesRaw;
    if (!isFull) {
      const wantUsers = categories?.includes('users');
      const wantStaff = categories?.includes('staff');

      if (wantUsers && !wantStaff) {
        profiles = profilesRaw.filter(p => p.role === 'client');
      } else if (wantStaff && !wantUsers) {
        profiles = profilesRaw.filter(p => staffRoles.includes(p.role));
      } else if (wantUsers && wantStaff) {
        profiles = profilesRaw.filter(p => p.role === 'client' || staffRoles.includes(p.role));
      }
      // If none, but profiles was fetched (shouldn't happen with current logic), it remains as is or empty
    }

    const backupData = {
      version: '1.2',
      timestamp: new Date().toISOString(),
      type: isFull ? 'full' : 'partial',
      categories: isFull ? ['all'] : categories,
      data: {
        profiles, quotations, quotationItems, jobOrders, samplingAssignments,
        fieldAssistants, travelOrders, labAnalyses, sampleHandovers, invoices,
        payments, financialRecords, auditLogs, serviceCategories, services,
        equipment, regulations, regulationParameters, operationalCatalogs,
        operationalHistory, bankAccounts, notifications, approvalRequests
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
        await prisma.$transaction([
          prisma.labAnalysis.deleteMany(),
          prisma.sampleHandover.deleteMany(),
          prisma.travelOrder.deleteMany(),
          prisma.samplingAssignment.deleteMany(),
          prisma.payment.deleteMany(),
          prisma.invoice.deleteMany(),
          prisma.jobOrder.deleteMany()
        ]);
        break;
      case 'quotations':
        await prisma.$transaction([
          prisma.labAnalysis.deleteMany(),
          prisma.sampleHandover.deleteMany(),
          prisma.travelOrder.deleteMany(),
          prisma.samplingAssignment.deleteMany(),
          prisma.payment.deleteMany(),
          prisma.invoice.deleteMany(),
          prisma.jobOrder.deleteMany(),
          prisma.quotationItem.deleteMany(),
          prisma.quotation.deleteMany()
        ]);
        break;
      case 'assistants':
        await prisma.fieldAssistant.deleteMany();
        break;
      case 'customers':
        await prisma.profile.deleteMany({
          where: { role: 'client' }
        });
        break;
      case 'staff':
        await prisma.profile.deleteMany({
          where: { 
            role: { 
              in: ['operator', 'analyst', 'field_officer', 'reporting', 'finance', 'content_manager'] 
            } 
          }
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
    const admins = await prisma.profile.findMany({
      where: { role: 'admin' },
      select: { id: true }
    });
    const adminIds = admins.map(a => a.id);

    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.approvalRequest.deleteMany(),
      prisma.labAnalysis.deleteMany(),
      prisma.sampleHandover.deleteMany(),
      prisma.travelOrder.deleteMany(),
      prisma.samplingAssignment.deleteMany(),
      prisma.financialRecord.deleteMany(),
      prisma.payment.deleteMany(),
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

    const { data, type, categories } = backupObj;
    const isFull = type === 'full' || !type || (categories && categories.includes('all'));

    if (isFull) {
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
    }

    if (data.profiles?.length > 0) await prisma.profile.createMany({ data: data.profiles, skipDuplicates: true });
    if (data.bankAccounts?.length > 0) await prisma.bankAccount.createMany({ data: data.bankAccounts, skipDuplicates: true });
    if (data.serviceCategories?.length > 0) await prisma.serviceCategory.createMany({ data: data.serviceCategories, skipDuplicates: true });
    if (data.regulations?.length > 0) await prisma.regulation.createMany({ data: data.regulations, skipDuplicates: true });
    if (data.regulationParameters?.length > 0) await prisma.regulationParameter.createMany({ data: data.regulationParameters, skipDuplicates: true });
    if (data.services?.length > 0) await prisma.service.createMany({ data: data.services, skipDuplicates: true });
    if (data.equipment?.length > 0) await prisma.equipment.createMany({ data: data.equipment, skipDuplicates: true });
    if (data.operationalCatalogs?.length > 0) await prisma.operationalCatalog.createMany({ data: data.operationalCatalogs, skipDuplicates: true });
    if (data.operationalHistory?.length > 0) await prisma.operationalHistory.createMany({ data: data.operationalHistory, skipDuplicates: true });
    if (data.quotations?.length > 0) await prisma.quotation.createMany({ data: data.quotations, skipDuplicates: true });
    if (data.quotationItems?.length > 0) await prisma.quotationItem.createMany({ data: data.quotationItems, skipDuplicates: true });
    if (data.jobOrders?.length > 0) await prisma.jobOrder.createMany({ data: data.jobOrders, skipDuplicates: true });
    if (data.fieldAssistants?.length > 0) await prisma.fieldAssistant.createMany({ data: data.fieldAssistants, skipDuplicates: true });
    if (data.samplingAssignments?.length > 0) await prisma.samplingAssignment.createMany({ data: data.samplingAssignments, skipDuplicates: true });
    if (data.travelOrders?.length > 0) await prisma.travelOrder.createMany({ data: data.travelOrders, skipDuplicates: true });
    if (data.sampleHandovers?.length > 0) await prisma.sampleHandover.createMany({ data: data.sampleHandovers, skipDuplicates: true });
    if (data.labAnalyses?.length > 0) await prisma.labAnalysis.createMany({ data: data.labAnalyses, skipDuplicates: true });
    if (data.invoices?.length > 0) await prisma.invoice.createMany({ data: data.invoices, skipDuplicates: true });
    if (data.payments?.length > 0) await prisma.payment.createMany({ data: data.payments, skipDuplicates: true });
    if (data.financialRecords?.length > 0) await prisma.financialRecord.createMany({ data: data.financialRecords, skipDuplicates: true });
    if (data.approvalRequests?.length > 0) await prisma.approvalRequest.createMany({ data: data.approvalRequests, skipDuplicates: true });
    if (data.notifications?.length > 0) await prisma.notification.createMany({ data: data.notifications, skipDuplicates: true });
    if (data.auditLogs?.length > 0) await prisma.auditLog.createMany({ data: data.auditLogs, skipDuplicates: true });

    revalidatePath('/admin');
    revalidatePath('/admin/settings/system');
    
    return { success: true };
  } catch (error: any) {
    console.error('Restore Error:', error);
    return { error: error.message };
  }
}

/**
 * Landing Page Config Actions
 */
export async function getLandingPageConfig() {
  try {
    const config = await prisma.landingPageConfig.findFirst();
    return serializeData(config);
  } catch (error) {
    console.error('Get Config Error:', error);
    return null;
  }
}

export async function updateLandingPageConfig(data: any) {
  try {
    const existing = await prisma.landingPageConfig.findFirst();
    let config;
    
    if (existing) {
      config = await prisma.landingPageConfig.update({
        where: { id: existing.id },
        data
      });
    } else {
      config = await prisma.landingPageConfig.create({
        data
      });
    }
    
    revalidatePath('/');
    return { success: true, data: serializeData(config) };
  } catch (error: any) {
    console.error('Update Config Error:', error);
    return { error: error.message };
  }
}

/**
 * Utility for local image path conversion
 */
export async function uploadLocalImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Note: This is a placeholder for local file handling
    return { success: true, url: '/img/placeholder.jpg' };
  } catch (error) {
    return { success: false, error: 'Failed to upload' };
  }
}
