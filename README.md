# Echelon - Employee Hierarchy Management System

A modern, cloud-hosted employee management system built with React and Node.js, featuring role-based access control, interactive organizational hierarchy visualization, and comprehensive employee data management.

## Live Demo

**URL**: (https://echelon-epiuse-8bc39b155203.herokuapp.com/)

**Demo Credentials**:
- Email: `admin@echelon.com`
- Password: `Admin123!`

## Features

- **Employee Management**: Full CRUD operations with role-based permissions
- **Interactive Hierarchy**: Drag-and-drop organizational tree visualization
- **Role-Based Access Control**: Four permission levels (Employee, Manager, HR, Admin)
- **Gravatar Integration**: Automatic profile pictures from email addresses
- **Advanced Search & Filtering**: Find employees by name, role, email, or employee number
- **Password Management**: Secure authentication with password reset functionality
- **Responsive Design**: Mobile-friendly Material-UI interface
- **Real-time Updates**: Live data synchronization across users

## Technology Stack

### Frontend
- **React 18** - Modern functional components with hooks
- **Material-UI v7** - Professional component library
- **React DnD** - Drag-and-drop functionality
- **D3.js** - Tree visualization and layout
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Sequelize ORM** - Database modeling and queries
- **PostgreSQL** - Relational database
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Deployment
- **Heroku** - Cloud platform deployment
- **Heroku Postgres** - Managed database service

## Architecture

```
┌─────────────────┐    REST API     ┌─────────────────┐    SQL    ┌─────────────────┐
│   React Client  │ ──────────────► │  Express Server │ ────────► │  PostgreSQL DB  │
│   (Frontend)    │ ◄────────────── │   (Backend)     │ ◄──────── │                 │
└─────────────────┘                 └─────────────────┘           └─────────────────┘
```

## Permission Levels

| Role | Permissions |
|------|-------------|
| **Employee** | View/edit own profile, view colleagues with same manager |
| **Manager** | All Employee permissions + manage direct subordinates |
| **HR** | All Manager permissions + create employees, manage non-admin users |
| **Admin** | Full system access, manage all employees and permissions |

## Getting Started

### Prerequisites
- Node.js 24 and npm
- PostgreSQL database
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Cyb3rC0de7/echelon.git
   cd echelon
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   
   Create `server/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/echelon_db
   JWT_SECRET=your-secret-jwt-key
   NODE_ENV=development
   PORT=5000
   ```

4. **Set up the database**
   ```bash
   # Create admin user
   npm run create-admin
   
   # Optional: Seed with sample data (WARNING! - Will overwrite database)
   npm run seed
   ```

5. **Run the application**

   **Entire App**
   ```bash
   npm run dev
   ```

   **OR**
   
   **Backend** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd client
   npm start
   ```
   
   Open http://localhost:3000 in your browser.

## Project Structure

```
echelon/
├── client/                                                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/                                       # React components
│   │   ├── services/                                         # API services
│   │   └── App.jsx                                           # Main application
│   └── package.json
├── server/                                                   # Node.js backend
│   ├── config/                                               # Database configuration
│   ├── middleware/                                           # Authentication & authorization
│   ├── models/                                               # Sequelize models
│   ├── routes/                                               # API endpoints
│   ├── scripts/                                              # Database setup scripts
│   └── index.js                                              # Server entry point
├── docs/                                                     # Documentation
│   ├── Echelon Technical Document - Qwinton Knocklein.pdf    # Technical documentation
│   └── Echelon User Guide - Qwinton Knocklein.pdf            # User manual
└── README.md
```

## Available Scripts

### Main Directory (`/`)
```bash
npm run dev          # Start development server and frontend with concurrently and nodemon
npm run build        # Build project for production
npm start            # Start frontend and backend in production mode
npm run seed         # Populate with sample data
npm run create-admin # Create default admin user
```

### Backend (`/server`)
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Frontend (`/client`)
```bash
npm run dev         # Start development frontend
npm run build       # Build for production
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user info

### Employee Management
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/hierarchy/tree` - Get organization tree

### Admin Operations
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/export/:format` - Export data (CSV/JSON)

## Security Features

- **JWT Authentication** with 24-hour expiration
- **bcrypt Password Hashing** with salt rounds
- **Role-based Authorization** middleware
- **Input Validation** and sanitization
- **SQL Injection Protection** via ORM
- **Default Password Generation** for new employees

## Key Components

### Frontend Components
- **App.jsx** - Authentication wrapper and routing
- **EmployeeList.jsx** - Data table with CRUD operations
- **EmployeeForm.jsx** - Employee creation/editing with role-based fields
- **HierarchyView.jsx** - Interactive D3.js tree visualization
- **Login.jsx** - Authentication interface

### Backend Components
- **Employee Model** - Sequelize model with self-referencing relationships
- **Auth Middleware** - JWT verification and role-based permissions
- **API Routes** - RESTful endpoints for all operations

## Deployment

### Heroku Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-production-jwt-key
   ```

3. **Deploy**
   ```bash
   git push heroku main
   heroku run npm run setup-db --app your-app-name
   heroku run npm run create-admin --app your-app-name
   ```

## Documentation

- **[Technical Documentation](docs/Echelon Technical Document - Qwinton Knocklein.pdf)** - Architecture, design patterns, and technology choices
- **[User Guide](docs/Echelon User Guide - Qwinton Knocklein.pdf)** - Complete end-user manual

## License

This project is created for educational purposes as part of a technical assessment for EPI-USE Africa.

## Author

**Qwinton Knocklein**
- GitHub: [@Cyb3rC0de7](https://github.com/Cyb3rC0de7)
- Email: knocklein.qi@gmail.com

## Acknowledgments

- EPI-USE Africa for the technical assessment opportunity
- Material-UI team for the excellent component library
- D3.js community for visualization capabilities
- React and Node.js communities for robust frameworks

---

**Built with ❤️ for EPI-USE Africa Technical Assessment**
