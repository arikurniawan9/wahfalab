'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateTravelOrderNumber } from '@/lib/utils/generateNumber'
import { serializeData } from '@/lib/utils/serialize'

export async function createTravelOrder(data: {
  assignment_id: string
  departure_date: string
  return_date: string
  destination: string
  purpose: string
  transportation_type?: string
  accommodation_type?: string
  daily_allowance?: number
  total_budget?: number
  notes?: string
}) {
  try {
    // Generate document number
    const documentNumber = await generateTravelOrderNumber()

    // Create travel order
    const travelOrder = await prisma.travelOrder.create({
      data: {
        assignment_id: data.assignment_id,
        document_number: documentNumber,
        departure_date: new Date(data.departure_date),
        return_date: new Date(data.return_date),
        destination: data.destination,
        purpose: data.purpose,
        transportation_type: data.transportation_type,
        accommodation_type: data.accommodation_type,
        daily_allowance: data.daily_allowance,
        total_budget: data.total_budget,
        notes: data.notes
      },
      include: {
        assignment: {
          include: {
            field_officer: true,
            job_order: {
              include: {
                quotation: {
                  include: {
                    profile: true,
                    items: {
                      include: {
                        service: {
                          include: {
                            category_ref: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin')
    revalidatePath('/field')
    revalidatePath('/field/assignments')

    return { success: true, travelOrder }
  } catch (error: any) {
    console.error('Error creating travel order:', error)
    return { error: error.message }
  }
}

export async function getTravelOrderById(id: string) {
  try {
    const travelOrder = await prisma.travelOrder.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            field_officer: true,
            job_order: {
              include: {
                quotation: {
                  include: {
                    profile: true,
                    items: {
                      include: {
                        service: {
                          include: {
                            category_ref: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return serializeData(travelOrder)
  } catch (error: any) {
    console.error('Error fetching travel order:', error)
    return null
  }
}

export async function getTravelOrderByAssignmentId(assignmentId: string) {
  try {
    const travelOrder = await prisma.travelOrder.findUnique({
      where: { assignment_id: assignmentId },
      include: {
        assignment: {
          include: {
            field_officer: true,
            job_order: {
              include: {
                quotation: {
                  include: {
                    profile: true,
                    items: {
                      include: {
                        service: {
                          include: {
                            category_ref: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return serializeData(travelOrder)
  } catch (error: any) {
    console.error('Error fetching travel order:', error)
    return null
  }
}

export async function updateTravelOrder(id: string, data: {
  departure_date?: string
  return_date?: string
  destination?: string
  purpose?: string
  transportation_type?: string
  accommodation_type?: string
  daily_allowance?: number
  total_budget?: number
  notes?: string
  pdf_url?: string
}) {
  try {
    const updateData: any = {
      updated_at: new Date()
    }

    if (data.departure_date) updateData.departure_date = new Date(data.departure_date)
    if (data.return_date) updateData.return_date = new Date(data.return_date)
    if (data.destination) updateData.destination = data.destination
    if (data.purpose) updateData.purpose = data.purpose
    if (data.transportation_type) updateData.transportation_type = data.transportation_type
    if (data.accommodation_type) updateData.accommodation_type = data.accommodation_type
    if (data.daily_allowance !== undefined) updateData.daily_allowance = data.daily_allowance
    if (data.total_budget !== undefined) updateData.total_budget = data.total_budget
    if (data.notes) updateData.notes = data.notes
    if (data.pdf_url) updateData.pdf_url = data.pdf_url

    const travelOrder = await prisma.travelOrder.update({
      where: { id },
      data: updateData,
      include: {
        assignment: {
          include: {
            field_officer: true,
            job_order: {
              include: {
                quotation: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    })

    revalidatePath('/admin')
    revalidatePath('/field')
    revalidatePath('/field/assignments')

    return { success: true, travelOrder }
  } catch (error: any) {
    console.error('Error updating travel order:', error)
    return { error: error.message }
  }
}

export async function uploadTravelOrderPdf(travelOrderId: string, file: File) {
  try {
    const supabase = await createClient()
    
    // Upload ke Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `travel-order-${travelOrderId}-${Date.now()}.${fileExt}`
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const { data, error } = await supabase.storage
      .from('travel-orders')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('travel-orders')
      .getPublicUrl(fileName)

    // Update database
    await prisma.travelOrder.update({
      where: { id: travelOrderId },
      data: { pdf_url: publicUrl }
    })

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error('Error uploading PDF:', error)
    return { error: error.message }
  }
}

export async function deleteTravelOrder(id: string) {
  try {
    await prisma.travelOrder.delete({
      where: { id }
    })

    revalidatePath('/admin')
    revalidatePath('/field')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting travel order:', error)
    return { error: error.message }
  }
}

export async function getMyTravelOrders(fieldOfficerId: string) {
  try {
    const travelOrders = await prisma.travelOrder.findMany({
      where: {
        assignment: {
          field_officer_id: fieldOfficerId
        }
      },
      include: {
        assignment: {
          include: {
            field_officer: true,
            job_order: {
              include: {
                quotation: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return travelOrders
  } catch (error: any) {
    console.error('Error fetching travel orders:', error)
    return []
  }
}
