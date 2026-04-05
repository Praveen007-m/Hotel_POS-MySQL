# Hotel POS - MySQL

A full-stack hotel management and point-of-sale system for handling rooms, bookings, customers, kitchen orders, billing, invoices, expenses, staff, and finance reporting.

This repository contains:

- `Hotelbackend` - Express + MySQL API
- `HotelFrontend/frontend` - React + Vite web app

## Features

- Room and availability management
- Customer management
- Booking and checkout flow
- Kitchen order management
- Add-on management
- Billing and invoice generation
- Expense tracking
- Dashboard and finance reporting
- Role-based access for `admin`, `staff`, and `kitchen`
- Automatic schema initialization and backend migrations on startup

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts

### Backend

- Node.js
- Express
- MySQL
- `mysql2`
- JWT authentication
- `pdfkit` for invoice PDF generation

## Project Structure

```text
.
|-- Hotelbackend/
|   |-- controllers/
|   |-- db/
|   |-- middleware/
|   |-- migrations/
|   |-- routes/
|   |-- services/
|   |-- uploads/
|   `-- server.js
|-- HotelFrontend/
|   |-- .env
|   `-- frontend/
|       |-- public/
|       `-- src/
`-- README.md
```

## Main Modules

- Dashboard
- Rooms
- Customers
- Booking
- Kitchen
- Calendar
- Billing
- Expense Tracker
- Staff Management
- Add-Ons
- Finance

## Prerequisites

Make sure these are installed before starting:

- Node.js 18+
- npm
- MySQL 8+ or compatible MySQL server

## Environment Variables

### Frontend

Create or update [`HotelFrontend/.env`](/c:/Users/prave/OneDrive/Desktop/HOTEL%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/HotelFrontend/.env):

```env
VITE_API_URL=http://localhost:5000/api
```

You can point this to your deployed backend if needed.

### Backend

Create `Hotelbackend/.env` with values like:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=hotel_pos

JWT_SECRET=replace_this_with_a_secure_secret

ADMIN_EMAIL=admin@hotel.com
ADMIN_PASSWORD=Admin@2025#
ADMIN_NAME=Admin
```

### Notes

- The backend accepts either `MYSQL_*` or `DB_*` variable names for database configuration.
- `CLIENT_URL` is used by the backend CORS allowlist.
- On first startup, the backend seeds a default admin user if it does not already exist.

## Installation

### 1. Install backend dependencies

```bash
cd Hotelbackend
npm install
```

### 2. Install frontend dependencies

```bash
cd HotelFrontend/frontend
npm install
```

## Running the Project

### Start the backend

```bash
cd Hotelbackend
npm run dev
```

Or:

```bash
npm start
```

Backend default URL:

```text
http://localhost:5000
```

### Start the frontend

```bash
cd HotelFrontend/frontend
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## Database Initialization

The backend automatically:

- loads the base schema from `Hotelbackend/db/schema.sql`
- runs migrations from `Hotelbackend/db/migrate.js`
- seeds the default admin user

This happens when [`server.js`](/c:/Users/prave/OneDrive/Desktop/HOTEL%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/Hotelbackend/server.js) starts successfully.

## Available Scripts

### Backend

In [`Hotelbackend/package.json`](/c:/Users/prave/OneDrive/Desktop/HOTEL%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/Hotelbackend/package.json):

- `npm run dev` - start backend with nodemon
- `npm start` - start backend with Node
- `npm run import:db` - copy a SQLite DB file for import/migration support

### Frontend

In [`HotelFrontend/frontend/package.json`](/c:/Users/prave/OneDrive/Desktop/HOTEL%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/Hotel%20POS%20-%20MySQL/HotelFrontend/frontend/package.json):

- `npm run dev` - start Vite dev server
- `npm run build` - create production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## API Overview

The backend exposes routes under `/api`, including:

- `/api/auth`
- `/api/staff`
- `/api/customers`
- `/api/bookings`
- `/api/rooms`
- `/api/kitchen`
- `/api/addons`
- `/api/billings`
- `/api/dashboard`
- `/api/expenses`
- `/api/gst`
- `/api/restaurant`
- `/api/invoice`

Health check:

```text
GET /
```

Expected response:

```json
{
  "status": "ok",
  "db": "ready"
}
```

## Authentication and Roles

The app supports role-based access:

- `admin`
- `staff`
- `kitchen`

Some frontend routes such as Finance and Staff Management are restricted to admin users.

## Invoice and Uploads

- Generated invoice PDFs are handled by the backend
- Uploaded/generated files are served from `Hotelbackend/uploads`

## Deployment Notes

- Set `VITE_API_URL` in the frontend to your deployed backend API base URL
- Set `CLIENT_URL` in the backend to your frontend domain
- The backend CORS config allows common localhost URLs and configured deployment origins
- Make sure your deployment environment has access to the MySQL database

## Troubleshooting

### Frontend cannot reach backend

- Verify `VITE_API_URL` in `HotelFrontend/.env`
- Confirm the backend is running on the expected port
- Check that `CLIENT_URL` matches the frontend origin

### Database connection fails

- Verify MySQL is running
- Confirm `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`
- Check backend startup logs for connection errors

### Unauthorized or login issues

- Ensure `JWT_SECRET` is set
- Confirm the admin user was seeded successfully

## Future Improvements

- Add automated tests for backend APIs and frontend flows
- Add Docker support for local development and deployment
- Add sample `.env.example` files for frontend and backend
- Add CI for linting and build verification

## License

This project currently does not define a custom license. Update this section if you want to publish or share it formally.
