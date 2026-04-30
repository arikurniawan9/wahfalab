'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { requireActionRole } from '@/lib/actions/action-guard'

const CASH_ACCOUNT_NUMBER = 'CASH-001'

function toJakartaDateKey(value?: Date | string) {
  const baseDate = value ? new Date(value) : new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(baseDate)

  const year = parts.find((part) => part.type === 'year')?.value || '0000'
  const month = parts.find((part) => part.type === 'month')?.value || '00'
  const day = parts.find((part) => part.type === 'day')?.value || '00'

  return `${year}-${month}-${day}`
}

function toJakartaPeriodKey(value?: Date | string) {
  return toJakartaDateKey(value).slice(0, 7)
}

async function ensureCashAccount() {
  const existing = await prisma.bankAccount.findUnique({
    where: { account_number: CASH_ACCOUNT_NUMBER }
  })

  if (existing) return existing

  return prisma.bankAccount.create({
    data: {
      bank_name: 'Kas Tunai',
      account_number: CASH_ACCOUNT_NUMBER,
      account_holder: 'WahfaLab',
      balance: 0,
      is_active: true
    }
  })
}

/**
 * Get all active bank accounts
 */
export async function getBankAccounts() {
  try {
    await requireActionRole(['admin', 'finance', 'operator'])
    await ensureCashAccount()
    const accounts = await prisma.bankAccount.findMany({
      where: { is_active: true },
      orderBy: [
        { bank_name: 'asc' },
        { account_number: 'asc' }
      ]
    })
    return serializeData(accounts)
  } catch (error: any) {
    return []
  }
}

/**
 * Create or Update Bank Account
 */
export async function saveBankAccount(data: {
  id?: string,
  bank_name: string,
  account_number: string,
  account_holder: string,
  balance?: number
}) {
  try {
    await requireActionRole(['admin', 'finance'])

    if (data.id) {
      const existing = await prisma.bankAccount.findUnique({ where: { id: data.id } })
      if (existing?.account_number === CASH_ACCOUNT_NUMBER) {
        return { error: 'Kas Tunai adalah rekening sistem dan tidak dapat diubah' }
      }

      await prisma.bankAccount.update({
        where: { id: data.id },
        data: {
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_holder: data.account_holder,
          balance: data.balance
        }
      })
    } else {
      await prisma.bankAccount.create({
        data: {
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_holder: data.account_holder,
          balance: data.balance || 0
        }
      })
    }

    const paths = ['/finance', '/finance/settings/banks', '/admin/finance', '/admin/finance/settings/banks']
    paths.forEach((path) => revalidatePath(path))
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Get all financial records with pagination and filtering
 */
export async function getFinancialRecords(page = 1, limit = 10, type?: 'income' | 'expense', category?: string, bankAccountId?: string) {
  try {
    await requireActionRole(['admin', 'finance'])

    const skip = (page - 1) * limit
    const where: any = {}
    if (type) where.type = type
    if (category && category !== 'all') where.category = category
    if (bankAccountId && bankAccountId !== 'all') where.bank_account_id = bankAccountId

    const [items, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transaction_date: 'desc' },
        include: {
          handler: { select: { full_name: true } },
          bank_account: { select: { bank_name: true, account_number: true, account_holder: true } }
        }
      }),
      prisma.financialRecord.count({ where })
    ])

    return serializeData({
      items,
      total,
      pages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getCashAccount() {
  try {
    await requireActionRole(['admin', 'finance', 'operator'])
    return serializeData(await ensureCashAccount())
  } catch (error: any) {
    return null
  }
}

export async function getCashClosingEntries(limit = 20) {
  try {
    await requireActionRole(['admin', 'finance'])

    const logs = await prisma.auditLog.findMany({
      where: { entity_type: 'cash_closing' },
      orderBy: [{ entity_id: 'desc' }, { created_at: 'desc' }],
      take: Math.max(limit * 2, 20)
    })

    const byDate = new Map<string, any>()

    for (const log of logs as any[]) {
      const payload = (log.new_data as any) || {}
      const dateKey = payload.date || log.entity_id
      if (!dateKey || byDate.has(dateKey)) continue

      byDate.set(dateKey, {
        id: log.id,
        date: dateKey,
        systemBalance: Number(payload.systemBalance || 0),
        physicalBalance: Number(payload.physicalBalance || 0),
        difference: Number(payload.difference || 0),
        discrepancyReason: String(payload.discrepancyReason || ''),
        notes: String(payload.notes || ''),
        closedById: payload.closedById || log.user_id || null,
        closedByName: payload.closedByName || log.user_email || 'System',
        createdAt: log.created_at
      })

      if (byDate.size >= limit) break
    }

    const items = Array.from(byDate.values())
    return serializeData({ items, total: items.length })
  } catch (error: any) {
    return { items: [], total: 0 }
  }
}

export async function saveCashClosing(input: {
  date?: string
  physicalBalance: number
  discrepancyReason?: string
  notes?: string
}) {
  try {
    const actor = await requireActionRole(['admin', 'finance'])

    const cashAccount = await ensureCashAccount()
    const dateKey = toJakartaDateKey(input.date || new Date())
    const systemBalance = Number(cashAccount.balance || 0)
    const physicalBalance = Number(input.physicalBalance || 0)

    if (!Number.isFinite(physicalBalance) || physicalBalance < 0) {
      return { error: 'Saldo fisik tidak valid' }
    }

    const difference = physicalBalance - systemBalance
    const discrepancyReason = String(input.discrepancyReason || '').trim()

    if (difference !== 0 && !discrepancyReason) {
      return { error: 'Alasan selisih wajib diisi jika saldo tidak sama' }
    }

    const payload = {
      date: dateKey,
      accountId: cashAccount.id,
      accountNumber: cashAccount.account_number,
      systemBalance,
      physicalBalance,
      difference,
      discrepancyReason,
      notes: String(input.notes || '').trim(),
      closedById: actor.id,
      closedByName: actor.full_name || actor.email || 'Finance'
    }

    const existing = await prisma.auditLog.findFirst({
      where: {
        entity_type: 'cash_closing',
        entity_id: dateKey
      },
      orderBy: { created_at: 'desc' }
    })

    if (existing) {
      await prisma.auditLog.update({
        where: { id: existing.id },
        data: {
          action: 'cash_closing_update',
          user_id: actor?.id || null,
          user_email: actor?.email || null,
          user_role: actor?.role || null,
          old_data: existing.new_data || existing.old_data || null,
          new_data: payload,
          metadata: {
            source: 'finance_cash_page',
            updatedAt: new Date().toISOString()
          }
        }
      })
    } else {
      await prisma.auditLog.create({
        data: {
          action: 'cash_closing_create',
          entity_type: 'cash_closing',
          entity_id: dateKey,
          user_id: actor?.id || null,
          user_email: actor?.email || null,
          user_role: actor?.role || null,
          new_data: payload,
          metadata: {
            source: 'finance_cash_page',
            createdAt: new Date().toISOString()
          }
        }
      })
    }

    const paths = [
      '/finance/settings/cash',
      '/admin/finance/settings/cash',
      '/finance/settings/banks',
      '/admin/finance/settings/banks'
    ]
    paths.forEach((path) => revalidatePath(path))

    return {
      success: true,
      saved: serializeData(payload),
      updated: Boolean(existing)
    }
  } catch (error: any) {
    return { error: error.message || 'Gagal menyimpan penutupan kas' }
  }
}

type FinancePeriodLockStatus = {
  period: string
  isLocked: boolean
  reason: string
  updatedAt: Date | null
  updatedByName: string
  updatedById: string | null
}

async function resolveFinancePeriodLock(period: string): Promise<FinancePeriodLockStatus> {
  const latest = await prisma.auditLog.findFirst({
    where: {
      entity_type: 'finance_period_lock',
      entity_id: period
    },
    orderBy: { created_at: 'desc' }
  })

  if (!latest) {
    return {
      period,
      isLocked: false,
      reason: '',
      updatedAt: null,
      updatedByName: '',
      updatedById: null
    }
  }

  const payload = (latest.new_data as any) || {}
  const isLocked = typeof payload.isLocked === 'boolean'
    ? Boolean(payload.isLocked)
    : latest.action === 'lock_period'

  return {
    period,
    isLocked,
    reason: String(payload.reason || ''),
    updatedAt: latest.created_at || null,
    updatedByName: String(payload.updatedByName || latest.user_email || ''),
    updatedById: payload.updatedById || latest.user_id || null
  }
}

export async function isFinancePeriodLocked(date?: Date | string) {
  try {
    const period = toJakartaPeriodKey(date || new Date())
    return serializeData(await resolveFinancePeriodLock(period))
  } catch (error: any) {
    return {
      period: toJakartaPeriodKey(new Date()),
      isLocked: false,
      reason: '',
      updatedAt: null,
      updatedByName: '',
      updatedById: null
    }
  }
}

export async function getFinancePeriodLocks(limit = 12) {
  try {
    await requireActionRole(['admin', 'finance'])

    const logs = await prisma.auditLog.findMany({
      where: { entity_type: 'finance_period_lock' },
      orderBy: [{ entity_id: 'desc' }, { created_at: 'desc' }],
      take: Math.max(limit * 3, 24)
    })

    const byPeriod = new Map<string, any>()
    for (const log of logs as any[]) {
      const period = log.entity_id || (log.new_data as any)?.period
      if (!period || byPeriod.has(period)) continue

      const payload = (log.new_data as any) || {}
      const isLocked = typeof payload.isLocked === 'boolean'
        ? Boolean(payload.isLocked)
        : log.action === 'lock_period'

      byPeriod.set(period, {
        id: log.id,
        period,
        isLocked,
        reason: String(payload.reason || ''),
        updatedAt: log.created_at,
        updatedByName: String(payload.updatedByName || log.user_email || ''),
        updatedById: payload.updatedById || log.user_id || null
      })

      if (byPeriod.size >= limit) break
    }

    const items = Array.from(byPeriod.values())
    return serializeData({ items, total: items.length })
  } catch (error: any) {
    return { items: [], total: 0 }
  }
}

export async function setFinancePeriodLock(input: {
  period: string
  isLocked: boolean
  reason?: string
}) {
  try {
    const profile = await requireActionRole(['admin', 'finance'])

    const period = String(input.period || '').trim()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      return { error: 'Format periode tidak valid (YYYY-MM)' }
    }

    const reason = String(input.reason || '').trim()
    if (input.isLocked && !reason) {
      return { error: 'Alasan lock periode wajib diisi' }
    }

    const current = await resolveFinancePeriodLock(period)
    if (current.isLocked === input.isLocked && current.reason === reason) {
      return {
        success: true,
        unchanged: true,
        lock: serializeData(current)
      }
    }

    const payload = {
      period,
      isLocked: Boolean(input.isLocked),
      reason,
      updatedById: profile.id,
      updatedByName: profile.full_name || profile.email || 'Finance'
    }

    await prisma.auditLog.create({
      data: {
        action: input.isLocked ? 'lock_period' : 'unlock_period',
        entity_type: 'finance_period_lock',
        entity_id: period,
        user_id: profile.id,
        user_email: profile.email || null,
        user_role: profile.role,
        old_data: {
          period,
          isLocked: current.isLocked,
          reason: current.reason
        },
        new_data: payload,
        metadata: {
          source: 'finance_cash_page',
          changedAt: new Date().toISOString()
        }
      }
    })

    const paths = [
      '/finance',
      '/admin/finance',
      '/finance/transactions',
      '/admin/finance/transactions',
      '/finance/income',
      '/admin/finance/income',
      '/finance/expense',
      '/admin/finance/expense',
      '/finance/cashflow',
      '/admin/finance/cashflow',
      '/finance/settings/cash',
      '/admin/finance/settings/cash'
    ]
    paths.forEach((path) => revalidatePath(path))

    return {
      success: true,
      lock: serializeData(payload)
    }
  } catch (error: any) {
    return { error: error.message || 'Gagal mengubah lock periode' }
  }
}

export async function getBankLedgerSummary(bankAccountId: string) {
  try {
    await requireActionRole(['admin', 'finance'])

    const [income, expense, count] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { bank_account_id: bankAccountId, type: 'income' },
        _sum: { amount: true }
      }),
      prisma.financialRecord.aggregate({
        where: { bank_account_id: bankAccountId, type: 'expense' },
        _sum: { amount: true }
      }),
      prisma.financialRecord.count({
        where: { bank_account_id: bankAccountId }
      })
    ])

    const totalIncome = Number(income._sum.amount || 0)
    const totalExpense = Number(expense._sum.amount || 0)

    return {
      totalIncome,
      totalExpense,
      netMovement: totalIncome - totalExpense,
      transactionCount: count
    }
  } catch (error: any) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      netMovement: 0,
      transactionCount: 0
    }
  }
}

async function getLedgerAggregate(where: any) {
  const grouped = await prisma.financialRecord.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true }
  })

  let totalIncome = 0
  let totalExpense = 0

  for (const row of grouped as any[]) {
    if (row.type === 'income') {
      totalIncome = Number(row._sum?.amount || 0)
    }
    if (row.type === 'expense') {
      totalExpense = Number(row._sum?.amount || 0)
    }
  }

  return {
    totalIncome,
    totalExpense,
    netMovement: totalIncome - totalExpense
  }
}

export async function getBankLedgerDetails(
  bankAccountId: string,
  startDate?: string,
  endDate?: string,
  transactionType?: 'income' | 'expense' | 'all'
) {
  try {
    await requireActionRole(['admin', 'finance'])

    const getJakartaDateKey = (value: Date | string) => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date(value))

      const year = parts.find((part) => part.type === 'year')?.value || '0000'
      const month = parts.find((part) => part.type === 'month')?.value || '00'
      const day = parts.find((part) => part.type === 'day')?.value || '00'
      return `${year}-${month}-${day}`
    }

    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        OR: [
          { id: bankAccountId },
          { account_number: bankAccountId }
        ]
      },
      select: { id: true, balance: true }
    })

    if (!bankAccount) {
      return {
        items: [],
        total: 0,
        totalIncome: 0,
        totalExpense: 0,
        netMovement: 0,
        sumAmount: 0,
        openingBalance: 0,
        closingBalance: 0,
        audit: {
          openingBalance: 0,
          closingBalance: 0,
          totalIncome: 0,
          totalExpense: 0,
          netMovement: 0,
          dailySummary: []
        },
        dailySummary: []
      }
    }

    const startBoundary = startDate ? new Date(startDate) : undefined
    const endBoundary = endDate ? new Date(endDate) : undefined
    if (endBoundary) {
      endBoundary.setHours(23, 59, 59, 999)
    }

    const ledgerWhere: any = { bank_account_id: bankAccount.id }
    if (startBoundary || endBoundary) {
      ledgerWhere.transaction_date = {}
      if (startBoundary) {
        ledgerWhere.transaction_date.gte = startBoundary
      }
      if (endBoundary) {
        ledgerWhere.transaction_date.lte = endBoundary
      }
    }

    const transactionWhere: any = { ...ledgerWhere }
    if (transactionType && transactionType !== 'all') {
      transactionWhere.type = transactionType
    }

    const [items, rangeAggregate, totalAggregate, beforeStartAggregate, rangeRows] = await Promise.all([
      prisma.financialRecord.findMany({
        where: transactionWhere,
        orderBy: { transaction_date: 'desc' },
        include: {
          handler: { select: { full_name: true } },
          bank_account: { select: { bank_name: true, account_number: true, account_holder: true } }
        }
      }),
      getLedgerAggregate(ledgerWhere),
      getLedgerAggregate({ bank_account_id: bankAccount.id }),
      startBoundary
        ? getLedgerAggregate({
          bank_account_id: bankAccount.id,
          transaction_date: { lt: startBoundary }
        })
        : Promise.resolve({ totalIncome: 0, totalExpense: 0, netMovement: 0 }),
      prisma.financialRecord.findMany({
        where: ledgerWhere,
        orderBy: { transaction_date: 'asc' },
        select: {
          transaction_date: true,
          type: true,
          amount: true
        }
      })
    ])

    const totalIncome = items
      .filter((item: any) => item.type === 'income')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0)
    const totalExpense = items
      .filter((item: any) => item.type === 'expense')
      .reduce((sum: number, item: any) => sum + Number(item.amount), 0)

    const initialBalance = Number(bankAccount.balance || 0) - totalAggregate.netMovement
    const openingBalance = startBoundary
      ? initialBalance + beforeStartAggregate.netMovement
      : initialBalance
    const closingBalance = endBoundary
      ? openingBalance + rangeAggregate.netMovement
      : Number(bankAccount.balance || 0)

    const dailyMap = new Map<string, {
      date: string
      totalIncome: number
      totalExpense: number
      netMovement: number
      transactionCount: number
    }>()

    for (const record of rangeRows as any[]) {
      const dateKey = getJakartaDateKey(record.transaction_date)
      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        totalIncome: 0,
        totalExpense: 0,
        netMovement: 0,
        transactionCount: 0
      }

      const amount = Number(record.amount || 0)
      if (record.type === 'income') {
        existing.totalIncome += amount
      } else {
        existing.totalExpense += amount
      }
      existing.netMovement = existing.totalIncome - existing.totalExpense
      existing.transactionCount += 1
      dailyMap.set(dateKey, existing)
    }

    const dailySummary = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .reduce((rows: Array<any>, day) => {
        const previousClosing = rows.length > 0
          ? rows[rows.length - 1].closingBalance
          : openingBalance
        const dayClosing = previousClosing + day.netMovement

        rows.push({
          ...day,
          openingBalance: previousClosing,
          closingBalance: dayClosing
        })
        return rows
      }, [])

    const sumAmount = items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)

    return serializeData({
      items,
      total: items.length,
      totalIncome,
      totalExpense,
      netMovement: totalIncome - totalExpense,
      sumAmount,
      openingBalance,
      closingBalance,
      audit: {
        openingBalance,
        closingBalance,
        totalIncome: rangeAggregate.totalIncome,
        totalExpense: rangeAggregate.totalExpense,
        netMovement: rangeAggregate.netMovement,
        dailySummary
      },
      dailySummary
    })
  } catch (error: any) {
    return {
      items: [],
      total: 0,
      totalIncome: 0,
      totalExpense: 0,
      netMovement: 0,
      sumAmount: 0,
      openingBalance: 0,
      closingBalance: 0,
      audit: {
        openingBalance: 0,
        closingBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        netMovement: 0,
        dailySummary: []
      },
      dailySummary: []
    }
  }
}

/**
 * Get financial summary (Total Income, Total Expense, Balance)
 */
export async function getFinancialSummary() {
  try {
    await requireActionRole(['admin', 'finance'])

    const income = await prisma.financialRecord.aggregate({
      where: { type: 'income' },
      _sum: { amount: true }
    })

    const expense = await prisma.financialRecord.aggregate({
      where: { type: 'expense' },
      _sum: { amount: true }
    })

    const totalIncome = Number(income._sum.amount || 0)
    const totalExpense = Number(expense._sum.amount || 0)

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Create a new financial record (Manual Income/Expense)
 */
export async function createFinancialRecord(data: {
  type: 'income' | 'expense',
  category: any,
  amount: number,
  description: string,
  bank_account_id?: string,
  reference_id?: string,
  date?: Date
}) {
  try {
    const actor = await requireActionRole(['admin', 'finance'])
    const transactionDate = data.date || new Date()
    const periodLock = await resolveFinancePeriodLock(toJakartaPeriodKey(transactionDate))

    if (periodLock.isLocked) {
      const reasonText = periodLock.reason ? ` Alasan: ${periodLock.reason}.` : ''
      return {
        error: `Periode ${periodLock.period} sedang dikunci.${reasonText} Hubungi admin/finance untuk membuka periode.`
      }
    }

    const record = await prisma.financialRecord.create({
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        bank_account_id: data.bank_account_id,
        reference_id: data.reference_id,
        transaction_date: transactionDate,
        recorded_by: actor.id
      }
    })

    // Update bank balance
    if (data.bank_account_id) {
      if (data.type === 'income') {
        await prisma.bankAccount.update({
          where: { id: data.bank_account_id },
          data: { balance: { increment: data.amount } }
        })
      } else {
        await prisma.bankAccount.update({
          where: { id: data.bank_account_id },
          data: { balance: { decrement: data.amount } }
        })
      }
    }

    const paths = [
      '/finance',
      '/finance/cashflow',
      '/finance/income',
      '/finance/expense',
      '/finance/transactions',
      '/admin/finance',
      '/admin/finance/cashflow',
      '/admin/finance/income',
      '/admin/finance/expense',
      '/admin/finance/transactions'
    ]
    paths.forEach((path) => revalidatePath(path))

    return { success: true, record: serializeData(record) }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Get monthly trend data for charts
 */
export async function getMonthlyTrend(months = 6) {
  try {
    await requireActionRole(['admin', 'finance'])

    const records = await prisma.financialRecord.findMany({
      where: {
        transaction_date: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - months))
        }
      },
      orderBy: { transaction_date: 'asc' }
    })

    // Group by month
    const months_names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const trend: Record<string, { month: string, income: number, expense: number }> = {}

    records.forEach((r: any) => {
      const date = new Date(r.transaction_date)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!trend[key]) {
        trend[key] = { 
          month: `${months_names[date.getMonth()]} ${date.getFullYear()}`, 
          income: 0, 
          expense: 0 
        }
      }

      if (r.type === 'income') {
        trend[key].income += Number(r.amount)
      } else {
        trend[key].expense += Number(r.amount)
      }
    })

    return Object.values(trend)
  } catch (error: any) {
    return []
  }
}
