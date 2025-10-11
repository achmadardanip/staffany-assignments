# StaffAny Scheduler Assignment

This repository contains the backend (Hapi + TypeORM) and frontend (React + Material UI + Redux) implementations for the StaffAny scheduling assignment. The solution extends the starter project with week-based publishing, clash detection, and UI enhancements that match the provided mockups.

## Recent Improvements

This codebase has been refactored to address several architectural concerns. See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed documentation. Key improvements include:

1. **Simplified Data Model**: Removed duplicate `isPublished`/`publishedAt` fields from Shift entity (kept only on Week)
2. **Transaction Support**: Added database transactions for atomic updates in publishWeek operations
3. **Component Refactoring**: Broke down the 594-line Shift.tsx into 4 smaller, reusable components (30% reduction)
4. **Better Date Handling**: Replaced error-prone string manipulation with date-fns library functions

All changes maintain backward compatibility and improve code maintainability, testability, and reliability.

## Project Structure

```
├── backend   # Hapi API server (TypeScript)
└── frontend  # React application (TypeScript)
```

---

## Backend

### Tech Stack
- **Framework:** Hapi.js
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Language:** TypeScript

### Environment Variables
Create a `.env` file inside `backend/` (already included) and adjust as needed:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=staffany
PORT=3000
BASE_API_PATH=/api
```

### Installation & Setup
1. Ensure PostgreSQL and Node.js (v22+) are installed and running.
2. From the repository root run:
   ```bash
   cd backend
   npm install
   ./createdb.sh   # creates the database defined in .env
   npm run dev     # starts the Hapi server on http://localhost:3000
   ```

### API Endpoints
Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET    | `/shifts?weekStartDate=YYYY-MM-DD` | List shifts for the selected week (inclusive Monday–Sunday). Returns sanitized time strings and week metadata. |
| GET    | `/shifts/{id}` | Retrieve a single shift with week information. |
| POST   | `/shifts` | Create a shift. Rejects overlapping shifts unless `ignoreClash=true` is provided. |
| PATCH  | `/shifts/{id}` | Update a shift. Rejects edits on published shifts or moves into published weeks. Supports `ignoreClash`. |
| DELETE | `/shifts/{id}` | Delete a shift (only allowed if its week is unpublished). |
| GET    | `/weeks/{weekStartDate}` | Fetch publishing metadata (published flag, publishedAt) for a week. Weeks are automatically created on demand. |
| POST   | `/weeks/{weekStartDate}/publish` | Publish all shifts within the week. Rejects empty weeks or already published weeks. |

### Business Rules & Validations
- **Shift duration**: Using the input date as start day, determine if end time spills into the next day. Duration must satisfy `0 < duration < 24h`. Shifts ending exactly when the next day starts are rejected.
- **Clash detection**: Shifts are normalized to `[startAt, endAt)` timestamps and compared with overlapping logic (`startA < endB && startB < endA`). Cross-midnight overlaps are accounted for. Boundary cases where one shift ends when another starts are permitted.
- **Ignore clash**: Create and update endpoints accept `ignoreClash=true`. Without the flag the API returns `409` with details of the conflicting shift.
- **Publishing**:
  - Publishing applies to an entire week (Monday–Sunday).
  - Once published, all shifts in that week become immutable (no create/update/delete allowed).
  - Publishing an empty week is rejected.
  - Attempting to move a shift into a published week is rejected.

Responses use a consistent structure (`statusCode`, `message`, `results`) and errors include `data` when extra context (e.g., clash details) is required.

---

## Frontend

### Tech Stack
- **Framework:** React (TypeScript)
- **UI Library:** Material UI
- **State Management:** Redux (with a custom reducer)
- **Routing:** React Router v5

### Environment Variables
Create `frontend/.env` (already included) with:
```
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
```

### Installation & Development
1. From the repository root run:
   ```bash
   cd frontend
   npm install
   npm run dev   # starts CRA dev server on http://localhost:3000
   ```
   Ensure the backend server is running so the API calls succeed.

### Features Implemented
- **Week picker**: Arrow navigation and calendar picker allow viewing any week. The selected week is synced to the URL query (`?week=YYYY-MM-DD`) so browser navigation restores the same week.
- **Shift table**: Table layout matches the mock (name/date/start/end/actions). Loading and empty states are provided. Actions are disabled for published weeks.
- **Create/Edit form**:
  - `Add Shift` button relocated to the card header; defaults date to the Monday of the selected week, start time to the current hour, end time to the next hour.
  - Clash warnings display a modal with the conflicting shift and offer *Cancel* or *Ignore* options.
  - After save the user is redirected back to the relevant week (based on the shift's week).
- **Publishing controls**: Publish button (with confirmation dialog) publishes an entire week. Once published, Add/Edit/Delete/Publish are disabled and a green banner indicates the publish timestamp.
- **Redux store**: Maintains selected week, schedule data, loading states, and errors. API interactions are coordinated through action dispatches in the component layer.

### UI Notes
- Styles adhere closely to the provided mockups (navy header, turquoise buttons, typography).
- Error handling uses dismissible Material UI alerts.
- Confirm dialogs reuse a shared component with customizable labels.
- Clash modal uses standard MUI dialogs to display the required copy.

---

## Testing & Verification
- Run `npm test` in each project for unit tests (none provided by default).
- Manual verification:
  - Create, update, delete shifts and validate clash detection.
  - Publish a week, ensure shifts become read-only and new creation is blocked.
  - Cross-midnight shifts (e.g., 20:00 → 02:00) are permitted and properly detected for clashes.
  - Navigation via week picker maintains state when navigating away/back.

---

## Additional Notes
- The backend uses TypeORM synchronize mode for convenience. In production, migrations are recommended.
- The Redux store uses vanilla Redux to avoid introducing extra dependencies; asynchronous API calls are orchestrated within components while reducers manage the canonical state.
- `.env` files are committed as requested for easier setup.

Feel free to reach out if clarification or additional documentation is required.
