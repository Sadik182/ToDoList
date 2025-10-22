# Authentication Setup Guide

This guide will help you set up the authentication system for your MyTodo application.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Basic understanding of Next.js and MongoDB

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/my-todo
MONGODB_DB=my-todo

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Getting a NextAuth Secret

Generate a secure secret key for NextAuth:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Database Setup

The authentication system will automatically create the following collections in your MongoDB database:

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed with bcrypt),
  createdAt: Date
}
```

### Updated Todo Collection

```javascript
{
  _id: ObjectId,
  text: String,
  completed: Boolean,
  date: String (YYYY-MM-DD),
  userId: String (references user._id),
  createdAt: Date
}
```

### Updated Notes Collection

```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  date: String (YYYY-MM-DD),
  stage: String (Idea | Draft | In Progress | Reviewed | Completed),
  userId: String (references user._id),
  createdAt: Date
}
```

## Features Added

### 🔐 Authentication System

- **User Registration**: Create new accounts with email and password
- **User Login**: Secure login with credentials
- **Password Hashing**: Passwords are securely hashed using bcrypt
- **Session Management**: JWT-based sessions with NextAuth
- **Protected Routes**: Automatic redirection for unauthenticated users

### 🛡️ Security Features

- **Route Protection**: All main pages require authentication
- **User Data Isolation**: Users can only see their own todos and notes
- **API Security**: All API endpoints verify user authentication
- **Password Validation**: Minimum 6 characters required
- **Email Validation**: Proper email format validation

### 🎨 User Interface

- **Login Page**: Clean, responsive login form
- **Registration Page**: User-friendly signup form with validation
- **Updated Navbar**: Shows user name and logout option
- **Loading States**: Proper loading indicators during authentication
- **Error Handling**: User-friendly error messages

## How to Use

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Access the Application

- Visit `http://localhost:3000`
- You'll be redirected to the login page if not authenticated

### 3. Create an Account

- Click "Sign Up" in the navbar
- Fill in your details and create an account
- You'll be automatically logged in after registration

### 4. Use the Application

- All your todos and notes are now private to your account
- Other users cannot see your data
- Your data persists across sessions

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints (login, logout, etc.)

### Protected Endpoints (require authentication)

- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]` - Delete todo
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts
│   │       └── register/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── components/
│       ├── ProtectedRoute.tsx
│       └── SessionProvider.tsx
├── lib/
│   └── auth.ts
├── middleware.ts
└── types/
    └── next-auth.d.ts
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Make sure you're logged in and the session is valid
2. **Database connection issues**: Verify your MongoDB URI is correct
3. **NextAuth secret missing**: Ensure NEXTAUTH_SECRET is set in your environment
4. **Type errors**: Make sure all dependencies are installed with `npm install`

### Reset Database

If you need to reset the database:

```bash
# Connect to MongoDB and drop collections
mongo
use my-todo
db.users.drop()
db.todos.drop()
db.notes.drop()
```

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- Sessions are JWT-based and stateless
- All API routes verify user authentication
- User data is isolated by userId
- Environment variables should never be committed to version control

## Next Steps

Consider adding these features:

- Email verification
- Password reset functionality
- Social login (Google, GitHub, etc.)
- User profile management
- Two-factor authentication
- Rate limiting for API endpoints
