import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define tipos para as funções do IPC
type IpcRendererHandler = (...args: any[]) => void;
type ChannelName = string;

// Define a interface para o objeto electron exposto
export interface ElectronAPI {
  ipcRenderer: {
    send(channel: ChannelName, data: unknown): void;
    on(channel: ChannelName, callback: IpcRendererHandler): void;
    removeAllListeners(channel: ChannelName): void;
  };
}

// Expõe a API do Electron para o processo de renderização
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: ChannelName, data: unknown): void => {
      ipcRenderer.send(channel, data);
    },

    on: (channel: ChannelName, callback: IpcRendererHandler): void => {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void =>
        callback(...args);
      ipcRenderer.on(channel, subscription);
    },

    removeAllListeners: (channel: ChannelName): void => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
} as ElectronAPI);

// Declara o tipo global para o objeto electron
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
