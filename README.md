# Blitz.new

Blitz.new is an AI-powered development platform that transforms natural language descriptions into fully functional websites. It leverages advanced AI technology to handle both frontend generation and backend logic, providing a seamless "Describe, Generate, Deploy" experience.

## Key Features

- AI-Powered Generation: Create entire websites and APIs from simple text prompts.
- Real-time Building: Watch your application come to life with live previews and real-time build processes.
- No-code Design: Focus on your vision while the platform handles the underlying technical complexity.
- Full-stack Support: Capable of generating both React-based frontend projects and Node.js-based backend APIs.
- Integrated Code Editor: Directly modify the generated code using an embedded Monaco editor.

## Technology Stack

### Frontend
- Framework: React (with TypeScript)
- Build Tool: Vite
- Styling: Tailwind CSS
- Icons: Lucide React
- Components: WebContainer API for browser-side execution, Monaco Editor for code editing.

### Backend
- Runtime: Node.js (with TypeScript)
- Framework: Express
- AI Integration: Google Generative AI (Gemini)
- Environment Management: Dotenv

## Prerequisites

Before setting up the project locally, ensure you have the following installed:
- Node.js (version 18 or higher recommended)
- npm (Node Package Manager)
- A Google Gemini API Key

## Local Setup Guide

### 1. Clone the Repository

Clone the project to your local machine:
```bash
git clone <repository-url>
cd blitz.new
```

### 2. Backend Configuration

Navigate to the backend directory and set up the environment:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on the `.env.example` file:
```bash
cp .env.example .env
```
Open the `.env` file and provide your Gemini API key and desired port:
```env
GEMINI_API_KEY="your_actual_gemini_api_key"
PORT=3000
```

### 3. Frontend Configuration

Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```

### 4. Running the Project

#### Start the Backend
From the root of the project:
```bash
cd backend
npm install
npm run dev
```
> [!IMPORTANT]
> For local development, ensure the frontend is configured to talk to your local backend (usually `http://localhost:3000`) by setting `VITE_BACKEND_URL` in your environment or `config.ts`.

#### Start the Frontend
Open a new terminal window and from the root of the project:
```bash
cd frontend
npm run dev
```
The frontend should now be running at `http://localhost:5173` (or the port specified by Vite).

## Running with Docker

You can also run the entire application using Docker Compose for a consistent environment.

### 1. Configure Backend Environment
Ensure you have a `.env` file in the `backend` directory with your `GEMINI_API_KEY`.

### 2. Launch Services
From the root directory, run:
```bash
docker-compose up --build -d
```

### 3. Access the Application
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### 4. Stop Services
To stop the running containers, use:
```bash
docker-compose down
```

## Project Structure

```text
blitz.new/
├── backend/               # Express backend application
│   ├── src/               # Backend source code
│   ├── .env.example       # Example environment variables
│   └── package.json       # Backend dependencies and scripts
├── frontend/              # Vite-React frontend application
│   ├── src/               # Frontend source code
│   │   ├── pages/         # Page components (Home, Builder)
│   │   └── components/    # Reusable UI components
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies and scripts
└── README.md              # Project documentation
```

## Contributing

Contributions are welcome. Please follow the existing code style and ensure all new features are properly tested.
