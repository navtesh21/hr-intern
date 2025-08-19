import { type NextRequest, NextResponse } from "next/server"
import  prisma  from "@/lib/db"
import type { CreateLeaveRequest, ApiResponse } from "@/lib/types"
import { ValidationError, validateLeaveApplication, calculateLeaveDays } from "@/lib/validations"

// GET /api/leave-requests - Get all leave requests or filter by employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const where: any = {}

    if (employeeId) {
      // Verify employee exists
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

      where.employeeId = employeeId
    }

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status
    }

    const skip = (page - 1) * limit

    const [leaveRequests, totalCount] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
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
        orderBy: { appliedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.leaveRequest.count({ where }),
    ])

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        leaveRequests,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch leave requests",
      },
      { status: 500 },
    )
  }
}

// POST /api/leave-requests - Apply for leave
export async function POST(request: NextRequest) {
  try {
    const body: CreateLeaveRequest = await request.json()
    const { employeeId, startDate, endDate, reason } = body
    console.log("Creating leave request:", body)

    // Validation
    if (!employeeId || !startDate || !endDate || !reason) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: employeeId, startDate, endDate, reason",
        },
        { status: 400 },
      )
    }

    if (!reason.trim()) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Reason cannot be empty",
        },
        { status: 400 },
      )
    }

    // Parse dates
    const parsedStartDate = new Date(startDate)
    const parsedEndDate = new Date(endDate)

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid date format",
        },
        { status: 400 },
      )
    }

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        leaveRequests: {
          where: {
            status: "APPROVED",
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

    // Calculate requested leave days
    const requestedDays = calculateLeaveDays(parsedStartDate, parsedEndDate)

    // Calculate current used leave days
    const usedLeaveDays = employee.leaveRequests.reduce((total, request) => {
      const days = calculateLeaveDays(new Date(request.startDate), new Date(request.endDate))
      return total + days
    }, 0)

    const availableBalance = employee.leaveBalance - usedLeaveDays

    // Validate leave application
    validateLeaveApplication(parsedStartDate, parsedEndDate, employee.joiningDate, requestedDays, availableBalance)

    // Check for overlapping leave requests
    const overlappingRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            AND: [{ startDate: { lte: parsedEndDate } }, { endDate: { gte: parsedStartDate } }],
          },
        ],
      },
    })

    if (overlappingRequests.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Leave request overlaps with existing pending or approved leave",
          data: {
            overlappingRequests: overlappingRequests.map((req) => ({
              id: req.id,
              startDate: req.startDate,
              endDate: req.endDate,
              status: req.status,
            })),
          },
        },
        { status: 409 },
      )
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason: reason.trim(),
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

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          leaveRequest,
          requestedDays,
          availableBalance: availableBalance - requestedDays,
        },
        message: "Leave request submitted successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating leave request:", error)

    if (error instanceof ValidationError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to create leave request",
      },
      { status: 500 },
    )
  }
}
