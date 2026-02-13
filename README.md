# Felicity Platform Backend API Testing Guide

This document provides a comprehensive checklist for testing all backend API endpoints using Postman or any API client. Each endpoint includes the method, path, required headers/body, and the expected output. Use this as your testing phase before moving to frontend integration.

---

## Authentication

### 1. Register (Participant)

- **POST** `/point/auth/register`
- **Body:**  
  `{ "firstname": "Test", "lastname": "User", "email": "test@iiit.ac.in", "password": "test123", "participantType": "iiit" }`
- **Expected:**  
  200 OK, user object (no password), IIIT email required for `"iiit"` type

### 2. Login

- **POST** `/point/auth/login`
- **Body:**  
  `{ "email": "test@iiit.ac.in", "password": "test123" }`
- **Expected:**  
  200 OK, `{ token, refreshToken, user }`

### 3. Refresh Token

- **POST** `/point/auth/refresh`
- **Body:**  
  `{ "refreshToken": "<refreshToken>" }`
- **Expected:**  
  200 OK, `{ token }`

### 4. Logout

- **POST** `/point/auth/logout`
- **Header:**  
  `Authorization: Bearer <token>`
- **Expected:**  
  200 OK, `{ msg: "Logged out successfully" }`

---

## Participant Onboarding & Profile

### 5. Complete Onboarding

- **POST** `/point/participant/onboarding`
- **Header:**  
  `Authorization: Bearer <token>`
- **Body:**  
  `{ "interests": ["music", "coding"], "followedClubs": ["<clubId>"] }`
- **Expected:**  
  200 OK, onboarding fields updated

### 6. Update Profile

- **PUT** `/point/participant/profile`
- **Header:**  
  `Authorization: Bearer <token>`
- **Body:**  
  `{ "firstname": "New", "interests": ["sports"] }`
- **Expected:**  
  200 OK, updated user object

### 7. Get Dashboard

- **GET** `/point/participant/dashboard`
- **Header:**  
  `Authorization: Bearer <token>`
- **Expected:**  
  200 OK, `{ upcoming, normalHistory, merchandiseHistory, completed, cancelledRejected }`

### 8. Get Recommended Events

- **GET** `/point/participant/recommended-events`
- **Header:**  
  `Authorization: Bearer <token>`
- **Expected:**  
  200 OK, array of events sorted by preferences

---

## Event Management

### 9. Create Event (Organizer)

- **POST** `/point/events/`
- **Header:**  
  `Authorization: Bearer <organizerToken>`
- **Body:**  
  `{ "eventName": "Hackathon", ... }`
- **Expected:**  
  201 Created, event object

### 10. Edit Event (Organizer/Admin)

- **PUT** `/point/events/:id` (organizer)  
  `/point/admin/event/:id` (admin)
- **Header:**  
  `Authorization: Bearer <token>`
- **Body:**  
  `{ "eventDescription": "Updated desc" }`
- **Expected:**  
  200 OK, updated event object

### 11. Delete Event (Organizer/Admin)

- **DELETE** `/point/events/:id` (organizer)  
  `/point/admin/event/:id` (admin)
- **Header:**  
  `Authorization: Bearer <token>`
- **Expected:**  
  200 OK, `{ message: "Event deleted" }`

### 12. Search Events

- **GET** `/point/events/search?query=Hackathon&eventType=normal`
- **Expected:**  
  200 OK, array of events

### 13. Trending Events

- **GET** `/point/events/trending`
- **Expected:**  
  200 OK, array of trending events

---

## Registration & Tickets

### 14. Register for Event

- **POST** `/point/registration/normal`
- **Header:**  
  `Authorization: Bearer <token>`
- **Body:**  
  `{ "eventId": "<eventId>", "formData": { ... } }`
- **Expected:**  
  201 Created, ticket object, email sent

### 15. Purchase Merchandise

- **POST** `/point/registration/merchandise`
- **Header:**  
  `Authorization: Bearer <token>`
- **Body:**  
  `{ "eventId": "<eventId>", "itemName": "...", ... }`
- **Expected:**  
  201 Created, ticket object, email sent

---

## Clubs

### 16. Create Club

- **POST** `/point/clubs/`
- **Header:**  
  `Authorization: Bearer <adminToken>`
- **Body:**  
  `{ "name": "Music Club", ... }`
- **Expected:**  
  201 Created, club object

### 17. Get Clubs

- **GET** `/point/clubs/`
- **Expected:**  
  200 OK, array of clubs

---

## Organizer Analytics

### 18. Get Analytics

- **GET** `/point/organizer-analytics/`
- **Header:**  
  `Authorization: Bearer <organizerToken>`
- **Expected:**  
  200 OK, analytics and summary

### 19. Export Participants CSV

- **GET** `/point/organizer-analytics/export/:eventId`
- **Header:**  
  `Authorization: Bearer <organizerToken>`
- **Expected:**  
  200 OK, CSV file download

### 20. Mark Attendance

- **PUT** `/point/organizer-analytics/attendance/:ticketId`
- **Header:**  
  `Authorization: Bearer <organizerToken>`
- **Body:**  
  `{ "attended": true }`
- **Expected:**  
  200 OK, updated ticket

---

## Admin

### 21. Create Organizer

- **POST** `/point/admin/create-organizer`
- **Header:**  
  `Authorization: Bearer <adminToken>`
- **Body:**  
  `{ "firstname": "Org", "lastname": "One", "email": "org1@example.com" }`
- **Expected:**  
  200 OK, organizer object, credentials email sent

### 22. Password Reset (Organizer)

- **POST** `/point/password/request-reset`
- **Body:**  
  `{ "email": "org1@example.com" }`
- **Expected:**  
  200 OK, request sent

### 23. Admin View/Reset Passwords

- **GET** `/point/password/requests`  
  **POST** `/point/password/reset`  
  **POST** `/point/password/reject`
- **Header:**  
  `Authorization: Bearer <adminToken>`
- **Expected:**  
  200 OK, request list or reset confirmation

---

## Security & Validation

- **Test duplicate registration:** Should return error
- **Test registration after deadline/limit:** Should return error
- **Test IIIT email enforcement:** Only `@iiit.ac.in` for IIIT participants
- **Test token expiry/refresh:** Expired tokens should be rejected, refresh should work
- **Test logout:** Blacklisted tokens should be rejected

---

**Test all endpoints with valid and invalid data.**  
**Expected output:** Correct status codes, error messages, and data as described above.  
If all pass, backend is ready for frontend integration!
