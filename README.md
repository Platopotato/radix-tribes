# Radix Tribes - Full Stack Application

This is the full-stack monorepo for the Radix Tribes game, containing both the React frontend and the Node.js backend.

## Requirements
- Node.js (v18 or higher)
- npm

## Quick Start

### 1. Install All Dependencies

This command will install the dependencies for both the root project (Vite, React) and the backend (Express).

```bash
npm run install-all
```

### 2. Set Up Backend Environment

Navigate into the `backend` directory and create your `.env` file.

```bash
cd backend
cp .env.sample .env
cd .. 
```
You can edit the `backend/.env` file to change the `JWT_SECRET` if you wish, but it comes with a secure default.

### 3. Running in Development Mode

To run the frontend and backend concurrently for development, you need two separate terminals.

**In Terminal 1 (from the root directory): Start the Backend Server**
```bash
npm run start
```
This will start the Node.js server on `http://localhost:3001`.

**In Terminal 2 (from the root directory): Start the Frontend Dev Server**
```bash
npm run dev
```
This will start the Vite development server, typically on `http://localhost:5173`. Open this URL in your browser. The Vite server will automatically proxy any API requests (to `/api/...`) to your backend server.

### 4. Building for Production

To create an optimized production build of the frontend, run the following command from the root directory:

```bash
npm run build
```
This will compile the frontend into a `dist` folder in the root directory.

### 5. Running in Production Mode

After building the application, you can start the server in production mode. This single command will run the Node.js server, which will serve both the API and the compiled frontend files.

```bash
npm run start
```

Now, you can access the entire application by navigating to `http://localhost:3001` in your browser.
