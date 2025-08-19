export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateDateRange(startDate: Date, endDate: Date): void {
  if (startDate >= endDate) {
    throw new ValidationError("End date must be after start date")
  }
}

export function validateJoiningDate(joiningDate: Date): void {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (joiningDate > today) {
    throw new ValidationError("Joining date cannot be in the future")
  }
}

export function validateLeaveApplication(
  startDate: Date,
  endDate: Date,
  joiningDate: Date,
  requestedDays: number,
  availableBalance: number,
): void {
  // Check if leave start date is after joining date
  if (startDate < joiningDate) {
    throw new ValidationError("Cannot apply for leave before joining date")
  }

  // Check if start date is not in the past (except today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (startDate < today) {
    throw new ValidationError("Cannot apply for leave in the past")
  }

  // Validate date range
  validateDateRange(startDate, endDate)

  // Check if requested days exceed available balance
  if (requestedDays > availableBalance) {
    throw new ValidationError(
      `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${requestedDays} days`,
    )
  }
}

export function calculateLeaveDays(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 // +1 to include both start and end dates
}
