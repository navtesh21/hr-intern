"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Employee {
  id: number
  name: string
  email: string
  department: string
  joiningDate: string
  leaveBalance: number
}

const leaveTypes = [
  { value: "vacation", label: "Vacation", maxDays: 20 },
  { value: "sick", label: "Sick Leave", maxDays: 10 },
  { value: "personal", label: "Personal Leave", maxDays: 5 },
  { value: "maternity", label: "Maternity Leave", maxDays: 90 },
  { value: "paternity", label: "Paternity Leave", maxDays: 15 },
  { value: "emergency", label: "Emergency Leave", maxDays: 3 },
]

interface FormData {
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
}

interface ValidationError {
  field: string
  message: string
}

export function LeaveApplicationForm() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    employeeId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/employees")
      if (!response.ok) {
        throw new Error("Failed to fetch employees")
      }
      const data = await response.json()
      setEmployees(data.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees")
      console.error("Error fetching employees:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const selectedEmployee = employees.find((emp) => emp.id.toString() === formData.employeeId)
  const selectedLeaveType = leaveTypes.find((type) => type.value === formData.leaveType)

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const validateForm = (): ValidationError[] => {
    const newErrors: ValidationError[] = []

    if (!formData.employeeId) {
      newErrors.push({ field: "employeeId", message: "Please select an employee" })
    }
    if (!formData.leaveType) {
      newErrors.push({ field: "leaveType", message: "Please select a leave type" })
    }
    if (!formData.startDate) {
      newErrors.push({ field: "startDate", message: "Please select a start date" })
    }
    if (!formData.endDate) {
      newErrors.push({ field: "endDate", message: "Please select an end date" })
    }
    if (!formData.reason.trim()) {
      newErrors.push({ field: "reason", message: "Please provide a reason for leave" })
    }

    if (formData.startDate && formData.endDate && selectedEmployee) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      const joiningDate = new Date(selectedEmployee.joiningDate)
      const today = new Date()

      if (endDate < startDate) {
        newErrors.push({ field: "endDate", message: "End date cannot be before start date" })
      }

      if (startDate < joiningDate) {
        newErrors.push({
          field: "startDate",
          message: `Cannot apply for leave before joining date (${joiningDate.toLocaleDateString()})`,
        })
      }

      if (startDate < today && startDate.toDateString() !== today.toDateString()) {
        newErrors.push({ field: "startDate", message: "Cannot apply for leave in the past" })
      }

      const requestedDays = calculateDays(formData.startDate, formData.endDate)

      if (requestedDays > selectedEmployee.leaveBalance) {
        newErrors.push({
          field: "general",
          message: `Insufficient leave balance. Requested: ${requestedDays} days, Available: ${selectedEmployee.leaveBalance} days`,
        })
      }

      if (selectedLeaveType && requestedDays > selectedLeaveType.maxDays) {
        newErrors.push({
          field: "general",
          message: `${selectedLeaveType.label} cannot exceed ${selectedLeaveType.maxDays} days. Requested: ${requestedDays} days`,
        })
      }

      const hasOverlappingLeave = false
      if (hasOverlappingLeave) {
        newErrors.push({
          field: "general",
          message: "You have overlapping leave requests for the selected dates",
        })
      }
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId:selectedEmployee?.id!,
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
          days: calculateDays(formData.startDate, formData.endDate),
        }),
      })
      console.log("Response:", response)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit leave request")
      }

      setSubmitSuccess(true)

      setTimeout(() => {
        setFormData({
          employeeId: "",
          leaveType: "",
          startDate: "",
          endDate: "",
          reason: "",
        })
        setSubmitSuccess(false)
        router.push("/leave-requests")
      }, 2000)
    } catch (error) {
      setErrors([
        {
          field: "general",
          message: error instanceof Error ? error.message : "Failed to submit leave request. Please try again.",
        },
      ])
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestedDays = calculateDays(formData.startDate, formData.endDate)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employees...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Application Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {submitSuccess && (
          <Alert className="mb-6 border-secondary bg-secondary/10">
            <CheckCircle className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-secondary">
              Leave request submitted successfully! Redirecting to leave requests page...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    <div className="flex flex-col">
                      <span>{employee.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {employee.department} • {employee.leaveBalance} days available
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.find((error) => error.field === "employeeId") && (
              <p className="text-sm text-destructive">
                {errors.find((error) => error.field === "employeeId")?.message}
              </p>
            )}
          </div>

          {selectedEmployee && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Department:</span> {selectedEmployee.department}
                  </div>
                  <div>
                    <span className="font-medium">Available Balance:</span> {selectedEmployee.leaveBalance} days
                  </div>
                  <div>
                    <span className="font-medium">Joining Date:</span>{" "}
                    {new Date(selectedEmployee.joiningDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedEmployee.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">Max: {type.maxDays} days</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.find((error) => error.field === "leaveType") && (
              <p className="text-sm text-destructive">{errors.find((error) => error.field === "leaveType")?.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
              {errors.find((error) => error.field === "startDate") && (
                <p className="text-sm text-destructive">
                  {errors.find((error) => error.field === "startDate")?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || new Date().toISOString().split("T")[0]}
              />
              {errors.find((error) => error.field === "endDate") && (
                <p className="text-sm text-destructive">{errors.find((error) => error.field === "endDate")?.message}</p>
              )}
            </div>
          </div>

          {requestedDays > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Days Requested:</span>
                  <span className="text-lg font-bold text-primary">
                    {requestedDays} day{requestedDays !== 1 ? "s" : ""}
                  </span>
                </div>
                {selectedEmployee && (
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>Remaining Balance After:</span>
                    <span>{selectedEmployee.leaveBalance - requestedDays} days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a detailed reason for your leave request..."
              rows={4}
            />
            {errors.find((error) => error.field === "reason") && (
              <p className="text-sm text-destructive">{errors.find((error) => error.field === "reason")?.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting || submitSuccess} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
