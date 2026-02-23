# Backend API Testing Commands

## Running the Backend Server

First, start the backend server:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the server in development mode
npm run dev

# Or start in production mode
npm start
```

The server should start on `http://localhost:5000`

## Testing with cURL Commands

### 1. Authentication Routes

#### Register a Participant

```bash
curl -X POST http://localhost:5000/point/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Test",
    "lastname": "User",
    "email": "test@iiit.ac.in",
    "password": "test123",
    "participantType": "iiit"
  }'
```

#### Register an Organizer

```bash
curl -X POST http://localhost:5000/point/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Test",
    "lastname": "Organizer",
    "email": "organizer@test.com",
    "password": "test123",
    "role": "organizer",
    "participantType": "non-iiit"
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/point/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@iiit.ac.in",
    "password": "test123"
  }'
```

#### Admin Login

```bash
curl -X POST http://localhost:5000/point/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@system.com",
    "password": "admin123"
  }'
```

#### Logout (with token)

```bash
curl -X POST http://localhost:5000/point/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Refresh Token

```bash
curl -X POST http://localhost:5000/point/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 2. Participant Routes

#### Get Profile

```bash
curl -X GET http://localhost:5000/point/participant/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Update Profile

```bash
curl -X PUT http://localhost:5000/point/participant/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Updated",
    "lastname": "Name",
    "contactNumber": "+1234567890",
    "college": "Test University",
    "interests": ["music", "coding", "sports"]
  }'
```

#### Get Dashboard

```bash
curl -X GET http://localhost:5000/point/participant/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Complete Onboarding

```bash
curl -X POST http://localhost:5000/point/participant/onboarding \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "interests": ["music", "technology", "sports"],
    "followedClubs": []
  }'
```

#### Get Recommended Events

```bash
curl -X GET http://localhost:5000/point/participant/recommended-events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Event Routes

#### Get All Events

```bash
curl -X GET http://localhost:5000/point/events
```

#### Get Event by ID

```bash
curl -X GET http://localhost:5000/point/events/EVENT_ID_HERE
```

#### Create Event (Organizer/Admin)

```bash
curl -X POST http://localhost:5000/point/events \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Test Event",
    "eventDescription": "This is a test event",
    "eventType": "normal",
    "eventStartDate": "2026-03-15T10:00:00.000Z",
    "eventEndDate": "2026-03-15T18:00:00.000Z",
    "venue": "Test Venue",
    "maxParticipants": 100,
    "registrationFee": 500,
    "eventTags": ["technology", "workshop"],
    "registrationStartDate": "2026-02-20T00:00:00.000Z",
    "registrationEndDate": "2026-03-10T23:59:59.000Z"
  }'
```

### 4. Registration Routes

#### Register for Event

```bash
curl -X POST http://localhost:5000/point/registration/register \
  -H "Authorization: Bearer YOUR_PARTICIPANT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "EVENT_ID_HERE",
    "additionalInfo": "Any additional information"
  }'
```

### 5. Preferences Routes

#### Get Preferences

```bash
curl -X GET http://localhost:5000/point/preferences/get \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Set Preferences

```bash
curl -X POST http://localhost:5000/point/preferences/set \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "interests": ["music", "technology", "sports"],
    "followedClubs": []
  }'
```

### 6. Admin Routes

#### Get Admin Dashboard Stats

```bash
curl -X GET http://localhost:5000/point/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### Get All Users (Admin)

```bash
curl -X GET http://localhost:5000/point/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### Create User (Admin)

```bash
curl -X POST http://localhost:5000/point/admin/create-user \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "New",
    "lastname": "Organizer",
    "email": "neworganizer@test.com",
    "password": "password123",
    "role": "organizer",
    "participantType": "non-iiit"
  }'
```

### 7. Organizer Routes

#### Get Organizer Dashboard

```bash
curl -X GET http://localhost:5000/point/organizer/dashboard \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN_HERE"
```

#### Get Organizer Events

```bash
curl -X GET http://localhost:5000/point/organizer/events \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN_HERE"
```

## Testing Workflow

1. **Start the backend server**
2. **Register users** (participant, organizer)
3. **Login as admin** using provided credentials
4. **Get tokens** from successful login responses
5. **Use tokens** in Authorization headers for protected routes
6. **Test CRUD operations** for events, registrations, etc.

## Expected Response Format

Most endpoints return JSON in this format:

### Success Response:

```json
{
  "message": "Success message",
  "data": { ... },
  "user": { ... } // for auth endpoints
}
```

### Error Response:

```json
{
  "error": "Error message",
  "msg": "Alternative error field"
}
```

## Common HTTP Status Codes

- `200` - Success
- `201` - Created Successfully
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Notes

- Replace `YOUR_TOKEN_HERE` with actual JWT tokens from login responses
- Replace `EVENT_ID_HERE` with actual MongoDB ObjectIds
- All dates should be in ISO 8601 format
- Admin credentials: `admin@system.com` / `admin123`
- Server runs on port 5000 by default
- CORS is enabled for frontend integration
