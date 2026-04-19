'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { serializeData } from '@/lib/utils/serialize'
import { auth } from '@/lib/auth'

/**
 * Get all active bank accounts
 */
export async function getBankAccounts() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { is_active: true },
      orderBy: { bank_name: 'asc' }
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
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    if (data.id) {
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

    revalidatePath('/finance')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Get all financial records with pagination and filtering
 */
export async function getFinancialRecords(page = 1, limit = 10, type?: 'income' | 'expense', category?: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    const skip = (page - 1) * limit
    const where: any = {}
    if (type) where.type = type
    if (category && category !== 'all') where.category = category

    const [items, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transaction_date: 'desc' },
        include: { handler: { select: { full_name: true } } }
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

/**
 * Get financial summary (Total Income, Total Expense, Balance)
 */
export async function getFinancialSummary() {
  try {
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
  date?: Date
}) {
  try {
    const session = await auth()
    if (!session?.user) return { error: 'Unauthorized' }

    const record = await prisma.financialRecord.create({
      data: {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        bank_account_id: data.bank_account_id,
        transaction_date: data.date || new Date(),
        recorded_by: (session.user as any).id
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

    revalidatePath('/finance')
    revalidatePath('/finance/cashflow')
    revalidatePath('/finance/income')
    revalidatePath('/finance/expense')
    revalidatePath('/finance/transactions')

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
