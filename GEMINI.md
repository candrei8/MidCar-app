# GEMINI.md: MidCar Project

This document provides a comprehensive overview of the MidCar project, intended to be used as a context for AI-powered development assistance.

## Project Overview

MidCar is a premium, feature-rich web application designed for managing a used car dealership. It's built with a modern technology stack and features a sophisticated, dark-themed user interface.

- **Purpose**: To provide a comprehensive suite of tools for dealership management, including a real-time dashboard, a customer relationship management (CRM) system, vehicle inventory management, chatbot analytics, and reporting.
- **Frontend**: A Next.js 14 application using the App Router, written in TypeScript.
- **Styling**: Styled with Tailwind CSS and a custom, premium dark theme. UI components are based on shadcn/ui.
- **Data Visualization**: Uses Recharts for charts and graphs.
- **Backend**: The application is intended to be connected to a Supabase backend for database, authentication, and storage. The API for the AI chatbot is intended to be the Claude API.
- **Architecture**: The project follows a feature-based structure within the `src/app/(dashboard)` directory, with separate modules for each major feature like CRM, Inventory, etc. The root of the application redirects to the `/dashboard` page.

## Building and Running

The project is managed with npm. Key commands are defined in `package.json`.

-   **Install Dependencies**:
    ```bash
    npm install
    ```
-   **Run in Development Mode**:
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

-   **Build for Production**:
    ```bash
    npm run build
    ```
    This command creates a static export of the application in the `out` directory, as configured in `next.config.js`.

-   **Start Production Server**:
    ```bash
    npm run start
    ```
-   **Linting**:
    ```bash
    npm run lint
    ```

## Development Conventions

-   **Language**: The project is written in TypeScript.
-   **Styling**: Adheres to the custom theme defined in `tailwind.config.ts`. New components should use these theme colors and styles to maintain a consistent look and feel.
-   **File Structure**:
    -   All main application pages are located within the `src/app/(dashboard)` directory group.
    -   Reusable components are organized by feature under `src/components`.
    -   Shared UI components from `shadcn/ui` are in `src/components/ui`.
    -   Utility functions, constants, and mock data are in the `src/lib` directory.
    -   TypeScript types are defined in the `src/types` directory.
-   **Routing**: The application uses the Next.js App Router. The main pages are grouped under the `(dashboard)` route group, which likely contains a shared layout for the application.
-   **UI/UX**: The application has a strong focus on a premium user experience, with a dark theme, custom animations, and a responsive design.
