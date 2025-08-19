import { type NextRequest, NextResponse } from "next/server"
import prisma  from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

// GET /api/leave-requests/stats - Get leave statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const year = Number.parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59)

    if (employeeId) {
      // Employee-specific stats
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      })

      if (!employee) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Employee not found",
          },
          { status: 404 },
        )
      }

      const [pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: "PENDING",
            startDate: { gte: startOfYear, lte: endOfYear },
          },
        }),
        prisma.leaveRequest.findMany({
          where: {
            employeeId,
            status: "APPROVED",
            startDate: { gte: startOfYear, lte: endOfYear },
          },
        }),
        prisma.leaveRequest.count({
          where: {
            employeeId,
            status: "REJECTED",
            startDate: { gte: startOfYear, lte: endOfYear },
          },
        }),
      ])

      const usedLeaveDays = approvedRequests.reduce((total, request) => {
        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1
        return total + days
      }, 0)

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          employeeId,
          employeeName: employee.name,
          year,
          totalLeaveBalance: employee.leaveBalance,
          usedLeaveDays,
          remainingBalance: Math.max(0, employee.leaveBalance - usedLeaveDays),
          pendingRequests,
          approvedRequests: approvedRequests.length,
          rejectedRequests,
        },
      })
    } else {
      // Overall company stats
      const [totalEmployees, pendingRequests, approvedRequests, rejectedRequests, departmentStats] = await Promise.all([
        prisma.employee.count(),
        prisma.leaveRequest.count({
          where: {
            status: "PENDING",
            startDate: { gte: startOfYear, lte: endOfYear },
          },
        }),
        prisma.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            startDate: { gte: startOfYear, lte: endOfYear },
          },
          include: {
            employee: {
              select: { department: true },
            },
          },
        }),
        prisma.leaveRequest.count({
          where: {
            status: "REJECTED",
            startDate: { gte: startOfYear, lte: endOfYear },
          },
        }),
        prisma.employee.groupBy({
          by: ["department"],
          _count: {
            id: true,
          },
        }),
      ])

      const totalApprovedDays = approvedRequests.reduce((total, request) => {
        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1
        return total + days
      }, 0)

      const departmentLeaveStats = departmentStats.map((dept) => {
        const deptApprovedRequests = approvedRequests.filter((req) => req.employee.department === dept.department)
        const deptApprovedDays = deptApprovedRequests.reduce((total, request) => {
          const startDate = new Date(request.startDate)
          const endDate = new Date(request.endDate)
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1
          return total + days
        }, 0)

        return {
          department: dept.department,
          employeeCount: dept._count.id,
          approvedLeaveRequests: deptApprovedRequests.length,
          totalLeaveDays: deptApprovedDays,
          averageLeaveDaysPerEmployee: dept._count.id > 0 ? Math.round(deptApprovedDays / dept._count.id) : 0,
        }
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          year,
          totalEmployees,
          pendingRequests,
          approvedRequests: approvedRequests.length,
          rejectedRequests,
          totalApprovedLeaveDays: totalApprovedDays,
          averageLeaveDaysPerEmployee: totalEmployees > 0 ? Math.round(totalApprovedDays / totalEmployees) : 0,
          departmentStats: departmentLeaveStats,
        },
      })
    }
  } catch (error) {
    console.error("Error fetching leave statistics:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch leave statistics",
      },
      { status: 500 },
    )
  }
}
