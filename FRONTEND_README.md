# Felicity Platform - Frontend

A comprehensive event management platform for IIIT Hyderabad's Felicity fest, built with React and Vite.

## Features

### Participant Features

- Browse and search events with filters
- View trending events
- Register for normal events and purchase merchandise
- Track registrations and participation history
- Follow clubs and organizers
- Personalized event recommendations
- Profile management with preferences

### Organizer Features

- Create and manage events (Draft/Published/Ongoing/Completed)
- Custom registration form builder
- Event analytics dashboard
- Participant management and attendance tracking
- Export participant data to CSV
- Discord webhook integration
- Event revenue tracking

### Admin Features

- Create and manage organizer accounts
- System-wide user management
- Password reset handling
- Platform analytics

## Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Date Utilities:** date-fns
- **QR Codes:** qrcode.react
- **Styling:** CSS Modules

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd felicity-platform
```

2. Install dependencies

```bash
npm install
```

3. Create environment file

```bash
cp .env.example .env
```

4. Update the `.env` file with your backend API URL:

```
VITE_API_URL=http://localhost:5000/api
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── LoadingSpinner.jsx
│   └── ErrorMessage.jsx
├── context/            # React Context providers
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── participant/   # Participant pages
│   ├── organizer/     # Organizer pages
│   └── admin/         # Admin pages
├── services/          # API services
│   └── api.js
├── utils/             # Utility functions
│   ├── constants.js
│   ├── validators.js
│   └── helpers.js
├── App.jsx            # Main app component with routing
└── main.jsx           # Entry point
```

## User Roles

### Participant

- IIIT Students (must use IIIT email)
- Non-IIIT Participants (any email)

### Organizer

- Clubs, Councils, and Fest Teams
- No self-registration (created by Admin)

### Admin

- System administrator
- Provisioned at backend level

## Key Features Implementation

### Authentication & Security

- JWT-based authentication
- Password hashing (bcrypt)
- Role-based access control
- Session persistence across browser restarts

### Event Management

- Two event types: Normal and Merchandise
- Custom registration forms with drag-and-drop builder
- Event status workflow: Draft → Published → Ongoing → Completed
- Registration deadline and capacity management

### Search & Discovery

- Fuzzy search on events and organizers
- Multiple filters (type, eligibility, date range)
- Trending events (top 5 in last 24 hours)
- Followed clubs filter

### Analytics & Reporting

- Real-time event statistics
- Participant list with search and filters
- CSV export functionality
- Revenue tracking for paid events

## Environment Variables

| Variable       | Description          | Example                     |
| -------------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

## API Integration

The frontend communicates with the backend through the following API endpoints:

- `/auth/*` - Authentication and profile
- `/participant/*` - Participant-specific operations
- `/events/*` - Event browsing and registration
- `/organizer/*` - Organizer dashboard and event management
- `/admin/*` - Admin operations

See `src/services/api.js` for complete API documentation.

## Deployment

### Frontend Deployment (Vercel/Netlify)

1. Build the project:

```bash
npm run build
```

2. Deploy the `dist` folder to your hosting platform

3. Set environment variables in your hosting platform:
   - `VITE_API_URL` - Your production backend URL

### Environment-specific Configuration

- **Development:** Uses `.env` file
- **Production:** Set environment variables in hosting platform

## Contributing

1. Follow the existing code structure
2. Use meaningful component and variable names
3. Add comments for complex logic
4. Test thoroughly before committing

## License

MIT License - Feel free to use this project for educational purposes.

## Support

For issues or questions, please contact the development team.
