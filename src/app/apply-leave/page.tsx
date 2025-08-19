"use client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { LeaveApplicationForm } from "@/components/leave-application-form"

export default function ApplyLeavePage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Apply for Leave</h1>
          <p className="text-muted-foreground">Submit a new leave request for approval.</p>
        </div>
        <LeaveApplicationForm />
      </div>
    </DashboardLayout>
  )
}
