# Reminder Web App

A full-stack reminder application built with React, Tailwind CSS, Node.js, Express, and MySQL.

## Prerequisites

- Node.js installed
- MySQL installed and running

## Setup Instructions

### 1. Database Setup

1. Open your MySQL client (Workbench, Command Line, etc.).
2. Run the commands found in `schema.sql` to create the database and table.

### 2. Backend Setup

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Open `.env` file.
   - Update `DB_USER` and `DB_PASSWORD` with your MySQL credentials.
4. Start the server:
   ```bash
   npm run dev
   ```
   The server runs on `http://localhost:5000`.

### 3. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Features

- Add reminders with title, description, and due date.
- View list of reminders.
- Mark reminders as completed.
- Delete reminders.
- Responsive design with Tailwind CSS.
