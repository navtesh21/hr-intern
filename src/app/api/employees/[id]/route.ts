import { type NextRequest, NextResponse } from "next/server"
import  prisma  from "@/lib/db"
import type { ApiResponse } from "@/lib/types"
import { ValidationError, validateEmail, validateJoiningDate } from "@/lib/validations"

// GET /api/employees/[id] - Get specific employee
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        leaveRequests: {
          orderBy: { appliedAt: "desc" },
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

    return NextResponse.json<ApiResponse>({
      success: true,
      data: employee,
    })
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employee",
      },
      { status: 500 },
    )
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, email, department, joiningDate, leaveBalance } = body

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!existingEmployee) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee not found",
        },
        { status: 404 },
      )
    }

    // Validation
    const updateData: any = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Name cannot be empty",
          },
          { status: 400 },
        )
      }
      updateData.name = name
    }

    if (email !== undefined) {
      if (!validateEmail(email)) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Invalid email format",
          },
          { status: 400 },
        )
      }

      // Check if email is already taken by another employee
      const emailExists = await prisma.employee.findFirst({
        where: {
          email,
          id: { not: id },
        },
      })

      if (emailExists) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Email already exists for another employee",
          },
          { status: 409 },
        )
      }

      updateData.email = email
    }

    if (department !== undefined) {
      if (!department.trim()) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Department cannot be empty",
          },
          { status: 400 },
        )
      }
      updateData.department = department
    }

    if (joiningDate !== undefined) {
      const parsedJoiningDate = new Date(joiningDate)
      if (isNaN(parsedJoiningDate.getTime())) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Invalid joining date format",
          },
          { status: 400 },
        )
      }

      validateJoiningDate(parsedJoiningDate)
      updateData.joiningDate = parsedJoiningDate
    }

    if (leaveBalance !== undefined) {
      if (leaveBalance < 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Leave balance cannot be negative",
          },
          { status: 400 },
        )
      }
      updateData.leaveBalance = leaveBalance
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedEmployee,
      message: "Employee updated successfully",
    })
  } catch (error) {
    console.error("Error updating employee:", error)

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
        error: "Failed to update employee",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

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

    // Delete employee (cascade will handle leave requests)
    await prisma.employee.delete({
      where: { id },
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Employee deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to delete employee",
      },
      { status: 500 },
    )
  }
}
