# MOM Management System

A comprehensive web application for managing Minutes of Meeting (MOM), attendance, staff, and overall meeting workflows. This system streamlines the process of scheduling meetings, tracking participation, and storing critical documentation.

## 🚀 Features

-   **Meeting Management**: effortlessly schedule, update, and organize meetings with detailed descriptions and types.
-   **Attendance Tracking**: Precise tracking of staff attendance (Present/Absent) with remarks for every meeting.
-   **MOM Uploads**: Securely upload and retrieve Minutes of Meeting documents directly within the meeting details.
-   **Staff Management**: Maintain a centralized database of staff members, including contact details and roles.
-   **Dashboard & Reports**: Visual insights into meeting statistics, attendance trends, and recent activities.
-   **User Roles**: Role-based access control (Admin, User) for secure data management.
-   **Meeting Types**: Customizable meeting categories (e.g., Board Meeting, Team Standup) for better organization.

## 🛠️ Tech Stack

This project is built using modern web technologies for performance and scalability:

-   **Frontend & Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Authentication**: JWT-based auth (using [jose](https://github.com/panva/jose) and [bcryptjs](https://github.com/dcodeIO/bcrypt.js))

## 📦 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

-   **Node.js** (v18 or higher recommended)
-   **PostgreSQL** (Ensure a local or cloud instance is running)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd mom_management
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory and add your database connection string and other secrets:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mom_db?schema=public"
    # Add other environment variables as needed (e.g., JWT_SECRET)
    ```

4.  **Database Setup**:
    Push the Prisma schema to your database:
    ```bash
    npx prisma db push
    ```
    *(Optional) Seed the database if a seed script is provided in `package.json`.*

5.  **Run the Application**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

-   `/app`: Main application routes and pages (Next.js App Router).
-   `/components`: Reusable UI components.
-   `/lib`: Utility functions and shared logic.
-   `/prisma`: Database schema and migrations.
-   `/public`: Static assets.
-   `/scripts`: Maintenance and utility scripts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
