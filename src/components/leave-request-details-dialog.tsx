"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Mail, User, Clock, Check, X, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface LeaveRequest {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  department: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  appliedDate: string
  approvedBy: string | null
  approvedDate: string | null
}

interface LeaveRequestDetailsDialogProps {
  request: LeaveRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (requestId: number) => void
  onReject: (requestId: number) => void
}

export function LeaveRequestDetailsDialog({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: LeaveRequestDetailsDialogProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-accent" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-secondary" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
            Pending Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-secondary text-secondary-foreground">
            Approved
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleApprove = () => {
    onApprove(request.id)
    onOpenChange(false)
  }

  const handleReject = () => {
    onReject(request.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {request.employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            Leave Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 ">
              <div className="grid grid-cols-2 gap-4 ">
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div className="text-sm text-muted-foreground">{request.employee.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Department</div>
                  <div className="text-sm text-muted-foreground">{request.employee.department}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{request.employee.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Leave Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Leave Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Leave Type</div>
                  <Badge variant="outline" className="mt-1">
                    {request.leaveType}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {request.days} day{request.days !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Start Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(request.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">End Date</div>
                  <div className="text-sm text-muted-foreground">{new Date(request.endDate).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Reason</div>
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">{request.reason}</div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon(request.status)}
                Request Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Status</span>
                {getStatusBadge(request.status)}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Applied on</span>
                  <span>{new Date(request.appliedDate).toLocaleDateString()}</span>
                </div>

                {request.approvedDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {request.status === "approved" ? "Approved" : "Rejected"} on
                    </span>
                    <span>{new Date(request.approvedDate).toLocaleDateString()}</span>
                  </div>
                )}

                {request.approvedBy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {request.status === "approved" ? "Approved" : "Rejected"} by
                    </span>
                    <span>{request.approvedBy}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {request.status === "pending" && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleApprove} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Approve Request
              </Button>
              <Button variant="destructive" onClick={handleReject} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Reject Request
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
