# Nothipath

Live Application: https://nothipath-one.vercel.app/

## Overview
Nothipath is a frontend-only web application built for the AI DevFest 2026 Vibe Coding Contest. It is designed to help users prepare, validate, and compile tender document packages based on a standardized JSON requirement list. The application operates entirely in the browser to ensure speed, privacy, and compliance with strict contest rules.

## Core Features
* Document Requirement Parsing: Upload and parse tender requirements from a structured JSON file.
* PDF Processing and Validation: Upload multiple PDF documents, extract page counts, and calculate SHA-256 hashes via the Web Crypto API to prevent duplicate uploads.
* Expiry Date Validation: Verify that submitted documents are valid and meet the submission deadline criteria.
* Client-Side PDF Generation: Merge validated PDF documents into a single comprehensive package. The system automatically generates a dynamic cover page and applies paginated footers across all documents using pdf-lib.
* Bilingual Interface: Native toggle support for both English and Bangla languages.
* Theme Support: Persistent Light and Dark modes integrated via Tailwind CSS and browser localStorage.

## Bonus Features Completed
* Intelligent Auto-Match: Automatically suggests and assigns uploaded documents to requirements based on filename keyword matching.
* Export CSV Checklist: One-click export of the entire matched document checklist (including statuses and expiry dates) to a CSV file.
* Dynamic Index Page: Generates an automatic Index Page right after the cover page, showing the exact page numbers where each document begins inside the final PDF package.
* Secure AI Assistant: A built-in AI helper using Groq (LLaMA-3 70B OSS equivalent) that securely accepts the user's own API key via the browser UI to offer tailored tender submission advice, perfectly fulfilling contest constraints.
* Safe Error Handling: Gracefully catches corrupted or password-protected PDFs, showing clean error messages instead of crashing the application.

## Architecture and Technology Stack
The application follows a strict frontend-only architecture. There is no backend, no external database, and no serverless functions. All document processing, state management, and file merging happen client-side.

* Framework: React 18 powered by Vite
* Language: TypeScript
* Styling: Tailwind CSS
* Icons: lucide-react
* Document Processing: pdf-lib for PDF manipulation
* Cryptography: Native Web Crypto API for secure SHA-256 hashing

## AI Tools and Models Used
This project was actively vibe-coded and developed utilizing the following AI models and tools to accelerate development and ensure code quality:
* Antigravity
* Cursor
* ChatGPT
* Gemini

## Local Setup Instructions
1. Clone the repository to your local machine.
2. Run 'npm install' to install required dependencies.
3. Run 'npm run dev' to start the local development server.
4. Access the application at the provided localhost port.
5. Build for production using 'npm run build'.

## Author Information
* Name: Labony Sur
* Student ID: 232-15-473
* Email: sur2305101473@diu.edu.bd
* University: Daffodil International University (DIU)

## License
This project is open source and available under the MIT License.
