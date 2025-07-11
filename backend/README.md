# Radix Tribes Backend

This is the Node.js and Express backend server for the Radix Tribes game.

## Setup

1.  **Install Dependencies:**
    Navigate to this `backend` directory in your terminal and run:
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Create a `.env` file in this directory by copying the `.env.sample` file.
    ```bash
    cp .env.sample .env
    ```
    The `JWT_SECRET` is pre-filled with a random string. You can change this to any secret string you like.

## Running the Server

To start the server, run the following command from within the `backend` directory:

```bash
npm start
```

By default, the server will run on **port 3001**.

The frontend application is already configured to send API requests to this address. Ensure both the frontend (your main application) and this backend are running at the same time for the game to work.
