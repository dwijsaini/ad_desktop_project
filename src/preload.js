import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (_event, data) => func(data)),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme-changed', (_event, theme) => callback(theme));
  }
});
