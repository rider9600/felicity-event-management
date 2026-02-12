# Felicity Platform - Complete Setup Guide

This is a full-stack event management platform for Felicity (IIIT Hyderabad's cultural fest).

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Project Structure

```
felicity-platform/
├── backend/           # Express.js API server
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── src/              # React frontend
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── utils/
└── public/
```

## Setup Instructions

### 1. Install MongoDB

Make sure MongoDB is installed and running on your system:

**Windows:**

- Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
- Install and start MongoDB service

**macOS:**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**

```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

Verify MongoDB is running:

```bash
mongod --version
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done)
npm install

# The .env file is already configured with default values:
# - PORT=5000
# - MONGO_URI=mongodb://localhost:27017/felicity
# - JWT_SECRET=felicity_jwt_secret_2024_development_key

# Start the backend server
npm run dev
```

The backend will start at **http://localhost:5000**

### 3. Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will start at **http://localhost:5173**

## Running the Full Application

### Option 1: Two Terminals

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

### Option 2: Using npm-run-all (recommended for development)

Install npm-run-all globally:

```bash
npm install -g npm-run-all
```

Then you can add scripts to the root package.json:

```json
{
  "scripts": {
    "dev": "npm-run-all --parallel dev:frontend dev:backend",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && npm run dev"
  }
}
```

## Testing the Application

### 1. Create Test Users

You can use the frontend to create accounts or use the API directly:

**Participant Account:**

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@iiit.ac.in",
    "password": "password123",
    "participantType": "iiit",
    "collegeOrg": "IIIT Hyderabad",
    "contactNumber": "9876543210"
  }'
```

**Organizer Account** (manually set role to 'organizer' in MongoDB):

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "organizer@example.com" },
  { $set: { role: "organizer", organizerName: "Tech Club" } },
);
```

**Admin Account** (manually set role to 'admin' in MongoDB):

```javascript
// In MongoDB shell or Compass
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } });
```

### 2. Access Different Dashboards

- **Participant Dashboard**: http://localhost:5173/participant/dashboard
- **Organizer Dashboard**: http://localhost:5173/organizer/dashboard
- **Admin Dashboard**: http://localhost:5173/admin/dashboard

## API Endpoints

All API endpoints are documented in [backend/README.md](backend/README.md)

Base URL: `http://localhost:5000/api`

### Quick Test

Health check:

```bash
curl http://localhost:5000/api/health
```

## Features Implemented

### Participant Features

- ✅ Browse and search events
- ✅ Filter events by type, eligibility, date
- ✅ Register for events with custom forms
- ✅ View and manage registrations
- ✅ Generate and view tickets with QR codes
- ✅ Follow/unfollow organizers
- ✅ View trending events
- ✅ Purchase merchandise

### Organizer Features

- ✅ Create events with custom registration forms
- ✅ Manage events (draft, publish, edit, delete)
- ✅ View participant list and registrations
- ✅ Mark attendance via QR code/ticket ID
- ✅ View event analytics
- ✅ Send Discord notifications
- ✅ Manage merchandise inventory

### Admin Features

- ✅ View and manage all users
- ✅ Approve/reject organizers
- ✅ View and manage all events
- ✅ Platform-wide statistics
- ✅ Reset user passwords

## Tech Stack

### Frontend

- React 19
- React Router v6
- Axios
- date-fns
- qrcode.react
- Vite

### Backend

- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS

## Troubleshooting

### MongoDB Connection Error

If you see "MongooseServerSelectionError":

```bash
# Check if MongoDB is running
sudo systemctl status mongodb  # Linux
brew services list              # macOS

# Start MongoDB if not running
sudo systemctl start mongodb    # Linux
brew services start mongodb-community  # macOS
```

### Port Already in Use

If port 5000 or 5173 is already in use:

```bash
# Find and kill process using port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

### CORS Errors

Make sure the backend is running on port 5000 and frontend on 5173. The backend is configured to allow all origins by default.

## Development Tips

1. **Auto-restart on changes**: Both frontend (Vite) and backend (nodemon) support hot reload
2. **API Testing**: Use Postman or Thunder Client for testing API endpoints
3. **MongoDB GUI**: Use MongoDB Compass to view and manage database
4. **Browser DevTools**: React DevTools extension helps debug React components

## Production Deployment

For production deployment:

1. Update environment variables in `.env`
2. Set `NODE_ENV=production`
3. Use a proper MongoDB connection string (MongoDB Atlas recommended)
4. Change JWT_SECRET to a strong random string
5. Build frontend: `npm run build`
6. Serve static files through Express or use a CDN

## Assignment Requirements Checklist

### Participant Requirements (40 marks) ✅

- [x] Smart event browsing with filters
- [x] View event details with custom forms
- [x] Register for events
- [x] View registrations and tickets
- [x] Trending events
- [x] Follow/unfollow organizers
- [x] Merchandise purchase with restrictions

### Organizer Requirements (20 marks) ✅

- [x] Create events with custom forms
- [x] Event management (CRUD operations)
- [x] View participants and registrations
- [x] Mark attendance
- [x] Analytics dashboard
- [x] Discord webhook integration

### Admin Requirements (10 marks) ✅

- [x] Manage organizers and users
- [x] Platform statistics
- [x] Event management
- [x] Password reset functionality

## License

This project is created for academic purposes as part of DASS course assignment.
