# Direct Debit Mandate System

Secure, AI-assisted web application for collecting Direct Debit Mandates.

## Getting Started

1.  **Install Dependencies**:
    `ash
    npm install
    `

2.  **Database Setup**:
    `ash
    npx prisma migrate dev --name init
    `

3.  **Run Development Server**:
    `ash
    npm run dev
    `

4.  **Admin Dashboard**:
    Open [http://localhost:3000/admin](http://localhost:3000/admin) to generate mandate links.

## Features implemented

-   **Admin Dashboard**: Create customers and generate secure, single-use links.
-   **Secure Link System**: Token-based access to forms with expiry.
-   **Digital Form**: React Hook Form with Zod validation.
    -   Auto-population of customer name.
    -   Bank selection dropdown.
    -   Digital signature pad.
-   **PDF Generation**: Auto-generates official PDF upon submission.
-   **Security**:
    -   AES-256 encryption for sensitive data (Ghana Card, Account Numbers).
    -   Token invalidation after submission.

## Project Structure
-   /app: Next.js pages and API routes.
-   /components: Reusable UI components.
-   /lib: Utilities (encryption, PDF, database).
-   /prisma: Database schema.
-   /services: Business logic layer.
