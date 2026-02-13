# 📝 Minutes of Meeting (MOM) Management System

A comprehensive web application designed to streamline the process of scheduling meetings, recording minutes, tracking attendance, and managing action items. Built with modern web technologies, this system ensures efficient collaboration and accountability within organizations.

## ✨ Key Features

- **📊 Dashboard Overview**: Get a quick glimpse of upcoming meetings, pending action items, and recent activities.
- **📅 Meeting Management**: 
    - Schedule new meetings with detailed agendas.
    - Categorize meetings by type (e.g., HR, Tech, General).
    - Track meeting status (Scheduled, Completed, Cancelled).
- **📝 Minutes Recording**: Upload and manage meeting minutes documents securely.
- **✅ Action Items**:
    - Assign actionable tasks to staff members during or after meetings.
    - Track completion status and due dates.
- **busts_in_silhouette Attendance Tracking**: Record and monitor staff attendance for every meeting.
- **👥 Staff & User Management**: Manage staff profiles and system user roles (Admin/Standard).
- **📈 Reports**: Generate insights and reports on meeting activities.
- **🔐 Secure Authentication**: Role-based access control ensuring data security.

## 🛠️ Tech Stack

- **Frontend**: 
    - [Next.js 16](https://nextjs.org/) (App Router)
    - [React 19](https://react.dev/)
    - [Tailwind CSS v4](https://tailwindcss.com/) for styling
    - [Framer Motion](https://www.framer.com/motion/) for animations
    - [Lucide React](https://lucide.dev/) for icons
- **Backend**: 
    - Next.js API Routes (Serverless functions)
    - [Prisma ORM](https://www.prisma.io/) for database interaction
- **Database**: 
    - [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: 
    - JWT (JSON Web Tokens) with `jose` and `bcryptjs`

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
    Create a `.env` file in the root directory and add your database connection string and other secrets:
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
    # or for migrations
    # npx prisma migrate dev --name init
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
