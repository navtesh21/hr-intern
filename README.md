# Leave Management System for intern

HR teams can manage employee data, leave requests, approvals, and track leave balances.

## 🚀 Live Demo

**Live URL**: [https://hr-intern.vercel.app/](https://hr-intern.vercel.app/)

## 🛠️ Setup Steps

### Prerequisites
- Node.js 18+ installed
- Git installed

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leave-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your database connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/leave_management"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Assumptions

- Each employee gets 20 annual leave days by default
- Leave requests are counted in full days (no half-day support)
- Employees can only apply for future dates
- Weekend days are counted as leave days
- Uses Prisma ORM with PostgreSQL database

## 🔧 API Endpoints

### 1. GET /api/employees
**Description:** Get all employees
**Method:** GET
**Query Parameters:** None

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm123abc",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "department": "Engineering",
      "joiningDate": "2024-01-15T00:00:00.000Z",
      "annualLeaveBalance": 25,
      "sickLeaveBalance": 10,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "cm456def",
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "department": "Marketing",
      "joiningDate": "2024-02-01T00:00:00.000Z",
      "annualLeaveBalance": 25,
      "sickLeaveBalance": 10,
      "createdAt": "2024-02-01T09:15:00.000Z",
      "updatedAt": "2024-02-01T09:15:00.000Z"
    }
  ],
  "count": 2
}
```

## 🏗️ System Architecture


┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Employee UI   │    │ - REST APIs     │    │ - employees     │
│ - HR Dashboard  │    │ - Validation    │    │ - leave_requests│
│ - Leave Forms   │    │ - Business Logic│    │ - leave_balance │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema (Prisma)

**Employee Model**
```prisma
model Employee {
  id          String   @id @default(cuid())
  name        String
  email       String   @unique
  department  String
  joiningDate DateTime
  leaveBalance Int     @default(20)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  leaveRequests LeaveRequest[]
}
```

**LeaveRequest Model**
```prisma
model LeaveRequest {
  id          String      @id @default(cuid())
  employeeId  String
  startDate   DateTime
  endDate     DateTime
  reason      String
  status      LeaveStatus @default(PENDING)
  appliedAt   DateTime    @default(now())
  reviewedAt  DateTime?
  reviewedBy  String?
  comments    String?
  
  employee    Employee    @relation(fields: [employeeId], references: [id])
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## ✅ Edge Cases Handled

- **Pre-joining leave application**: Prevents leave requests before employee joining date
- **Insufficient balance**: Blocks requests exceeding available leave days
- **Overlapping requests**: Detects and prevents conflicting leave periods
- **Employee not found**: Validates employee existence before processing
- **Invalid date ranges**: Ensures end date is after start date
- **Past date applications**: Prevents backdated leave requests
- **Duplicate email**: Prevents adding employees with existing email addresses


### Missing Features (To Be Added)
- **Leave review tracking**: Database field exists (`reviewedBy`) but approval/rejection tracking needs implementation
- **Leave history**: Complete audit trail for all leave actions
- **Half-day leave support**: Currently only supports full-day leaves
- **Holiday calendar**: Integration with company holiday calendar
- **Reporting**: Analytics and leave reports for HR

### Technical Improvements
- **Documentation**: API documentation with Swagger

## 📈 Scaling Strategy

### Current Architecture (50 employees)
- **Deployment**: Vercel (Frontend + Backend combined)
- **Database**: Managed PostgreSQL
- **Suitable for**: Up to 100 concurrent users

### Scaling to 500+ employees

**Challenge**: Vercel becomes expensive at scale and has limitations for high-traffic applications

**Migration Strategy**: Separate frontend and backend deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (AWS S3 +     │◄──►│   (AWS ECS +    │◄──►│   (AWS RDS +    │
│   CloudFront)   │    │   Fargate)      │    │   Connection    │
│                 │    │                 │    │   Pooling)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Scaling Implementation

1. **Database Optimization**
   - **Connection pooling**: Use PgBouncer to manage database connections efficiently
   - **Read replicas**: Separate read queries (reports, dashboards) from write operations
   - **Database indexing**: Index on `employeeId`, `startDate`, `status` for faster queries

2. **Backend Scaling**
   - **AWS ECS with Fargate**: Containerized deployment with pay-as-you-go pricing
   - **Auto Scaling Groups (ASG)**: Automatic horizontal scaling based on CPU/memory metrics
   - **Application Load Balancer**: Distribute traffic across multiple backend instances
   - **Early stage**: Start with Fargate for simplicity and cost-effectiveness

3. **Frontend Optimization**
   - **AWS S3**: Static site hosting for the Next.js frontend
   - **CloudFront CDN**: Global content delivery for faster load times
   - **Caching**: Implement Redis for session management and API response caching

4. **Cost Comparison**
   - **Current (Vercel)**: ~$20/month → $300+/month at scale
   - **AWS Alternative**: ~$80-150/month for same workload with better control and scalability

## 🛡️ Error Handling

Common error responses:
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Employee or leave request not found
- `409 Conflict`: Overlapping leave requests or insufficient balance
- `422 Unprocessable Entity`: Business logic violations
- `500 Internal Server Error`: Database or server issues

## 📱 Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel
- **Styling**: Tailwind CSS



