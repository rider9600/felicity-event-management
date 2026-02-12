# Felicity Platform Backend

Backend API for the Felicity event management platform built with Express.js and MongoDB.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: Support for participants, organizers, and admins
- **Event Management**: Create, update, delete events with custom registration forms
- **Registration System**: Event registrations with ticket generation
- **Analytics**: Event analytics and attendance tracking
- **Discord Integration**: Webhook support for event notifications

## Tech Stack

- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing

## Installation

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Make sure MongoDB is running locally or update MONGO_URI in .env

## Running the Server

### Development mode (with auto-restart):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication (`/api/auth`)

- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `PUT /change-password` - Change password (protected)

### Events (`/api/events`)

- `GET /` - Get all events (with filters)
- `GET /trending` - Get trending events
- `GET /:id` - Get event by ID
- `POST /:id/register` - Register for event (participant only)
- `POST /:id/purchase` - Purchase merchandise (participant only)
- `GET /tickets/:ticketId` - Get ticket details (protected)

### Participant (`/api/participant`)

- `GET /registrations` - Get my registrations
- `PUT /registrations/:id/cancel` - Cancel registration
- `GET /organizers` - Get list of organizers
- `POST /follow/:organizerId` - Follow organizer
- `DELETE /follow/:organizerId` - Unfollow organizer
- `PUT /preferences` - Update preferences

### Organizer (`/api/organizer`)

- `GET /events` - Get organizer's events
- `POST /events` - Create new event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `PUT /events/:id/publish` - Publish event
- `GET /events/:id/participants` - Get event participants
- `PUT /registrations/:id` - Update registration status
- `POST /events/:id/attendance/:ticketId` - Mark attendance
- `GET /events/:id/analytics` - Get event analytics
- `POST /events/:id/notify` - Send Discord notification

### Admin (`/api/admin`)

- `GET /organizers/pending` - Get pending organizers
- `PUT /organizers/:id/status` - Approve/Reject organizer
- `DELETE /organizers/:id` - Delete organizer
- `GET /users` - Get all users
- `PUT /users/:id/reset-password` - Reset user password
- `GET /events` - Get all events
- `PUT /events/:id/status` - Update event status
- `DELETE /events/:id` - Delete event
- `GET /stats` - Get platform statistics

## Database Models

### User

- Supports three roles: participant, organizer, admin
- Participant-specific fields: participantType, interests, followedOrganizers
- Organizer-specific fields: organizerName, category, description, discordWebhook

### Event

- Two types: normal events and merchandise
- Custom registration forms support
- Status tracking: draft, published, ongoing, completed, closed
- Statistics: registrations, attendance, revenue

### Registration

- Tracks event registrations and purchases
- Auto-generated unique ticket IDs
- Stores custom form responses
- Attendance tracking

## Environment Variables

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/felicity
JWT_SECRET=your_jwt_secret_key
```

## Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   ├── participantController.js
│   ├── organizerController.js
│   └── adminController.js
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── error.js           # Error handling
├── models/
│   ├── User.js
│   ├── Event.js
│   └── Registration.js
├── routes/
│   ├── auth.js
│   ├── events.js
│   ├── participant.js
│   ├── organizer.js
│   └── admin.js
├── utils/
│   └── generateToken.js
├── .env
├── .env.example
├── package.json
└── server.js              # Entry point
```

## Testing

You can test the API using tools like Postman or curl.

Example login request:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Notes

- All protected routes require a valid JWT token in the Authorization header: `Bearer <token>`
- Make sure MongoDB is running before starting the server
- The server uses CORS to allow requests from the frontend (default: all origins)
