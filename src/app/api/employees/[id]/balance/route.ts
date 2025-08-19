import { type NextRequest, NextResponse } from "next/server"
import prisma  from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

// GET /api/employees/[id]/balance - Get employee leave balance
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        leaveBalance: true,
        leaveRequests: {
          where: {
            status: "APPROVED",
          },
          select: {
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
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

    // Calculate used leave days from approved requests
    const usedLeaveDays = employee.leaveRequests.reduce((total, request) => {
      const startDate = new Date(request.startDate)
      const endDate = new Date(request.endDate)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1
      return total + days
    }, 0)

    const availableBalance = Math.max(0, employee.leaveBalance - usedLeaveDays)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        totalLeaveBalance: employee.leaveBalance,
        usedLeaveDays,
        availableBalance,
        approvedLeaveRequests: employee.leaveRequests.length,
      },
    })
  } catch (error) {
    console.error("Error fetching employee balance:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employee balance",
      },
      { status: 500 },
    )
  }
}

// PUT /api/employees/[id]/balance - Update employee leave balance
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { leaveBalance, reason } = body

    if (typeof leaveBalance !== "number" || leaveBalance < 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Leave balance must be a non-negative number",
        },
        { status: 400 },
      )
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id },
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

    // Update leave balance
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { leaveBalance },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        employeeId: updatedEmployee.id,
        employeeName: updatedEmployee.name,
        previousBalance: employee.leaveBalance,
        newBalance: updatedEmployee.leaveBalance,
        reason: reason || "Balance updated by HR",
      },
      message: "Leave balance updated successfully",
    })
  } catch (error) {
    console.error("Error updating employee balance:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to update employee balance",
      },
      { status: 500 },
    )
  }
}
