export interface Employee {
  id: string
  name: string
  email: string
  department: string
  joiningDate: Date
  leaveBalance: number
  createdAt: Date
  updatedAt: Date
}

export interface LeaveRequest {
  id: string
  employeeId: string
  startDate: Date
  endDate: Date
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  appliedAt: Date
  reviewedAt?: Date | null
  reviewedBy?: string | null
  comments?: string | null
  employee?: Employee
}

export interface CreateEmployeeRequest {
  name: string
  email: string
  department: string
  joiningDate: string
  leaveBalance?: number
}

export interface CreateLeaveRequest {
  employeeId: string
  startDate: string
  endDate: string
  reason: string
}

export interface ReviewLeaveRequest {
  status: "APPROVED" | "REJECTED"
  reviewedBy: string
  comments?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
