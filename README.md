# Felicity Event Management Platform

Full‑stack event management system for Felicity 2026 with multi‑role support (participant, organizer, admin), event creation, custom registration forms, merchandise sales, analytics, and real‑time event forums.  
Frontend is deployed on **Vercel**, backend on **Railway** (Node + MongoDB).

---

## 1. Tech Stack, Libraries & Justification

### 1.1 Frontend

- **React 19** (`react`, `react-dom`)  
  - Chosen for component‑based UI, hooks API, and rich ecosystem.  
  - Fits SPA requirements: dashboard, forms, and multiple role‑based views.

- **React Router DOM 7** (`react-router-dom`)  
  - Client‑side routing for SPA navigation: `/login`, `/events`, `/organizer/events`, `/admin/*`, `/profile`, `/tickets`, etc.  
  - Enables protected routes based on role (participant / organizer / admin).

- **Vite** (`vite`, `@vitejs/plugin-react`)  
  - Fast dev server + build tool with great DX and small production bundles.  
  - Native ES modules and sensible defaults; easy environment variable support (`VITE_API_BASE_URL`).

- **Axios** (`axios`)  
  - Used where a higher‑level HTTP client is convenient (e.g., shared interceptors for auth token).  
  - Simplifies error handling compared to raw `fetch` in some utility modules.

- **Socket.io Client** (`socket.io-client`)  
  - Real‑time WebSocket communication for the event forum.  
  - Automatically handles reconnection and fallbacks, reducing custom socket boilerplate.

- **Plain CSS + Design System**  
  - `frontend/src/styles/designSystem.css` uses CSS variables for blue/black/white theme, dark mode, spacing, and typography tokens.  
  - Justification: lightweight, no heavy UI framework; easier to match custom design spec.

### 1.2 Backend

- **Node.js + Express 5** (`express`)  
  - Minimal, flexible HTTP server.  
  - Router structure (`authroutes`, `eventroutes`, `adminroutes`, etc.) keeps code modular.

- **MongoDB + Mongoose 9** (`mongoose`)  
  - Document DB fits event/ticket/registration domain with nested structures (merchandise items, custom forms).  
  - Mongoose schemas enforce structure and validation for `user`, `event`, `ticket`, etc.

- **JWT Auth** (`jsonwebtoken`)  
  - Stateless authentication with access + refresh tokens.  
  - Works well with SPA + multiple roles (participant / organizer / admin).

- **Password Hashing** (`bcrypt`)  
  - Secure hashing for user/organizer/admin passwords.

- **CORS** (`cors`)  
  - Explicitly configured to allow localhost dev and Vercel origin while keeping other origins blocked.

- **Environment Management** (`dotenv`)  
  - Reads secrets like `mongoconnection`, `secretbro`, email credentials from `.env`.  
  - Clean separation between code and configuration.

- **File Uploads** (`multer`)  
  - Handles payment proof uploads for merchandise tickets / registrations.

- **Email Sending** (`nodemailer`)  
  - Sends ticket / reset emails (purchase confirmations, admin password workflows).

- **QR Code Generation** (`qrcode`)  
  - Generates QR codes for tickets used in attendance scanning; improves on plain numeric IDs.

- **Socket.io Server** (`socket.io`)  
  - Real‑time event forum updates and potential future live notifications.

- **node-fetch**  
  - Used for calling external services (e.g., webhook / analytics integrations) when needed.

### 1.3 Infrastructure

- **Railway (Backend)**  
  - Managed Node hosting with environment variables and MongoDB compatibility.  
  - Simplifies deployment (Git‑driven deploys, SSL, logs).

- **Vercel (Frontend)**  
  - Optimized for React/Vite SPAs and automatic deployments from GitHub.  
  - Easy environment variable configuration for `VITE_API_BASE_URL`.

---

## 2. Advanced Features by Tier

> The grouping below assumes the course’s Tier A/B/C rubric. Names may differ, but each item explicitly states the design and implementation approach.

### 2.1 Tier A – Core Event & User Flows

- **Multi‑Role Auth (Participant / Organizer / Admin)**  
  - *Design:* Single `user` collection with `role` field; backend middleware (`protect`, role checks) gates routes.  
  - *Implementation:* JWT issued in `authcontroller.login`; front‑end `AuthContext` stores `token`, `refreshToken`, `user` and wraps routes in `ProtectedRoute` components.  
  - *Decision:* Prefer role flag over separate collections for simpler login and session handling.

- **Event Creation & Editing Workflow**  
  - *Flow:* `Create (draft) → Define form / merchandise → Publish → Ongoing → Completed/Closed` as per spec 10.4.  
  - *Backend:* `eventcontroller.updateEvent` enforces status‑based rules (free edits in draft, limited edits in published, only status changes when ongoing/completed).  
  - *Frontend:* `CreateEvent.jsx` shows/locks fields and status options based on current event state.

- **Custom Registration Form Builder**  
  - *Design:* Organizer can add fields (text/number/textarea/dropdown/checkbox/file) per event. Schema stored on `event.customForm`.  
  - *Implementation:*  
    - `CreateEvent.jsx` manages `formFields` with types, label, required and options; generates stable `name` slug per field.  
    - `eventcontroller.updateEventForm` persists `customForm` if not locked.  
    - `registrationcontroller.registerNormalEvent` validates `formData` against required fields.  
  - *Decision:* Store form schema on event instead of global registry so each event can customize independently.

- **Merchandise Events & Tickets**  
  - *Design:* Separate event type `merchandise` with items (size, color, variant, stock, purchaseLimit).  
  - *Implementation:*  
    - `event.merchandise.items` array in schema.  
    - `registrationcontroller.purchaseMerchandise` does atomic stock decrement and purchase limit enforcement.  
    - Frontend `EventDetails.jsx` presents merchandise variants and quantity selector; uses tickets API for purchase.

- **Participation Dashboard & History**  
  - *Backend:* `participantcontroller.getDashboard` categorizes tickets into upcoming, normalHistory, merchandiseHistory, completed, cancelled/rejected.  
  - *Frontend:* Dashboard page renders each category section for clear audit of user participation.

### 2.2 Tier B – Analytics, Organizer Tools, Real‑Time

- **Organizer Dashboard & Analytics**  
  - *Design:* Organizers need quick insight into registrations, revenue, and attendance.  
  - *Implementation:* `organizeranalyticscontroller` aggregates over events/tickets for counts, charts; `OrganizerAnalytics.jsx` visualizes metrics.  
  - *Decision:* Pre‑compute at query time using Mongo aggregations to avoid premature background jobs complexity.

- **Admin Organizer Management (Clubs/Organizers)**  
  - *Features:*  
    - Admin can create organizers (`createorganizer`) with auto‑generated email + password.  
    - Archive / delete organizers; delete also cascades events + tickets (`deleteOrganizer`).  
    - Manage clubs and link events to clubs.  
  - *Frontend:* `ManageClubs.jsx` presents tabs for clubs/organizers with archive/activate/delete actions and displays generated credentials once.

- **Event Detail (Organizer View) & CSV Export**  
  - *Backend:* `eventcontroller.getEventParticipants` and `exportEventParticipantsCSV` return list/export for an event.  
  - *Frontend:* `OrganizerEventDetail.jsx` has tabs for overview, analytics, participants, attendance, and inline CSV export.  
  - *Decision:* Keep CSV generation server‑side to avoid leaking raw DB structure to frontend.

- **Real‑Time Event Forum**  
  - *Design:* Per‑event discussion threads, with announcements, questions, replies, pinning, reactions.  
  - *Implementation:*  
    - Server: `forumcontroller` + Socket.io broadcasting (`join_forum`, `newForumMessage`, `forumMessageUpdated`).  
    - Client: `useForumSocket` and `Forum.jsx` subscribe to updates; `MessageList` / `MessageItem` render thread with pin/delete/react actions.  
  - *Decision:* Socket.io chosen over raw WebSocket for simpler reconnection logic and room management.

- **Discord Webhook for Organizers**  
  - *Design:* Optional auto‑posting of new events to organizer’s Discord channel.  
  - *Implementation:* Organizer profile includes `discordWebhook`; when `createEvent` succeeds, backend posts event summary to that webhook asynchronously.  
  - *Decision:* Keep webhook URL on organizer profile, not per event, to allow plug‑and‑play integration.

### 2.3 Tier C – UX, Visualization, Integrations

- **Design System + Dark/Light Theme**  
  - *Design:* Global tokens (e.g., `--prime-primary`, `--bg-surface`, rating colors) for consistent blue/black/white theme across pages.  
  - *Implementation:* `designSystem.css` defines light/dark palettes, transitions, typography; components use CSS variables instead of hard‑coded colors.  
  - *Decision:* No heavy UI framework to keep bundle slim and match custom brand spec.

- **Calendar & ICS Export**  
  - *Backend:* `eventcontroller.generateCalendarICS` returns `.ics` file for an event.  
  - *Frontend:* `EventDetails.jsx` builds Google/Outlook calendar links plus ICS download.  
  - *Decision:* ICS is generated on the fly from event details to avoid storing files.

- **Recommended Events Based on Interests & Clubs**  
  - *Backend:* `participantcontroller.getRecommendedEvents` fetches published events and sorts them by followed clubs and interest tag matches.  
  - *Frontend:* Used to display a personalized list; encourages engagement.

- **Onboarding with Interests & Followed Clubs**  
  - *Design:* On first login, participants pick interests and clubs/organizers; this configures recommendations and dashboard.  
  - *Implementation:* `Onboarding.jsx` calls `/point/user/onboarding`; backend stores `interests` and `followedClubs` on `user`.  
  - *Decision:* Store preferences directly on user document to avoid extra join collections.

---

## 3. Architecture & Design Decisions

- **RESTful modular routes:** Each domain has its own router (`authroutes`, `eventroutes`, `registrationroutes`, `preferencesroutes`, `forumroutes`, etc.) to keep concerns separated.  
- **Role‑aware middleware:** `protect` reads JWT, attaches user; role middleware checks `user.role` to guard admin/organizer endpoints.  
- **Token‑based SPA:** Frontend uses React Context for auth; tokens stored in `localStorage` and attached via Axios interceptor / fetch headers.  
- **Event‑centric modeling:** `Event` is the main aggregate: custom form, merchandise, analytics, and forum are all attached to event ID.  
- **Progressive enhancement:** Features like Discord webhook, ICS calendar, and recommended events are optional/independent; core event + registration flow works without them.

---

## 4. Setup & Local Development

### 4.1 Prerequisites

- Node.js 18+
- MongoDB Atlas connection string (or local MongoDB)

### 4.2 Clone the Repository

```bash
git clone <your-repo-url>
cd felicity-platform
```

### 4.3 Backend Setup

1. Go to backend folder:

   ```bash
   cd backend
   npm install
   ```

2. Create `.env` in `backend/` (or reuse the one you already have). Required keys:

   ```env
   mongoconnection=<your-mongodb-connection-string>
   secretbro=<jwt-secret>
   admin_email=admin@system.com
   admin_password=admin123
   EMAIL_USER=<smtp-user>
   EMAIL_PASS=<smtp-app-password>
   ```

3. Start backend in dev mode:

   ```bash
   npm run dev
   ```

   Backend runs on `http://localhost:5000` by default.

### 4.4 Frontend Setup

1. In another terminal:

   ```bash
   cd frontend
   npm install
   ```

2. Create `frontend/.env` and point it to your local backend:

   ```env
   VITE_API_BASE_URL=http://localhost:5000
   ```

3. Start the Vite dev server:

   ```bash
   npm run dev
   ```

4. Open the app at `http://localhost:5173`.

---

## 5. Deployment Notes

- **Backend (Railway)**  
  - Root directory: `backend`  
  - Build command: `npm install`  
  - Start command: `npm start`  
  - Environment variables: same as backend `.env`.  
  - CORS `allowedOrigins` must include:  
    - `http://localhost:5173` (local dev)  
    - Your Vercel URL (e.g., `https://felicity-event-management-smoky.vercel.app`).

- **Frontend (Vercel)**  
  - Root directory: `frontend`  
  - Build command: `npm run build`  
  - Output directory: `dist`  
  - Environment variable:  
    - `VITE_API_BASE_URL=https://felicity-event-management-production.up.railway.app`

---

## 6. Backend API Testing (Summary)

> For detailed endpoint list and sample bodies, you can test using Postman or any API client as follows.

- **Auth:** `/point/auth/register`, `/point/auth/login`, `/point/auth/refresh`, `/point/auth/logout`  
- **Participant:** `/point/participant/dashboard`, `/point/participant/recommended-events`  
- **Events:** `/point/events`, `/point/events/search`, `/point/events/trending`, `/point/events/:id`  
- **Registration & Tickets:** `/point/registration/register`, `/point/registration/purchase`, `/point/tickets/my`  
- **Organizer:** `/point/events/my-events`, `/point/events/:id/participants`, `/point/events/:id/analytics`  
- **Admin:** `/point/admin/create-organizer`, `/point/admin/organizer/:id/remove`, `/point/admin/organizer/:id`  
- **Forum:** `/point/forum/:eventId` (CRUD for posts/messages)

Use valid JWT tokens in `Authorization: Bearer <token>` for protected routes. The earlier backend‑only README content has been condensed into this summary to keep this document focused on architecture, features, and setup as required by the assignment.
