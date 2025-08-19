"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Eye, Check, X, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Employee {
  id: string
  name: string
  email: string
  department: string
}

interface LeaveRequest {
  id: string
  employeeId: string
  employee: Employee
  leaveType?: string
  startDate: string
  endDate: string
  days?: number
  reason: string
  status: string
  appliedAt: string
  reviewedBy: string | null
  reviewedAt: string | null
  comments: string | null
}

// Toast component


export function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const departments = ["all", "Engineering", "Marketing", "Sales", "HR", "Finance"]
  const leaveTypes = ["all", "Vacation", "Sick Leave", "Personal", "Maternity", "Paternity"]

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/leave-requests")
      if (!response.ok) {
        throw new Error("Failed to fetch leave requests")
      }
      const data = await response.json()
      setLeaveRequests(data.data.leaveRequests || [])
      console.log("Fetched leave requests:", data.data.leaveRequests)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave requests")
      console.error("Error fetching leave requests:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "APPROVED" ,reviewedBy: "admin", comments: "Approved by Admin"}),
      })
      console.log("Approving leave request:",response)

      if (!response.ok) {
        throw new Error("Failed to approve leave request")
      }

      const data = await response.json()
      setLeaveRequests((prev) =>
        prev.map((request) => (request.id === requestId ? { ...request, status: "APPROVED", reviewedAt: new Date().toISOString() } : request)),
      )
      toast.success("Leave request approved successfully!")
    } catch (err) {
      console.error("Error approving leave request:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to approve leave request"
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject leave request")
      }

      const data = await response.json()
      setLeaveRequests((prev) =>
        prev.map((request) => (request.id === requestId ? { ...request, status: "REJECTED", reviewedAt: new Date().toISOString() } : request)),
      )
      toast.success("Leave request rejected successfully!")
    } catch (err) {
      console.error("Error rejecting leave request:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to reject leave request"
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Calculate days between start and end date
  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
    return diffDays
  }

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      request?.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request?.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request?.leaveType || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || request.employee?.department === departmentFilter
    const matchesLeaveType = leaveTypeFilter === "all" || (request.leaveType || "") === leaveTypeFilter
    
    // Normalize status for comparison
    const normalizedStatus = request.status.toLowerCase()
    const matchesTab = activeTab === "all" || normalizedStatus === activeTab

    return matchesSearch && matchesDepartment && matchesLeaveType && matchesTab
  })

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "approved":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            {getStatusIcon(status)} Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
            {getStatusIcon(status)} Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            {getStatusIcon(status)} Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingCount = leaveRequests.filter((r) => r.status.toLowerCase() === "pending").length
  const approvedCount = leaveRequests.filter((r) => r.status.toLowerCase() === "approved").length
  const rejectedCount = leaveRequests.filter((r) => r.status.toLowerCase() === "rejected").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading leave requests...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchLeaveRequests}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-gray-600">Review and manage employee leave requests.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Leave Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({leaveRequests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-gray-900">Employee</th>
                      <th className="text-left p-4 font-medium text-gray-900">Leave Type</th>
                      <th className="text-left p-4 font-medium text-gray-900">Duration</th>
                      <th className="text-left p-4 font-medium text-gray-900">Days</th>
                      <th className="text-left p-4 font-medium text-gray-900">Applied Date</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-right p-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => {
                      const calculatedDays = calculateDays(request.startDate, request.endDate)
                      return (
                        <tr key={request.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{request.employee?.name || "N/A"}</div>
                              <div className="text-sm text-gray-500">{request.employee?.department || "N/A"}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{request.leaveType || "Not specified"}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <div>{new Date(request.startDate).toLocaleDateString()}</div>
                              {request.startDate !== request.endDate && (
                                <div className="text-gray-500">
                                  to {new Date(request.endDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {calculatedDays} day{calculatedDays !== 1 ? "s" : ""}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {request.appliedAt ? new Date(request.appliedAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="p-4">{getStatusBadge(request.status)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status.toLowerCase() === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReject(request.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No leave requests found matching your criteria.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Leave Request Details Dialog */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Leave Request Details</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Employee</label>
                    <p className="mt-1">{selectedRequest.employee?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Department</label>
                    <p className="mt-1">{selectedRequest.employee?.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Leave Type</label>
                    <p className="mt-1">{selectedRequest.leaveType || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="mt-1">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="mt-1">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="mt-1">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Applied Date</label>
                    <p className="mt-1">{selectedRequest.appliedAt ? new Date(selectedRequest.appliedAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Reason</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedRequest.reason || "No reason provided"}</p>
                </div>

                {selectedRequest.status.toLowerCase() === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => {
                        handleApprove(selectedRequest.id)
                        setSelectedRequest(null)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        handleReject(selectedRequest.id)
                        setSelectedRequest(null)
                      }}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}