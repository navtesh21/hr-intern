"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddEmployeeFormProps {
  onSubmit: (employee: any) => void
}

export function AddEmployeeForm({ onSubmit }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    joiningDate: "",
  })

  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.department && formData.position && formData.joiningDate) {
      onSubmit(formData)
      setFormData({
        name: "",
        email: "",
        department: "",
        position: "",
        joiningDate: "",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter employee name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          placeholder="Enter job position"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="joiningDate">Joining Date</Label>
        <Input
          id="joiningDate"
          type="date"
          value={formData.joiningDate}
          onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Add Employee
      </Button>
    </form>
  )
}
