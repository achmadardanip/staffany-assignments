# Technical Interview Presentation Guide
## StaffAny Scheduler Application

---

## Table of Contents
1. [Application Overview](#1-application-overview)
2. [Evaluation Criteria](#2-evaluation-criteria)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Codebase Walkthrough Guide](#5-codebase-walkthrough-guide)
6. [Test Scenarios & Sample Data](#6-test-scenarios--sample-data)

---

## 1. Application Overview

### What is this Application?

**StaffAny Scheduler** is a web-based employee shift management system that allows managers to create, edit, and publish weekly work schedules for their team members.

### Core Purpose

The application solves the problem of **manual shift scheduling** by providing:
- A centralized digital platform for shift management
- Week-based schedule organization (Monday to Sunday)
- Conflict detection to prevent double-booking
- Publishing workflow to finalize schedules

### Target Audience

- **Primary Users**: HR managers, team leads, shift supervisors
- **Use Cases**: 
  - Restaurants managing server shifts
  - Retail stores scheduling floor staff
  - Healthcare facilities organizing nurse rotations
  - Any business with hourly workers requiring shift schedules

### Key Functionalities

1. **Shift Management**
   - Create new shifts with employee name, date, start time, and end time
   - Edit existing shifts (only if not published)
   - Delete shifts (only if not published)
   - Support for overnight shifts (e.g., 23:00 to 02:00)

2. **Week-based Organization**
   - View schedules by week (Monday-Sunday format)
   - Navigate between weeks using previous/next buttons or calendar picker
   - URL-based week selection for easy sharing and bookmarking

3. **Clash Detection**
   - Automatically prevents overlapping shifts for the same employee
   - Shows detailed conflict information
   - Option to override and ignore clashes if needed

4. **Publishing System**
   - Publish entire weeks to finalize schedules
   - Published weeks become read-only (no edits allowed)
   - Clear visual indication of published status

---

## 2. Evaluation Criteria

### Technical Metrics

#### 2.1 Code Quality
- **Maintainability**: Is the code easy to understand and modify?
  - Clear naming conventions
  - Proper separation of concerns
  - Component-based architecture
- **Scalability**: Can the system handle growth?
  - Database indexing strategies
  - Efficient queries with proper filtering
  - Stateless API design
- **Testing**: How well is the code tested?
  - Unit tests for business logic
  - Integration tests for API endpoints
  - UI component tests

#### 2.2 Architecture Quality
- **Modularity**: Are components loosely coupled?
  - Clear boundaries between layers (UI, business logic, data)
  - Reusable components
- **Data Model**: Is the database schema well-designed?
  - Proper normalization
  - Efficient relationships
  - Data integrity constraints
- **API Design**: Are endpoints RESTful and intuitive?
  - Consistent response format
  - Proper HTTP methods and status codes
  - Clear error messages

#### 2.3 Performance
- **Response Time**: How fast do API calls return?
  - Target: < 200ms for simple queries
  - Database query optimization
- **Database Efficiency**: Are queries optimized?
  - Using indexes on frequently queried fields
  - Avoiding N+1 query problems
  - Efficient use of joins
- **Frontend Performance**: How smooth is the UI?
  - Fast initial page load
  - Minimal re-renders
  - Responsive interactions

#### 2.4 Security
- **Data Validation**: Are inputs properly validated?
  - Server-side validation for all inputs
  - SQL injection prevention through ORM
  - XSS protection
- **Error Handling**: Are errors handled gracefully?
  - No sensitive data in error messages
  - Proper error logging
  - User-friendly error messages

### Business Metrics

#### 2.5 User Experience
- **Usability**: Is the interface intuitive?
  - Clear navigation
  - Helpful error messages
  - Visual feedback for actions
- **Functionality**: Does it solve the business problem?
  - All required features work correctly
  - Edge cases are handled
  - Workflows are logical

#### 2.6 Reliability
- **Data Consistency**: Is data always in a valid state?
  - Transaction support for critical operations
  - Proper constraint enforcement
- **Error Recovery**: Can the system recover from failures?
  - Graceful degradation
  - Clear error states
  - Retry mechanisms where appropriate

### Key Questions to Ask During Evaluation:
1. What trade-offs were made during development?
2. How would you scale this to 1000+ employees?
3. What would you improve given more time?
4. How do you handle timezone differences?
5. What monitoring/logging would you add for production?

---

## 3. Frontend Architecture

### 3.1 Framework Choice: React with TypeScript

**Why React?**
- **Component-based**: Encourages reusable UI building blocks
- **Virtual DOM**: Efficient rendering and updates
- **Large ecosystem**: Extensive libraries and community support
- **Declarative**: Easier to understand and maintain

**Why TypeScript?**
- **Type safety**: Catch errors at compile time
- **Better IDE support**: Auto-completion and inline documentation
- **Refactoring confidence**: Changes are validated by the compiler
- **Self-documenting code**: Types serve as documentation

**Trade-offs:**
- Learning curve for TypeScript
- Build time overhead for type checking
- More verbose code compared to plain JavaScript

### 3.2 State Management: Redux

**Implementation:**
```typescript
// Store structure
interface ScheduleState {
  selectedWeekStart: string;      // e.g., "2024-01-08"
  selectedWeekEnd: string;        // e.g., "2024-01-14"
  shifts: ShiftItem[];            // Array of shifts for the week
  weekInfo: WeekInfo | null;      // Publishing metadata
  loading: boolean;               // Loading state
  publishing: boolean;            // Publishing in progress
  error: string | null;           // Error messages
}
```

**Why Redux?**
- **Centralized state**: Single source of truth for schedule data
- **Predictable updates**: Actions and reducers make state changes explicit
- **Time-travel debugging**: Can inspect state at any point
- **No prop drilling**: Components access data directly from store

**State Flow:**
1. User action triggers dispatch → `dispatch(setLoading(true))`
2. Component makes API call → `getShifts(weekStartDate)`
3. Response updates store → `dispatch(setShifts(data.results))`
4. UI automatically re-renders with new data

**Key Actions:**
- `setSelectedWeek(weekStart)` - Changes the viewed week
- `setShifts(shifts)` - Updates shift list
- `setWeekInfo(week)` - Updates publishing status
- `setLoading(loading)` - Shows/hides loading spinner
- `removeShift(id)` - Removes a shift after deletion

### 3.3 UI Components & Styling: Material UI

**Why Material UI?**
- **Pre-built components**: Saves development time
- **Consistent design**: Professional look out of the box
- **Accessibility**: ARIA attributes built-in
- **Responsive**: Works on mobile and desktop
- **Customizable**: Can override default styles

**Key Components Used:**
- `Card` - Container for shift table
- `Table`, `TableRow`, `TableCell` - Data display
- `Button` - Actions (Add, Edit, Delete, Publish)
- `Dialog` - Confirmation and clash warnings
- `Alert` - Error and success messages
- `DatePicker` - Calendar-based week selection
- `LinearProgress` - Loading indicator

**Styling Approach:**
```typescript
// Using sx prop for inline styles
<Button 
  sx={{ 
    backgroundColor: '#00a0b0',
    '&:hover': { backgroundColor: '#008a9a' }
  }}
>
  Add Shift
</Button>
```

**Component Organization:**
```
src/
├── components/
│   ├── ConfirmDialog.tsx          # Reusable confirmation dialog
│   ├── ErrorBoundary.tsx          # Error handling wrapper
│   └── shift/
│       ├── WeekNavigator.tsx      # Week navigation controls
│       ├── WeekActions.tsx        # Add/Publish buttons
│       ├── ShiftTable.tsx         # Table structure
│       └── ShiftTableRow.tsx      # Individual shift row
├── pages/
│   ├── Shift.tsx                  # Main schedule page
│   └── ShiftForm.tsx              # Create/Edit form
```

### 3.4 Backend Communication: Axios

**API Client Setup:**
```typescript
// Axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});
```

**API Methods:**
```typescript
// GET shifts for a week
getShifts({ weekStartDate: "2024-01-08" })
  .then(response => {
    // response.data.results contains shift array
  });

// POST new shift
createShifts({
  name: "John Doe",
  date: "2024-01-08",
  startTime: "09:00",
  endTime: "17:00"
});

// PATCH existing shift
updateShiftById(shiftId, {
  startTime: "10:00",
  ignoreClash: false
});

// DELETE shift
deleteShiftById(shiftId);

// POST publish week
publishWeek("2024-01-08");
```

**Error Handling:**
```typescript
try {
  await createShifts(payload);
} catch (error) {
  if (error.response?.status === 409) {
    // Show clash dialog with conflicting shift details
    setClashInfo(error.response.data.data);
  } else {
    // Show generic error message
    dispatch(setError(getErrorMessage(error)));
  }
}
```

**Key Features:**
- Automatic JSON serialization
- Error interceptors for consistent handling
- Promise-based for async/await syntax
- Request/response transformation

---

## 4. Backend Architecture

### 4.1 Architectural Pattern: Monolithic Layered Architecture

**Structure:**
```
backend/
├── src/
│   ├── database/           # Data layer
│   │   └── default/
│   │       ├── entity/     # Database models
│   │       └── repository/ # Data access layer
│   ├── usecases/           # Business logic layer
│   ├── routes/             # API routing layer
│   ├── shared/             # Utilities and helpers
│   └── config/             # Configuration
```

**Why Monolithic?**
- **Simplicity**: Easier to develop and deploy
- **Less overhead**: No network calls between services
- **Suitable for scope**: Application complexity doesn't warrant microservices
- **Single database**: Data consistency is straightforward

**Layer Responsibilities:**

1. **Entity Layer** (Database Models)
   - Defines table structure
   - Column types and constraints
   - Relationships between entities

2. **Repository Layer** (Data Access)
   - CRUD operations
   - Database queries
   - Hides database implementation details

3. **Use Case Layer** (Business Logic)
   - Validates business rules
   - Orchestrates data operations
   - Handles complex workflows

4. **Routes Layer** (API Endpoints)
   - Request validation
   - Maps HTTP requests to use cases
   - Formats responses

### 4.2 Programming Language & Framework: Node.js with Hapi.js

**Why Node.js?**
- **JavaScript ecosystem**: Same language as frontend
- **Non-blocking I/O**: Efficient for I/O-bound operations
- **NPM packages**: Vast library ecosystem
- **TypeScript support**: Type safety on the backend

**Why Hapi.js?**
- **Configuration-based**: Routes defined declaratively
- **Built-in validation**: Joi schema validation
- **Plugin system**: Modular architecture
- **Enterprise-ready**: Used by large companies

**Example Route Definition:**
```typescript
server.route({
  method: 'POST',
  path: '/api/v1/shifts',
  handler: shiftController.create,
  options: {
    validate: {
      payload: Joi.object({
        name: Joi.string().required(),
        date: Joi.string().isoDate().required(),
        startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        ignoreClash: Joi.boolean().optional()
      })
    }
  }
});
```

### 4.3 Database Design: PostgreSQL with TypeORM

**Why PostgreSQL?**
- **ACID compliance**: Ensures data consistency
- **Relational model**: Perfect for structured data
- **Advanced features**: Supports JSON, arrays, full-text search
- **Robust**: Proven reliability in production
- **Transaction support**: Critical for multi-step operations

**Why TypeORM?**
- **TypeScript integration**: Type-safe database queries
- **Migration support**: Version control for database schema
- **Active Record pattern**: Intuitive API
- **Multiple database support**: Can switch databases if needed

**Database Schema:**

```typescript
// Week Entity
@Entity()
class Week {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date", unique: true })
  startDate: string;  // Monday of the week

  @Column({ type: "date" })
  endDate: string;    // Sunday of the week

  @Column({ type: "boolean", default: false })
  isPublished: boolean;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt: Date | null;

  @OneToMany(() => Shift, shift => shift.week)
  shifts: Shift[];
}

// Shift Entity
@Entity()
class Shift {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;       // Employee name

  @Column({ type: "date" })
  date: string;       // Shift date

  @Column({ type: "time" })
  startTime: string;  // Start time (HH:mm)

  @Column({ type: "time" })
  endTime: string;    // End time (HH:mm)

  @Column({ type: "uuid" })
  weekId: string;

  @ManyToOne(() => Week, week => week.shifts, {
    nullable: false,
    onDelete: "CASCADE"
  })
  week: Week;
}
```

**Key Design Decisions:**
1. **Single source of truth**: Publishing status stored only on Week, not on individual Shifts
2. **Cascade delete**: When a week is deleted, all its shifts are deleted
3. **UUID primary keys**: Better for distributed systems
4. **Separate date and time**: PostgreSQL types for proper querying

**Database Indexes:**
```sql
-- Automatic indexes on primary keys and foreign keys
-- Manual index on Week.startDate for faster lookups
CREATE UNIQUE INDEX idx_week_start_date ON week(start_date);
-- Index on Shift.date and weekId for range queries
CREATE INDEX idx_shift_date ON shift(date);
CREATE INDEX idx_shift_week ON shift(week_id);
```

### 4.4 API Design & Authentication

**RESTful Principles:**

| HTTP Method | Purpose | Idempotent? |
|------------|---------|-------------|
| GET | Retrieve data | Yes |
| POST | Create resource | No |
| PATCH | Partial update | No |
| DELETE | Remove resource | Yes |

**Endpoint Design:**

```
Base URL: http://localhost:3000/api/v1

Resource-based endpoints:
  GET    /shifts?weekStartDate=YYYY-MM-DD    # List shifts
  GET    /shifts/{id}                        # Get single shift
  POST   /shifts                             # Create shift
  PATCH  /shifts/{id}                        # Update shift
  DELETE /shifts/{id}                        # Delete shift

  GET    /weeks/{weekStartDate}              # Get week info
  POST   /weeks/{weekStartDate}/publish      # Publish week
```

**Response Format:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "results": {
    "id": "uuid",
    "name": "John Doe",
    "date": "2024-01-08",
    "startTime": "09:00",
    "endTime": "17:00",
    "isPublished": false,
    "publishedAt": null,
    "week": {
      "id": "week-uuid",
      "startDate": "2024-01-08",
      "endDate": "2024-01-14",
      "isPublished": false,
      "publishedAt": null
    }
  }
}
```

**Error Response Format:**
```json
{
  "statusCode": 409,
  "message": "Shift clash detected",
  "data": {
    "clashingShift": {
      "id": "uuid",
      "name": "John Doe",
      "date": "2024-01-08",
      "startTime": "08:00",
      "endTime": "12:00"
    }
  }
}
```

**Authentication:**
Currently, the application **does not implement authentication**. In a production environment, you would add:

1. **JWT (JSON Web Tokens)**
   ```typescript
   // Login endpoint returns token
   POST /api/v1/auth/login
   { "username": "manager", "password": "***" }
   → { "token": "eyJhbGc..." }

   // All other requests include token
   GET /api/v1/shifts
   Headers: { "Authorization": "Bearer eyJhbGc..." }
   ```

2. **Session-based Authentication**
   - User logs in, server creates session
   - Session ID stored in cookie
   - Server validates session on each request

3. **Role-Based Access Control (RBAC)**
   - Managers can publish weeks
   - Employees can only view schedules
   - Admins can manage users

**Validation Strategy:**

Input validation happens at two levels:

1. **Route Level (Hapi + Joi)**
   ```typescript
   validate: {
     payload: Joi.object({
       date: Joi.string().isoDate().required(),
       startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
     })
   }
   ```

2. **Business Logic Level (Use Case)**
   ```typescript
   // Validate shift doesn't overlap
   const clash = await findClashingShift(shiftData);
   if (clash && !ignoreClash) {
     throw new HttpError(409, "Shift clash detected", { clashingShift: clash });
   }
   ```

---

## 5. Codebase Walkthrough Guide

### 5.1 Project Structure Overview

```
staffany-assignments/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── database/
│   │   │   └── default/
│   │   │       ├── entity/     # Database models (Week, Shift)
│   │   │       └── repository/ # Data access methods
│   │   ├── usecases/           # Business logic
│   │   │   ├── shiftUsecase.ts
│   │   │   └── weekUsecase.ts
│   │   ├── routes/             # API endpoints
│   │   │   └── v1/
│   │   │       ├── shifts/
│   │   │       └── weeks/
│   │   ├── shared/             # Utilities
│   │   │   ├── classes/        # Custom error classes
│   │   │   ├── functions/      # Helper functions
│   │   │   └── interfaces/     # TypeScript interfaces
│   │   └── index.ts            # Application entry point
│   ├── ormconfig.js            # Database configuration
│   ├── package.json
│   └── .env                    # Environment variables
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── shift/          # Shift-specific components
│   │   ├── pages/              # Main page components
│   │   │   ├── Shift.tsx       # Schedule view
│   │   │   └── ShiftForm.tsx   # Create/Edit form
│   │   ├── store/              # Redux state management
│   │   │   ├── index.ts
│   │   │   └── slices/
│   │   │       └── scheduleSlice.ts
│   │   ├── helper/             # API clients and utilities
│   │   │   └── api/
│   │   │       └── shift.ts    # API methods
│   │   ├── layouts/            # Page layouts
│   │   ├── App.tsx             # Root component
│   │   └── index.tsx           # Application entry point
│   ├── package.json
│   └── .env                    # Environment variables
├── README.md                   # Main documentation
└── IMPROVEMENTS.md             # Refactoring notes
```

### 5.2 Narrative Flow: Tracing a User Request

Let's trace what happens when a user **creates a new shift**:

#### Step 1: User Interaction (Frontend)

**File:** `frontend/src/pages/ShiftForm.tsx`

```typescript
// User fills form and clicks "Save"
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const payload = {
    name: formData.name,           // "John Doe"
    date: formData.date,           // "2024-01-08"
    startTime: formData.startTime, // "09:00"
    endTime: formData.endTime,     // "17:00"
    ignoreClash: ignoreClash       // false
  };

  try {
    // Call API helper
    const response = await createShifts(payload);
    
    // Success: Redirect to schedule page
    history.push(`/shift?week=${response.results.week.startDate}`);
  } catch (error) {
    // Handle errors (clash detection, validation, etc.)
    if (error.response?.status === 409) {
      // Show clash dialog
      setClashData(error.response.data.data);
      setShowClashDialog(true);
    } else {
      setError(getErrorMessage(error));
    }
  }
};
```

**Key Points:**
- Form validation happens before submission
- API call is wrapped in try-catch for error handling
- Different error types are handled differently (409 for clashes)

#### Step 2: API Request (Frontend Helper)

**File:** `frontend/src/helper/api/shift.ts`

```typescript
export const createShifts = async (payload: any) => {
  const api = getAxiosInstance();
  const { data } = await api.post("/shifts", payload);
  return data;
};

// getAxiosInstance creates an Axios instance with base URL
const getAxiosInstance = () => {
  return axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    // http://localhost:3000/api/v1
  });
};
```

**HTTP Request:**
```
POST http://localhost:3000/api/v1/shifts
Content-Type: application/json

{
  "name": "John Doe",
  "date": "2024-01-08",
  "startTime": "09:00",
  "endTime": "17:00",
  "ignoreClash": false
}
```

#### Step 3: Route Handling (Backend)

**File:** `backend/src/routes/v1/shifts/index.ts`

```typescript
{
  method: "POST",
  path: "/api/v1/shifts",
  handler: shiftController.create,
  options: {
    validate: {
      payload: Joi.object({
        name: Joi.string().required(),
        date: Joi.string().isoDate().required(),
        startTime: Joi.string()
          .pattern(/^\d{2}:\d{2}$/)
          .required(),
        endTime: Joi.string()
          .pattern(/^\d{2}:\d{2}$/)
          .required(),
        ignoreClash: Joi.boolean().optional()
      })
    }
  }
}
```

**What Happens:**
1. Hapi receives the HTTP request
2. Joi validates the payload against the schema
3. If validation fails → 400 Bad Request
4. If validation passes → calls controller

#### Step 4: Controller (Backend)

**File:** `backend/src/routes/v1/shifts/shiftController.ts`

```typescript
export const create = async (request: Request, h: ResponseToolkit) => {
  try {
    // Extract payload
    const payload = request.payload as ICreateShift;
    
    // Call business logic
    const shift = await shiftUsecase.create(payload);
    
    // Return success response
    return h.response({
      statusCode: 201,
      message: "Shift created successfully",
      results: shift
    }).code(201);
    
  } catch (error) {
    // Handle business logic errors
    if (error instanceof HttpError) {
      return h.response({
        statusCode: error.statusCode,
        message: error.message,
        data: error.data
      }).code(error.statusCode);
    }
    
    // Handle unexpected errors
    return h.response({
      statusCode: 500,
      message: "Internal server error"
    }).code(500);
  }
};
```

**Key Points:**
- Controller is thin - delegates to use case
- Consistent response format
- Proper error handling and HTTP status codes

#### Step 5: Business Logic (Backend Use Case)

**File:** `backend/src/usecases/shiftUsecase.ts`

```typescript
export const create = async (payload: ICreateShift) => {
  const { ignoreClash, ...shiftPayload } = payload;

  // 1. Validate shift times
  calculateShiftInterval(
    shiftPayload.date,
    shiftPayload.startTime,
    shiftPayload.endTime
  );
  // Throws HttpError(400) if:
  // - Times are invalid
  // - Duration is 0 or >= 24 hours

  // 2. Get or create the week
  const week = await getOrCreateWeek(shiftPayload.date);
  // Determines which week (Mon-Sun) the date falls in
  // Creates week if it doesn't exist

  // 3. Check if week is published
  if (week.isPublished) {
    throw new HttpError(400, "Cannot add shift to published week");
  }

  // 4. Check for clashing shifts
  const clash = await findClashingShift(shiftPayload);
  if (clash && !ignoreClash) {
    throw new HttpError(409, "Shift clash detected", {
      clashingShift: mapShiftResponse(clash)
    });
  }

  // 5. Create the shift in database
  const shift = await shiftRepository.create({
    ...shiftPayload,
    weekId: week.id
  });

  // 6. Return formatted response
  return mapShiftResponse(shift);
};
```

**Key Business Rules:**
1. Shift duration must be > 0 and < 24 hours
2. Cannot create shifts in published weeks
3. Cannot create overlapping shifts (unless ignoreClash=true)
4. Shifts automatically link to their week

#### Step 6: Clash Detection Logic

**File:** `backend/src/usecases/shiftUsecase.ts`

```typescript
const findClashingShift = async (
  candidate: { date: string; startTime: string; endTime: string },
  excludeShiftId?: string
): Promise<Shift | null> => {
  // Calculate candidate interval
  const interval = calculateShiftInterval(
    candidate.date,
    candidate.startTime,
    candidate.endTime
  );
  // Returns: { startAt: Date, endAt: Date, ... }

  // Get week bounds
  const { weekStartDate, weekEndDate } = getWeekBounds(candidate.date);

  // Query all shifts in the same week
  const existingShifts = await shiftRepository.find({
    where: {
      date: Between(weekStartDate, weekEndDate),
    },
    relations: ["week"],
  });

  // Check each shift for overlap
  for (const shift of existingShifts) {
    if (excludeShiftId && shift.id === excludeShiftId) {
      continue; // Skip the shift being updated
    }

    const existingInterval = calculateShiftInterval(
      shift.date,
      shift.startTime,
      shift.endTime
    );

    // Check overlap: [startA, endA) overlaps [startB, endB)
    // if startA < endB && startB < endA
    if (
      interval.startAt < existingInterval.endAt &&
      existingInterval.startAt < interval.endAt
    ) {
      return shift; // Found a clash
    }
  }

  return null; // No clash
};
```

**Clash Detection Algorithm:**
```
Shift A: [09:00, 17:00)
Shift B: [16:00, 20:00)

Check: 09:00 < 20:00 && 16:00 < 17:00
       true      &&      true
→ CLASH DETECTED

Shift A: [09:00, 17:00)
Shift B: [17:00, 20:00)

Check: 09:00 < 20:00 && 17:00 < 17:00
       true      &&      false
→ NO CLASH (boundary case allowed)
```

**Handling Cross-Midnight Shifts:**
```typescript
// Shift from 23:00 to 02:00
const interval = calculateShiftInterval("2024-01-08", "23:00", "02:00");

// Result:
// startAt: 2024-01-08 23:00:00
// endAt:   2024-01-09 02:00:00  (next day!)
// dayOffset: 1
```

#### Step 7: Database Operation

**File:** `backend/src/database/default/repository/shiftRepository.ts`

```typescript
export const create = async (payload: Partial<Shift>): Promise<Shift> => {
  const connection = await dbConnection.getConnection();
  const repo = connection.getRepository(Shift);
  
  const shift = repo.create(payload);
  await repo.save(shift);
  
  return shift;
};
```

**SQL Generated by TypeORM:**
```sql
INSERT INTO shift (id, name, date, start_time, end_time, week_id)
VALUES ('uuid', 'John Doe', '2024-01-08', '09:00', '17:00', 'week-uuid')
RETURNING *;
```

#### Step 8: Response Journey Back

**Backend Response:**
```json
{
  "statusCode": 201,
  "message": "Shift created successfully",
  "results": {
    "id": "shift-uuid",
    "name": "John Doe",
    "date": "2024-01-08",
    "startTime": "09:00",
    "endTime": "17:00",
    "isPublished": false,
    "publishedAt": null,
    "week": {
      "id": "week-uuid",
      "startDate": "2024-01-08",
      "endDate": "2024-01-14",
      "isPublished": false,
      "publishedAt": null
    }
  }
}
```

**Frontend Updates:**
```typescript
// User is redirected to the schedule page
history.push(`/shift?week=2024-01-08`);

// Schedule page loads and fetches shifts
useEffect(() => {
  const loadShifts = async () => {
    dispatch(setLoading(true));
    const response = await getShifts({ weekStartDate });
    dispatch(setShifts(response.results));
    dispatch(setLoading(false));
  };
  loadShifts();
}, [weekStartDate]);
```

### 5.3 Complex Feature: Week Publishing with Transactions

**The Challenge:**
Publishing a week involves multiple steps that must all succeed or all fail:
1. Check that the week exists and has shifts
2. Check that the week isn't already published
3. Mark the week as published
4. Record the publish timestamp

**The Solution: Database Transactions**

**File:** `backend/src/usecases/weekUsecase.ts`

```typescript
export const publishWeek = async (weekStartDate: string) => {
  const { weekStartDate: normalizedStart, weekEndDate } =
    getWeekBounds(weekStartDate);

  // Get database connection
  const connection = await dbConnection.getConnection();
  
  // Start transaction
  return await connection.transaction(async (transactionalEntityManager) => {
    // All operations use transactional manager
    const weekRepo = transactionalEntityManager.getRepository("Week");
    const shiftRepo = transactionalEntityManager.getRepository("Shift");
    
    // 1. Find or create week
    let week = await weekRepo.findOne({ 
      where: { startDate: normalizedStart } 
    });

    if (!week) {
      week = await weekRepo.save({
        startDate: normalizedStart,
        endDate: weekEndDate,
        isPublished: false,
        publishedAt: null,
      });
    }

    // 2. Check not already published
    if (week.isPublished) {
      throw new HttpError(400, "Week is already published");
    }

    // 3. Check week has shifts
    const shifts = await shiftRepo.find({
      where: {
        date: Between(normalizedStart, weekEndDate),
      },
    });

    if (shifts.length === 0) {
      throw new HttpError(400, "Cannot publish an empty week");
    }

    // 4. Update week
    const publishedAt = new Date();
    await weekRepo.update(week.id, {
      isPublished: true,
      publishedAt,
    });

    // 5. Return updated week
    const updatedWeek = await weekRepo.findOne({ 
      where: { id: week.id } 
    });

    return mapWeekResponse({
      id: updatedWeek?.id ?? week.id,
      startDate: updatedWeek?.startDate ?? week.startDate,
      endDate: updatedWeek?.endDate ?? week.endDate,
      isPublished: true,
      publishedAt,
    });
  });
  // If any error occurs, entire transaction is rolled back
};
```

**Why Transactions Matter:**

**Without Transaction:**
```
Step 1: Check week exists ✓
Step 2: Check not published ✓
Step 3: Update week ✓
Step 4: Update shifts ✗ (server crashes)

Result: Week marked as published, but shifts still editable!
→ Data inconsistency
```

**With Transaction:**
```
BEGIN TRANSACTION;
  Step 1: Check week exists ✓
  Step 2: Check not published ✓
  Step 3: Update week ✓
  Step 4: Update shifts ✗ (error occurs)
ROLLBACK;

Result: All changes reverted, system remains consistent
→ Data integrity maintained
```

### 5.4 Key Areas to Highlight

#### Date/Time Handling

**File:** `backend/src/shared/functions/shiftTime.ts`

```typescript
import { parse, isValid, format, addMinutes } from "date-fns";

// Convert time string to minutes since midnight
const timeToMinutes = (time: string): number => {
  const parsed = parse(time, "HH:mm", new Date());
  
  if (!isValid(parsed)) {
    throw new HttpError(400, "Invalid time value");
  }

  return parsed.getHours() * 60 + parsed.getMinutes();
};

// Calculate shift interval
export const calculateShiftInterval = (
  date: string,
  startTime: string,
  endTime: string
): ShiftInterval => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Handle overnight shifts
  const dayOffset = endMinutes <= startMinutes ? 1 : 0;
  const duration = endMinutes - startMinutes + dayOffset * 1440;

  // Build datetime objects
  const startAt = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
  const endAt = addMinutes(startAt, duration);

  return { startAt, endAt, durationMinutes: duration, dayOffset };
};

// Get week bounds (Monday-Sunday)
export const getWeekBounds = (date: string) => {
  const parsed = parseISO(date);
  const start = startOfWeek(parsed, { weekStartsOn: 1 }); // 1 = Monday
  const end = addDays(start, 6);

  return {
    weekStartDate: format(start, "yyyy-MM-dd"),
    weekEndDate: format(end, "yyyy-MM-dd"),
  };
};
```

**Key Points:**
- Uses `date-fns` library for robust date/time operations
- Handles edge cases (overnight shifts, leap seconds)
- Validates all inputs
- Week always starts on Monday

#### Component Refactoring

**Before:** `Shift.tsx` was 594 lines

**After:** Split into multiple components

**File:** `frontend/src/components/shift/WeekNavigator.tsx`
```typescript
interface WeekNavigatorProps {
  selectedWeekStart: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onOpenCalendar: () => void;
}

const WeekNavigator: FC<WeekNavigatorProps> = ({
  selectedWeekStart,
  onPreviousWeek,
  onNextWeek,
  onOpenCalendar
}) => {
  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Button onClick={onPreviousWeek}>← Previous</Button>
      <Typography variant="h6">
        Week of {format(parseISO(selectedWeekStart), "MMM d, yyyy")}
      </Typography>
      <Button onClick={onNextWeek}>Next →</Button>
      <Button onClick={onOpenCalendar}>📅 Calendar</Button>
    </Box>
  );
};
```

**Benefits:**
- **Reusability**: Can use WeekNavigator on other pages
- **Testability**: Easier to write unit tests
- **Readability**: Clear separation of concerns
- **Maintainability**: Changes isolated to specific components

### 5.5 Code Walkthrough Tips for Interview

**Suggested Presentation Order:**

1. **Start with the Big Picture** (5 minutes)
   - Show project structure diagram
   - Explain the architecture layers
   - Describe data flow

2. **Walk Through a Complete Flow** (10 minutes)
   - Pick creating a shift
   - Go through each layer
   - Show actual code snippets

3. **Highlight Complex Logic** (5 minutes)
   - Clash detection algorithm
   - Transaction handling
   - Cross-midnight shift support

4. **Discuss Design Decisions** (5 minutes)
   - Why PostgreSQL over NoSQL?
   - Why Redux over Context API?
   - Why monolith over microservices?

5. **Show Recent Improvements** (5 minutes)
   - Reference IMPROVEMENTS.md
   - Component refactoring
   - Transaction support added

6. **Q&A Preparation** (5 minutes)
   - Anticipate questions about scaling
   - Be ready to discuss trade-offs
   - Know what you'd improve

**Questions to Guide Your Walkthrough:**

For each code section, ask yourself:
- **What** does this code do?
- **Why** was it implemented this way?
- **How** does it handle edge cases?
- **What** would break if this failed?
- **How** would you test this?

---

## 6. Test Scenarios & Sample Data

### 6.1 Basic Shift Operations

#### Scenario 1: Create a Normal Shift

**Test Data:**
```json
{
  "name": "Alice Johnson",
  "date": "2024-01-08",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Expected Result:**
- ✅ Shift created successfully
- ✅ Shift appears in the schedule for week of Jan 8-14
- ✅ Response includes week information

**How to Test:**
1. Open frontend: http://localhost:3000/shift
2. Click "Add Shift"
3. Fill in the form with test data
4. Click "Save"
5. Verify shift appears in the table

**API Test (using curl):**
```bash
curl -X POST http://localhost:3000/api/v1/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "date": "2024-01-08",
    "startTime": "09:00",
    "endTime": "17:00"
  }'
```

#### Scenario 2: Create an Overnight Shift

**Test Data:**
```json
{
  "name": "Bob Wilson",
  "date": "2024-01-08",
  "startTime": "22:00",
  "endTime": "06:00"
}
```

**Expected Result:**
- ✅ Shift created successfully
- ✅ System recognizes end time is next day
- ✅ Duration calculated as 8 hours

**API Test:**
```bash
curl -X POST http://localhost:3000/api/v1/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Wilson",
    "date": "2024-01-08",
    "startTime": "22:00",
    "endTime": "06:00"
  }'
```

#### Scenario 3: Update Existing Shift

**Prerequisite:** Create a shift first (use Scenario 1)

**Test Data:**
```json
{
  "startTime": "10:00",
  "endTime": "18:00"
}
```

**Expected Result:**
- ✅ Shift times updated
- ✅ Name and date remain unchanged
- ✅ No clash detected

**API Test:**
```bash
# Replace {shift-id} with actual ID from Scenario 1
curl -X PATCH http://localhost:3000/api/v1/shifts/{shift-id} \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "10:00",
    "endTime": "18:00"
  }'
```

#### Scenario 4: Delete a Shift

**Prerequisite:** Create a shift first

**Expected Result:**
- ✅ Shift removed from database
- ✅ Shift disappears from UI
- ✅ 200 OK response

**API Test:**
```bash
curl -X DELETE http://localhost:3000/api/v1/shifts/{shift-id}
```

### 6.2 Clash Detection Scenarios

#### Scenario 5: Create Overlapping Shift (Should Fail)

**Step 1:** Create first shift
```json
{
  "name": "Charlie Davis",
  "date": "2024-01-09",
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Step 2:** Try to create overlapping shift
```json
{
  "name": "Charlie Davis",
  "date": "2024-01-09",
  "startTime": "12:00",
  "endTime": "20:00"
}
```

**Expected Result:**
- ❌ 409 Conflict error
- ❌ Error message: "Shift clash detected"
- ❌ Response includes details of conflicting shift

**API Test:**
```bash
# First shift (should succeed)
curl -X POST http://localhost:3000/api/v1/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie Davis",
    "date": "2024-01-09",
    "startTime": "09:00",
    "endTime": "17:00"
  }'

# Second shift (should fail)
curl -X POST http://localhost:3000/api/v1/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie Davis",
    "date": "2024-01-09",
    "startTime": "12:00",
    "endTime": "20:00"
  }'
```

**Expected Error Response:**
```json
{
  "statusCode": 409,
  "message": "Shift clash detected",
  "data": {
    "clashingShift": {
      "id": "uuid",
      "name": "Charlie Davis",
      "date": "2024-01-09",
      "startTime": "09:00",
      "endTime": "17:00",
      "isPublished": false,
      "publishedAt": null
    }
  }
}
```

#### Scenario 6: Create Overlapping Shift with Ignore Flag

**Test Data:**
```json
{
  "name": "Charlie Davis",
  "date": "2024-01-09",
  "startTime": "12:00",
  "endTime": "20:00",
  "ignoreClash": true
}
```

**Expected Result:**
- ✅ Shift created successfully despite overlap
- ✅ Both shifts exist in the system

**API Test:**
```bash
curl -X POST http://localhost:3000/api/v1/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Charlie Davis",
    "date": "2024-01-09",
    "startTime": "12:00",
    "endTime": "20:00",
    "ignoreClash": true
  }'
```

#### Scenario 7: Boundary Case - Back-to-Back Shifts (Should Succeed)

**Step 1:** Create first shift
```json
{
  "name": "Diana Martinez",
  "date": "2024-01-10",
  "startTime": "08:00",
  "endTime": "16:00"
}
```

**Step 2:** Create adjacent shift
```json
{
  "name": "Diana Martinez",
  "date": "2024-01-10",
  "startTime": "16:00",
  "endTime": "20:00"
}
```

**Expected Result:**
- ✅ Both shifts created successfully
- ✅ No clash detected (16:00 end and 16:00 start don't overlap)

### 6.3 Week Publishing Scenarios

#### Scenario 8: Publish a Week with Shifts

**Prerequisite:** Create at least one shift in week of Jan 8-14

**Test Data:**
```
weekStartDate: 2024-01-08
```

**Expected Result:**
- ✅ Week marked as published
- ✅ `publishedAt` timestamp set
- ✅ All shifts in the week become read-only
- ✅ Add/Edit/Delete buttons disabled in UI

**How to Test:**
1. Navigate to week of Jan 8, 2024
2. Ensure there's at least one shift
3. Click "Publish Week"
4. Confirm in dialog
5. Verify green "Published" banner appears

**API Test:**
```bash
curl -X POST http://localhost:3000/api/v1/weeks/2024-01-08/publish
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Week published successfully",
  "results": {
    "id": "week-uuid",
    "startDate": "2024-01-08",
    "endDate": "2024-01-14",
    "isPublished": true,
    "publishedAt": "2024-01-08T10:30:00.000Z"
  }
}
```

#### Scenario 9: Try to Publish Empty Week (Should Fail)

**Test Data:**
```
weekStartDate: 2024-01-15
```
(Assuming no shifts exist for Jan 15-21)

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Error message: "Cannot publish an empty week"

**API Test:**
```bash
curl -X POST http://localhost:3000/api/v1/weeks/2024-01-15/publish
```

#### Scenario 10: Try to Edit Published Shift (Should Fail)

**Prerequisite:** Publish a week (Scenario 8)

**Test Data:**
```json
{
  "startTime": "10:00"
}
```

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Error message: "Cannot edit a published shift"
- ❌ Edit button disabled in UI

**API Test:**
```bash
curl -X PATCH http://localhost:3000/api/v1/shifts/{published-shift-id} \
  -H "Content-Type: application/json" \
  -d '{"startTime": "10:00"}'
```

#### Scenario 11: Try to Delete Published Shift (Should Fail)

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Error message: "Cannot delete a published shift"
- ❌ Delete button disabled in UI

**API Test:**
```bash
curl -X DELETE http://localhost:3000/api/v1/shifts/{published-shift-id}
```

### 6.4 Validation & Error Handling Scenarios

#### Scenario 12: Invalid Time Format

**Test Data:**
```json
{
  "name": "Eve Taylor",
  "date": "2024-01-11",
  "startTime": "9:00",      // Missing leading zero
  "endTime": "17:00"
}
```

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Validation error message

**API Test:**
```bash
curl -X POST http://localhost:3000/api/v1/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Eve Taylor",
    "date": "2024-01-11",
    "startTime": "9:00",
    "endTime": "17:00"
  }'
```

#### Scenario 13: Invalid Date Format

**Test Data:**
```json
{
  "name": "Frank Brown",
  "date": "01/12/2024",     // Wrong format (should be YYYY-MM-DD)
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Validation error message

#### Scenario 14: Shift Duration Too Long

**Test Data:**
```json
{
  "name": "Grace Lee",
  "date": "2024-01-12",
  "startTime": "09:00",
  "endTime": "09:00"        // Same as start (24h duration)
}
```

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Error message: "Shift duration must be shorter than 24 hours"

#### Scenario 15: Zero Duration Shift

**Test Data:**
```json
{
  "name": "Henry Kim",
  "date": "2024-01-12",
  "startTime": "09:00",
  "endTime": "09:00"        // Same time
}
```

**Expected Result:**
- ❌ 400 Bad Request error
- ❌ Error message: "Shift duration must be greater than 0"

### 6.5 Week Navigation Scenarios

#### Scenario 16: Navigate Between Weeks

**Test Steps:**
1. Open http://localhost:3000/shift?week=2024-01-08
2. Click "Next Week"
3. Verify URL changes to ?week=2024-01-15
4. Verify shifts for Jan 15-21 are displayed
5. Click "Previous Week"
6. Verify URL changes back to ?week=2024-01-08

**Expected Result:**
- ✅ URL updates correctly
- ✅ Shifts reload for the new week
- ✅ Week selector shows correct date range

#### Scenario 17: Direct URL Access

**Test Steps:**
1. Open http://localhost:3000/shift?week=2024-02-05
2. Verify page loads with Feb 5-11 week

**Expected Result:**
- ✅ Correct week is selected
- ✅ Shifts for that week are displayed

#### Scenario 18: Calendar Picker

**Test Steps:**
1. Click "Calendar" button
2. Select a date (e.g., Jan 25, 2024)
3. Verify week of Jan 22-28 is displayed

**Expected Result:**
- ✅ Selected date's week is shown
- ✅ URL updates accordingly

### 6.6 Comprehensive Test Data Set

To fully test the application, create this dataset:

```json
[
  {
    "name": "Alice Johnson",
    "date": "2024-01-08",
    "startTime": "08:00",
    "endTime": "16:00"
  },
  {
    "name": "Alice Johnson",
    "date": "2024-01-09",
    "startTime": "08:00",
    "endTime": "16:00"
  },
  {
    "name": "Bob Wilson",
    "date": "2024-01-08",
    "startTime": "16:00",
    "endTime": "23:59"
  },
  {
    "name": "Charlie Davis",
    "date": "2024-01-10",
    "startTime": "22:00",
    "endTime": "06:00"
  },
  {
    "name": "Diana Martinez",
    "date": "2024-01-11",
    "startTime": "09:00",
    "endTime": "17:00"
  },
  {
    "name": "Diana Martinez",
    "date": "2024-01-12",
    "startTime": "09:00",
    "endTime": "17:00"
  },
  {
    "name": "Eve Taylor",
    "date": "2024-01-15",
    "startTime": "10:00",
    "endTime": "18:00"
  },
  {
    "name": "Frank Brown",
    "date": "2024-01-16",
    "startTime": "07:00",
    "endTime": "15:00"
  }
]
```

**Test Coverage:**
- ✅ Multiple employees
- ✅ Multiple days
- ✅ Different shift lengths
- ✅ Overnight shift
- ✅ Back-to-back shifts
- ✅ Multiple weeks

### 6.7 Automated Testing Script

Create a test script to run all scenarios:

**File:** `test-scenarios.sh`

```bash
#!/bin/bash

API_BASE="http://localhost:3000/api/v1"

echo "=== Testing StaffAny Scheduler ==="
echo ""

# Scenario 1: Create normal shift
echo "Test 1: Creating normal shift..."
RESPONSE=$(curl -s -X POST $API_BASE/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "date": "2024-01-08",
    "startTime": "09:00",
    "endTime": "17:00"
  }')
SHIFT_ID=$(echo $RESPONSE | jq -r '.results.id')
echo "✅ Shift created: $SHIFT_ID"
echo ""

# Scenario 2: Create overnight shift
echo "Test 2: Creating overnight shift..."
curl -s -X POST $API_BASE/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Wilson",
    "date": "2024-01-08",
    "startTime": "22:00",
    "endTime": "06:00"
  }' > /dev/null
echo "✅ Overnight shift created"
echo ""

# Scenario 3: Test clash detection
echo "Test 3: Testing clash detection (should fail)..."
CLASH_RESPONSE=$(curl -s -X POST $API_BASE/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "date": "2024-01-08",
    "startTime": "12:00",
    "endTime": "20:00"
  }')
STATUS=$(echo $CLASH_RESPONSE | jq -r '.statusCode')
if [ "$STATUS" == "409" ]; then
  echo "✅ Clash detected correctly"
else
  echo "❌ Clash detection failed"
fi
echo ""

# Scenario 4: Publish week
echo "Test 4: Publishing week..."
curl -s -X POST $API_BASE/weeks/2024-01-08/publish > /dev/null
echo "✅ Week published"
echo ""

# Scenario 5: Try to edit published shift (should fail)
echo "Test 5: Trying to edit published shift (should fail)..."
EDIT_RESPONSE=$(curl -s -X PATCH $API_BASE/shifts/$SHIFT_ID \
  -H "Content-Type: application/json" \
  -d '{"startTime": "10:00"}')
STATUS=$(echo $EDIT_RESPONSE | jq -r '.statusCode')
if [ "$STATUS" == "400" ]; then
  echo "✅ Correctly prevented editing published shift"
else
  echo "❌ Should not allow editing published shift"
fi
echo ""

echo "=== All tests completed ==="
```

**Run the script:**
```bash
chmod +x test-scenarios.sh
./test-scenarios.sh
```

### 6.8 Manual Testing Checklist

Print this checklist and check off items as you test:

**Basic Operations:**
- [ ] Create a shift
- [ ] Edit a shift
- [ ] Delete a shift
- [ ] View shifts for a week
- [ ] Navigate to next week
- [ ] Navigate to previous week
- [ ] Use calendar picker

**Clash Detection:**
- [ ] Create overlapping shift (should fail)
- [ ] Create overlapping shift with ignore flag (should succeed)
- [ ] Create back-to-back shifts (should succeed)
- [ ] Update shift to overlap existing shift (should fail)

**Publishing:**
- [ ] Publish a week with shifts
- [ ] Try to publish empty week (should fail)
- [ ] Try to publish already published week (should fail)
- [ ] Verify edit button disabled for published shifts
- [ ] Verify delete button disabled for published shifts
- [ ] Verify add button disabled for published weeks

**Validation:**
- [ ] Invalid time format (should fail)
- [ ] Invalid date format (should fail)
- [ ] Shift duration too long (should fail)
- [ ] Zero duration shift (should fail)
- [ ] Missing required fields (should fail)

**Edge Cases:**
- [ ] Overnight shift (22:00 to 06:00)
- [ ] Shift ending at 23:59
- [ ] Shift starting at 00:00
- [ ] Create shift for future date
- [ ] Create shift for past date

**UI/UX:**
- [ ] Loading spinners appear during API calls
- [ ] Error messages are clear and helpful
- [ ] Success feedback is provided
- [ ] Confirmation dialogs appear for destructive actions
- [ ] Published weeks have visual indication
- [ ] Tables are sortable/paginated
- [ ] Forms validate inputs
- [ ] Responsive on mobile devices

---

## Interview Tips & Guiding Questions

### For Each Section, Be Ready to Answer:

**Application Overview:**
- What problem does this solve better than existing solutions?
- Who are the real users of this application?
- What's the most important feature and why?

**Evaluation Criteria:**
- What metrics would you use to measure success?
- How would you prioritize improvements?
- What technical debt exists?

**Frontend Architecture:**
- Why did you choose these specific technologies?
- What alternatives did you consider?
- How would you handle state in a larger application?
- How would you improve performance?

**Backend Architecture:**
- Why a monolith instead of microservices?
- How would you scale this to handle 10x traffic?
- What would you do differently for a production system?
- How would you handle database migrations?

**Codebase Walkthrough:**
- Walk me through the most complex feature
- How do you ensure code quality?
- What would you refactor given more time?
- How do you handle errors and edge cases?

**Testing:**
- What testing strategy would you implement?
- How would you test the clash detection logic?
- What would you add for production monitoring?

### Customization Placeholders

**Replace these with your specific details:**

- [YOUR_NAME] - Your name
- [INTERVIEW_DATE] - Date of interview
- [COMPANY_NAME] - Company you're interviewing with
- [YOUR_EMAIL] - Your contact email
- [GITHUB_REPO] - Link to your repository
- [LIVE_DEMO_URL] - If you have a deployed version

**Areas to Expand Based on Interviewer Interest:**
- Add authentication/authorization details if relevant
- Include deployment strategy if asked
- Prepare database migration plan if relevant
- Have monitoring/logging strategy ready if needed

---

## Conclusion

This document provides a comprehensive guide for presenting the StaffAny Scheduler application in a technical interview. The structure covers all major aspects of the application:

1. **What it does** - Application Overview
2. **How to evaluate it** - Evaluation Criteria  
3. **How it's built** - Frontend & Backend Architecture
4. **How it works** - Codebase Walkthrough
5. **How to test it** - Test Scenarios

Use this document as a reference during your preparation. Practice explaining each section in simple terms, and be ready to dive deep into areas where the interviewer shows interest.

**Remember:**
- Be honest about trade-offs and limitations
- Show enthusiasm for learning and improvement
- Demonstrate problem-solving thinking, not just coding
- Ask clarifying questions before diving into technical details

Good luck with your interview! 🚀
