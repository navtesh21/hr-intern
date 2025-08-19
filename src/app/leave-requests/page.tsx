"use client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LeaveManagement } from "@/components/leave-management"

export default function LeaveRequestsPage() {
  return (
    <DashboardLayout>
      <LeaveManagement />
    </DashboardLayout>
  )
}
