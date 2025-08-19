"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalEmployees: number
  pendingRequests: number
  onLeaveToday: number
  approvedThisMonth: number
}

interface RecentRequest {
  id: number
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  status: string
}

interface DepartmentStatus {
  department: string
  totalEmployees: number
  onLeave: number
  available: number
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingRequests: 0,
    onLeaveToday: 0,
    approvedThisMonth: 0,
  })
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [departmentStatus, setDepartmentStatus] = useState<DepartmentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [employeesRes, leaveRequestsRes, statsRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/leave-requests"),
        fetch("/api/leave-requests/stats"),
      ])

      if (!employeesRes.ok || !leaveRequestsRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const [employeesData, leaveRequestsData, statsData] = await Promise.all([
        employeesRes.json(),
        leaveRequestsRes.json(),
        statsRes.json(),
      ])

      console.log("Fetched employees:", employeesData)
      console.log("Fetched leave requests:", leaveRequestsData)
      console.log("Fetched stats:", statsData)

      // Calculate stats from API data
      const employees = employeesData.data || []
      const requests = leaveRequestsData.data.leaveRequests || []

      const pendingCount = requests.filter((r: any) => r.status === "pending").length
      const today = new Date().toISOString().split("T")[0]
      const onLeaveToday = requests.filter(
        (r: any) => r.status === "approved" && r.startDate <= today && r.endDate >= today,
      ).length

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const approvedThisMonth = requests.filter((r: any) => {
        const approvedDate = new Date(r.approvedDate || r.appliedDate)
        return (
          r.status === "approved" &&
          approvedDate.getMonth() === currentMonth &&
          approvedDate.getFullYear() === currentYear
        )
      }).length

      setStats({
        totalEmployees: employees.length,
        pendingRequests: pendingCount,
        onLeaveToday,
        approvedThisMonth,
      })

      // Get recent requests (last 4)
      const sortedRequests = requests
        .sort((a: any, b: any) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
        .slice(0, 4)
      setRecentRequests(sortedRequests)

      // Calculate department status
      const deptMap = new Map<string, { total: number; onLeave: number }>()

      employees.forEach((emp: any) => {
        const dept = emp.department
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { total: 0, onLeave: 0 })
        }
        const deptData = deptMap.get(dept)!
        deptData.total++

        // Check if employee is currently on leave
        const isOnLeave = requests.some(
          (r: any) => r.employeeId === emp.id && r.status === "approved" && r.startDate <= today && r.endDate >= today,
        )
        if (isOnLeave) {
          deptData.onLeave++
        }
      })

      const deptStatus = Array.from(deptMap.entries()).map(([dept, data]) => ({
        department: dept,
        totalEmployees: data.total,
        onLeave: data.onLeave,
        available: data.total - data.onLeave,
      }))

      setDepartmentStatus(deptStatus)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (startDate === endDate) {
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}-${end.toLocaleDateString("en-US", { day: "numeric" })}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your team.</p>
        </div>
        <Link href="/apply-leave">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            New Leave Request
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeaveToday}</div>
            <p className="text-xs text-muted-foreground">Currently away</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Approved requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{request.employeeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.leaveType} • {formatDateRange(request.startDate, request.endDate)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.status === "approved"
                        ? "default"
                        : request.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className={
                      request.status === "approved"
                        ? "bg-secondary text-secondary-foreground"
                        : request.status === "pending"
                          ? "bg-accent/20 text-accent-foreground"
                          : ""
                    }
                  >
                    {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                    {request.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {request.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                    {request.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent leave requests</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentStatus.length > 0 ? (
              departmentStatus.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{dept.department}</p>
                    <p className="text-sm text-muted-foreground">{dept.totalEmployees} total employees</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{dept.available} available</p>
                    {dept.onLeave > 0 && <p className="text-sm text-muted-foreground">{dept.onLeave} on leave</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No department data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
