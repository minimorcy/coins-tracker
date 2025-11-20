# Gemini Project Analysis: CoreUI Angular Admin Template

## Project Overview

This project is based on the **CoreUI Free Admin Dashboard Template for Angular 20**. It serves as a feature-rich foundation for building responsive and modern web applications and dashboards. The user's goal is to adapt this template to create a cryptocurrency price tracker.

- **Main Technologies:**
  - **Framework:** Angular (^20.3.0)
  - **UI Library:** CoreUI for Angular (^5.5.17)
  - **Language:** TypeScript
  - **Styling:** SCSS (as per `angular.json` configuration)
  - **Charting:** Chart.js
- **Architecture:** The project follows a standard Angular structure, enhanced by CoreUI's layout and view conventions. It is configured for production builds and includes a development server with hot reloading.

## Building and Running

The following commands are available in `package.json` to manage the application lifecycle:

- **Run Development Server:**
  ```bash
  npm start
  ```
  This command runs a local development server at `http://localhost:4200` and automatically opens it (`-o` flag).

- **Build for Production:**
  ```bash
  npm run build
  ```
  This command compiles the application for production, with outputs placed in the `dist/coreui-free-angular-admin-template` directory.

- **Run Unit Tests:**
  ```bash
  npm test
  ```
  This command executes the unit tests using the Karma test runner.

## Development Conventions

- **Code Style:** The project uses TypeScript and follows standard Angular coding practices.
- **Styling:** Component styles are written in SCSS. Global styles are managed in `src/scss/styles.scss`.
- **Testing:** Unit tests are written using Jasmine and run with Karma. Test files have a `.spec.ts` extension and are located alongside the source files they test.
- **Directory Structure:** The template organizes the application into logical folders:
  - `src/app/layout`: Contains the main application layout components (header, sidebar, footer).
  - `src/app/views`: Intended for application-specific views or pages.
  - `src/app/icons`: Manages the icon set for the application.
  - `_nav.js`: A configuration file for defining the sidebar navigation items.
