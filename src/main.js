import { app, BrowserWindow, ipcMain, shell, Notification, dialog, desktopCapturer, nativeTheme } from 'electron';
import path from 'path';
import Store from 'electron-store';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execPromise = promisify(exec);
const store = new Store();

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  win.on('closed', () => {
    console.log('Window closed');
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Theme listener for OS theme changes (Lecture 11)
nativeTheme.on('changed', () => {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('theme-changed', theme);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Macro Persistence Handlers
ipcMain.handle('get-macros', () => {
  return store.get('macros', []);
});

ipcMain.handle('save-macros', (_event, macros) => {
  store.set('macros', macros);
  return { success: true };
});

// Native Dialog for App Selection
ipcMain.handle('select-app-path', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    title: 'Select Application',
    buttonLabel: 'Select App'
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Macro Execution Handler
ipcMain.handle('run-macro', async (_event, macro) => {
  console.log(`Running macro: ${macro.name}`);

  try {
    for (let i = 0; i < macro.actions.length; i++) {
      const action = macro.actions[i];
      console.log(`Executing step ${i + 1}: ${action.type}`);

      switch (action.type) {
        case 'open-app':
          if (!action.config.appPath) throw new Error('App path is missing');
          // Use macOS 'open' command
          await execPromise(`open "${action.config.appPath}"`);
          break;

        case 'open-website':
          if (!action.config.url) throw new Error('URL is missing');
          await shell.openExternal(action.config.url);
          break;

        case 'run-command':
          if (!action.config.command) throw new Error('Command is missing');
          await execPromise(action.config.command);
          break;

        case 'wait':
          const duration = action.config.duration || 1000;
          await new Promise(resolve => setTimeout(resolve, duration));
          break;

        case 'notification':
          if (!action.config.message) throw new Error('Notification message is missing');
          new Notification({ title: 'Macro Studio', body: action.config.message }).show();
          break;

        case 'screenshot':
          const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
          if (sources.length === 0) throw new Error('No screens found');
          const thumbnail = sources[0].thumbnail;
          const screenshotPath = path.join(app.getPath('pictures'), `macro-studio-${Date.now()}.png`);
          fs.writeFileSync(screenshotPath, thumbnail.toPNG());
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    }
    return { success: true };
  } catch (error) {
    console.error(`Macro failed at step: ${error.message}`);
    return { success: false, error: error.message };
  }
});
