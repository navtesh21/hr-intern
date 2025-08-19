import { type NextRequest, NextResponse } from "next/server"
import  prisma  from "@/lib/db"
import type { CreateEmployeeRequest, ApiResponse } from "@/lib/types"
import { ValidationError, validateEmail, validateJoiningDate } from "@/lib/validations"

// GET /api/employees - Get all employees
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    })

    console.log("Fetched employees:", employees)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: employees,
    })
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch employees",
      },
      { status: 500 },
    )
  }
}

// POST /api/employees - Add a new employee
export async function POST(request: NextRequest) {
  try {
    const body: CreateEmployeeRequest = await request.json()
    const { name, email, department, joiningDate, leaveBalance = 20 } = body

    // Validation
    if (!name || !email || !department || !joiningDate) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Missing required fields: name, email, department, joiningDate",
        },
        { status: 400 },
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      )
    }

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

    if (leaveBalance < 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Leave balance cannot be negative",
        },
        { status: 400 },
      )
    }

    // Check if employee with email already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    })

    if (existingEmployee) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Employee with this email already exists",
        },
        { status: 409 },
      )
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        department,
        joiningDate: parsedJoiningDate,
        leaveBalance,
      },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: employee,
        message: "Employee created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating employee:", error)

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
        error: "Failed to create employee",
      },
      { status: 500 },
    )
  }
}
