import {contextBridge,ipcRenderer} from 'electron';

// 窗口控制 + 文件操作 + token
contextBridge.exposeInMainWorld('electron',{
  min:()=>ipcRenderer.invoke('window:min'),
  max:()=>ipcRenderer.invoke('window:max'),
  close:()=>ipcRenderer.invoke('window:close'),
  openFile:()=>ipcRenderer.invoke('dialog:openFile'),
  openFiles:()=>ipcRenderer.invoke('dialog:openFiles'),
  openFolder:()=>ipcRenderer.invoke('dialog:openFolder'),
  readAsDataUrl:(path)=>ipcRenderer.invoke('file:readAsDataUrl',path),
  writeFile:(path,dataUrl)=>ipcRenderer.invoke('file:write',path,dataUrl),
  renameFile:(oldPath,newPath)=>ipcRenderer.invoke('file:rename',oldPath,newPath),
  saveFile:(path)=>ipcRenderer.invoke('dialog:saveFile',path),
  listImages:(dir)=>ipcRenderer.invoke('file:listImages',dir),
  getToken:()=>ipcRenderer.invoke('token:get'),
  setToken:(t)=>ipcRenderer.invoke('token:set',t)
});

console.log('[Preload] window.electron exposed');
