# 📝 Minutes of Meeting (MOM) Management System

A comprehensive, multi-tenant web application designed to streamline the process of scheduling meetings, recording minutes, tracking attendance, and managing action items. Built with the latest web technologies, this system ensures efficient collaboration, accountability, and administrative oversight within organizations.

## ✨ Key Features

### 🏢 Super Admin & Multi-Tenancy
- **Centralized Dashboard**: Dedicated super admin panel to monitor system health and statistics.
- **Tenant Management**: Seamless handling of multiple companies within a single deployment.
- **User Administration**: Centralized control to manage users across different organizations.
- **🛡️ Audit Logs**: Comprehensive tracking of critical system actions (logins, user changes, settings updates) for security and compliance.
- **Registration Workflow**: Streamlined company registration and approval process.

### � Advanced Security & MFA
- **Multi-Factor Authentication (MFA/2FA)**: Robust secondary authentication using Time-Based One-Time Passwords (TOTP).
- **Authenticator App Support**: Compatible with Google Authenticator, Authy, and Microsoft Authenticator.
- **Secure Sessions**: Enhanced session management ensuring high-security standards for administrative actions.

### �📅 Meeting Management
- **Dashboard Overview**: Instant visibility into upcoming meetings, pending tasks, and recent activities.
- **Smart Scheduling**: Schedule meetings with detailed agendas, dates, and dynamic **Meeting Types** (e.g., HR, Tech, General).
- **Status Tracking**: Monitor meetings through their lifecycle (Scheduled, Completed, Cancelled).
- **MOM Uploads**: Securely upload and store Minutes of Meeting documents.

### ✅ Action Items & Accountability
- **Task Assignment**: Assign actionable tasks to specific staff members directly from meeting records.
- **Progress Tracking**: Monitor completion status and due dates for all assigned action items.
- **Attendance**: Record and verify staff presence for every meeting.

### 👥 Staff & Access Control
- **Role-Based Access**: Granular permissions for Super Admins, Company Admins, and Standard Members.
- **Staff Profiles**: Detailed profiles with contact information, department association, and 2FA status.
- **Self-Service Password Reset**: Administrator-managed password reset workflows with modern UI.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Theme**: [Next-Themes](https://github.com/pacocoursey/next-themes) for Dark/Light mode support

### Backend
- **Runtime**: Next.js Server Actions & API Routes
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/) (v6+)

### Security & Validations
- **Authentication**: Custom JWT implementation with `jose`
- **Encryption**: `bcryptjs` for secure password hashing
- **Validation**: Strict schema validation ensures data integrity

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database instance
- npm or yarn package manager

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/mom_management.git
    cd mom_management
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and configure your secrets:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mom_db?schema=public"
    JWT_SECRET="your-super-secret-jwt-key"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Database Setup:**
    Sync your Prisma schema with the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run postinstall`: Generates Prisma client.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
