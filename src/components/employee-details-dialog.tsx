"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Mail, Building, User, Clock } from "lucide-react"

interface Employee {
  id: number
  name: string
  email: string
  department: string
  position: string
  joiningDate: string
  leaveBalance: number
  status: string
}

interface EmployeeDetailsDialogProps {
  employee: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeDetailsDialog({ employee, open, onOpenChange }: EmployeeDetailsDialogProps) {
  const joiningDate = new Date(employee.joiningDate)
  const yearsOfService = Math.floor((Date.now() - joiningDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            {employee.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.position}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {joiningDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {yearsOfService} year{yearsOfService !== 1 ? "s" : ""} of service
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={employee.status === "active" ? "default" : "secondary"}
                    className={
                      employee.status === "active"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-accent/20 text-accent-foreground"
                    }
                  >
                    {employee.status === "active" ? "Active" : "On Leave"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">{employee.leaveBalance}</div>
                  <div className="text-sm text-muted-foreground">Days remaining</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{20 - employee.leaveBalance}</div>
                  <div className="text-sm text-muted-foreground">Days used</div>
                </div>
              </div>
              <div className="mt-4 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(employee.leaveBalance / 20) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          
        </div>
      </DialogContent>
    </Dialog>
  )
}
