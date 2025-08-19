import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import type { ReviewLeaveRequest, ApiResponse } from "@/lib/types"
import { calculateLeaveDays } from "@/lib/validations"

// GET /api/leave-requests/[id] - Get specific leave request
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            joiningDate: true,
            leaveBalance: true,
          },
        },
      },
    })

    if (!leaveRequest) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Leave request not found",
        },
        { status: 404 },
      )
    }

    // Calculate leave days for this request
    const leaveDays = calculateLeaveDays(new Date(leaveRequest.startDate), new Date(leaveRequest.endDate))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...leaveRequest,
        leaveDays,
      },
    })
  } catch (error) {
    console.error("Error fetching leave request:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch leave request",
      },
      { status: 500 },
    )
  }
}

// PUT /api/leave-requests/[id] - Approve or reject leave request
export async function PUT(request: NextRequest,context: { params: Promise<{ id: string }> }) {
  try {
   const { id } = await context.params
    const body: ReviewLeaveRequest = await request.json()
    const { status, reviewedBy, comments } = body
    console.log(id,body,"hehehe")

    // Validation
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Status must be either APPROVED or REJECTED",
        },
        { status: 400 },
      )
    }

    if (!reviewedBy) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "reviewedBy field is required",
        },
        { status: 400 },
      )
    }

    // Check if leave request exists and is pending
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    })

    if (!leaveRequest) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Leave request not found",
        },
        { status: 404 },
      )
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Leave request has already been ${leaveRequest.status.toLowerCase()}`,
        },
        { status: 400 },
      )
    }


    // Additional validation for approval
    if (status === "APPROVED") {
      const requestedDays = calculateLeaveDays(new Date(leaveRequest.startDate), new Date(leaveRequest.endDate))

      // Calculate current used leave days (excluding this request)
      const approvedRequests = await prisma.leaveRequest.findMany({
        where: {
          employeeId: leaveRequest.employeeId,
          status: "APPROVED",
          id: { not: id }, // Exclude current request
        },
      })

      const usedLeaveDays = approvedRequests.reduce((total, request) => {
        const days = calculateLeaveDays(new Date(request.startDate), new Date(request.endDate))
        return total + days
      }, 0)

      const availableBalance = leaveRequest.employee.leaveBalance - usedLeaveDays

      if (requestedDays > availableBalance) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Cannot approve: Insufficient leave balance. Available: ${availableBalance} days, Requested: ${requestedDays} days`,
          },
          { status: 400 },
        )
      }

      // Check for overlapping approved requests
      const overlappingRequests = await prisma.leaveRequest.findMany({
        where: {
          employeeId: leaveRequest.employeeId,
          status: "APPROVED",
          id: { not: id },
          OR: [
            {
              AND: [{ startDate: { lte: leaveRequest.endDate } }, { endDate: { gte: leaveRequest.startDate } }],
            },
          ],
        },
      })

      if (overlappingRequests.length > 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Cannot approve: Leave request overlaps with existing approved leave",
            data: {
              overlappingRequests: overlappingRequests.map((req) => ({
                id: req.id,
                startDate: req.startDate,
                endDate: req.endDate,
              })),
            },
          },
          { status: 409 },
        )
      }
    }

    // Update leave request
    const updatedLeaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        comments: comments?.trim() || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    })

    const leaveDays = calculateLeaveDays(new Date(updatedLeaveRequest.startDate), new Date(updatedLeaveRequest.endDate))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...updatedLeaveRequest,
        leaveDays
      },
      message: `Leave request ${status.toLowerCase()} successfully`,
    })
  } catch (error) {
    console.error("Error updating leave request:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to update leave request",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/leave-requests/[id] - Cancel leave request (only if pending)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    })

    if (!leaveRequest) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Leave request not found",
        },
        { status: 404 },
      )
    }

    

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Cannot cancel ${leaveRequest.status.toLowerCase()} leave request`,
        },
        { status: 400 },
      )
    }

    await prisma.leaveRequest.delete({
      where: { id },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Leave request cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling leave request:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to cancel leave request",
      },
      { status: 500 },
    )
  }
}
