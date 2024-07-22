# Task Manager Backend

This project is the backend for the Task Manager application. It provides secure endpoints for managing tasks, user authentication, and rate limiting for API requests.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm installed. You can download them from [here](https://nodejs.org/).
- A Supabase account for database management. You can sign up [here](https://supabase.io/).

### Installation

1. Clone the repo:
    ```sh
    git clone https://github.com/priyankaj04/TMS-backend.git
    ```
2. Navigate to the project directory:
    ```sh
    cd your-repo-name
    ```
3. Install NPM packages:
    ```sh
    npm install
    ```

### Available Scripts

In the project directory, you can run:

#### `npm start`

Starts the server in production mode.

#### `npm run dev`

Starts the server in development mode with nodemon for automatic restarts.

## Features

- **Protected Endpoints**: All endpoints are secured using JSON Web Tokens (JWT).
- **Google OAuth**: Users can authenticate using their Google accounts.
- **Supabase Integration**: Used for managing the database.
- **Rate Limiting**: Limits to 5 API logins and signups within 10 minutes to prevent abuse.
- 
## Database structure

<img width="655" alt="Screenshot 2024-07-22 at 12 10 04 PM" src="https://github.com/user-attachments/assets/5ac2d2b8-4115-4e11-aba1-fbd297121a22">

## Tech Stack

- **Express.js**: A minimal and flexible Node.js web application framework.
- **JWT**: Used for securing endpoints with JSON Web Tokens.
- **Supabase**: A backend-as-a-service providing a PostgreSQL database.
- **Rate Limiting**: Implemented to control the rate of requests.
- **bcrypt**: Used for hashing passwords to ensure secure storage.

## Learn More

To learn more about the technologies used, check out the following resources:

- [Express.js Documentation](https://expressjs.com/)
- [JSON Web Tokens](https://jwt.io/)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Documentation](https://supabase.io/docs/)

## License

Distributed under the MIT License. See `LICENSE` for more information.
