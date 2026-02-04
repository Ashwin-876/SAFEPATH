# SafePath AI: Advanced Navigation & Assistance System

SafePath AI is a cutting-edge web application designed to assist visually impaired individuals with safe navigation, real-time object detection, and emergency support. Leveraging Gemini 1.5 Flash for scene analysis and Web Speech API for voice interactions, SafePath provides a comprehensive safety net for independent mobility.

## 🚀 Features

- **Object Detection**: Real-time identification of obstacles, hazards, and safe paths using the camera.
- **Indoor Navigation**: QR code-based step-by-step guidance for complex indoor environments.
- **Voice Assistant**: Full voice control for navigation, status updates, and emergency actions.
- **Emergency Mode**: One-touch SOS and automated caregiver alerts.
- **Caregiver Portal**: Remote monitoring and connection status.
- **Accessibility First**: High-contrast UI, spatial audio feedback, and haptic vibration support.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (Version 16 or higher recommended)
- [npm](https://www.npmjs.com/) (Usually installed with Node.js)

## ⚙️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Ashwin-876/SAFEPATH.git
    cd SAFEPATH
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file in the root directory and add your Google Gemini API Key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

## 🏃‍♂️ Running the Application

To start the development server locally:

1.  **Run the command:**
    ```bash
    npm run dev
    ```

2.  **Open in Browser:**
    The terminal will show the local URL (usually `http://localhost:5173` or similar). Open this link in your web browser.
    *Note: Microphone and Camera permissions are required for full functionality.*

## 🛑 Stopping the Server

To stop the running application:
1.  Go to the terminal where the app is running.
2.  Press `Ctrl + C`.
3.  Confirm termination if prompted (type `y` and press Enter).

---
*Built with React, Vite, TailwindCSS, and  Api.*