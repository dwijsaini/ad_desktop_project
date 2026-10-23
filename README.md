# Macro Studio

Macro Studio is a no-code automation tool for macOS that allows users to create and run ordered sequences of actions to automate repetitive tasks.

## Features

- **Macro Management**: Create, edit, and delete macros.
- **Action Library**:
  - **Open Application**: Launch any macOS application by name or path.
  - **Open Website**: Open a specific URL in the default web browser.
  - **Run Terminal Command**: Execute shell commands directly from the app.
  - **Wait**: Pause execution for a specified duration.
  - **Show Notification**: Display system notifications.
- **Persistence**: Macros are saved locally on your machine.
- **Visual Editor**: Easy-to-use interface for ordering and configuring steps.

## Setup & Installation

### Development
1. Clone the repository.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Launch Electron (in a separate terminal if necessary):
   \`\`\`bash
   VITE_DEV_SERVER_URL=http://localhost:5173/ npx electron .
   \`\`\`

### Building the App
To build the distributable macOS DMG:
\`\`\`bash
npm run build
\`\`\`
The resulting DMG will be located in the `release/` folder.

## Security Notes

- **Terminal Commands**: Commands are executed using `child_process.exec`. Please be cautious when creating macros that run terminal commands, as they have the permissions of the user running the app.
- **Renderer Isolation**: The application uses Electron's `contextIsolation` and a preload script to ensure the renderer process cannot access privileged Node.js APIs directly.
- **Unsigned DMG**: The provided DMG is unsigned. macOS may show a security warning upon launch. To open it, right-click the app and select "Open" from the menu.

## Project Structure

- `src/main.ts`: Main Electron process (Window management, IPC handlers, Action execution).
- `src/preload.ts`: Preload script for secure communication.
- `src/renderer/`: React-based user interface.
- `src/types.ts`: Type definitions for Macros and Actions.
