/**
 * Electron 主进程入口
 * 启动流程：app.whenReady → 清除缓存 → IPC → 创建窗口
 */

// 修复 Windows 终端中文乱码
if(process.platform==='win32'){
  process.stdout.setDefaultEncoding('utf-8');
  process.stderr.setDefaultEncoding('utf-8');
}

import {app,BrowserWindow,ipcMain,Menu,dialog,session,globalShortcut} from 'electron';
import {join,dirname,extname} from 'path';
import {fileURLToPath} from 'url';
import {readFile,writeFile} from 'fs/promises';

const __dirname=dirname(fileURLToPath(import.meta.url));

// 单实例锁
if(!app.requestSingleInstanceLock()) app.quit();

const isDev=!app.isPackaged;
const ENV_PATH=isDev?join(__dirname,'..','..','.env'):join(app.getPath('userData'),'.env');
let mainWindow=null;

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true;

function createWindow(){
  Menu.setApplicationMenu(null);

  mainWindow=new BrowserWindow({
    frame:false,
    width:1440,height:900,
    minWidth:1280,minHeight:700,
    title:APP_NAME,
    show:false,
    webPreferences:{
      preload:join(__dirname,'../preload/index.mjs'),
      contextIsolation:true,
      nodeIntegration:false,
      sandbox:false
    }
  });

  mainWindow.on('ready-to-show',()=>{mainWindow.show();});

  if(isDev){
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL||'http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }else{
    mainWindow.loadFile(join(__dirname,'../renderer/index.html'));
  }
}

// ====== IPC ======
function registerDialogIpc(){
  ipcMain.handle('dialog:openFile',async ()=>{
    const r=await dialog.showOpenDialog(mainWindow,{title:'选择图片',filters:[{name:'图片文件',extensions:['jpg','jpeg','png','webp','bmp','gif']}],properties:['openFile']});
    if(r.canceled) return null;return r.filePaths[0];
  });
  ipcMain.handle('file:readAsDataUrl',async (_e,filePath)=>{
    const {readFile}=await import('fs/promises');
    const m={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.bmp':'image/bmp','.gif':'image/gif'};
    const ext=extname(filePath).toLowerCase();const buf=await readFile(filePath);
    return `data:${m[ext]||'image/png'};base64,${buf.toString('base64')}`;
  });
  ipcMain.handle('dialog:openFiles',async ()=>{
    const r=await dialog.showOpenDialog(mainWindow,{title:'选择图片（可多选）',filters:[{name:'图片文件',extensions:['jpg','jpeg','png','webp','bmp','gif']}],properties:['openFile','multiSelections']});
    if(r.canceled) return[];return r.filePaths;
  });
  ipcMain.handle('file:listImages',async (_e,dirPath)=>{
    const {readdir}=await import('fs/promises');
    const exts=new Set(['.jpg','.jpeg','.png','.webp','.bmp','.gif']);
    const entries=await readdir(dirPath,{withFileTypes:true});
    return entries.filter(e=>e.isFile()&&exts.has(extname(e.name).toLowerCase())).map(e=>join(dirPath,e.name));
  });
  ipcMain.handle('dialog:openFolder',async ()=>{
    const r=await dialog.showOpenDialog(mainWindow,{title:'选择文件夹',properties:['openDirectory']});
    if(r.canceled) return null;return r.filePaths[0];
  });
  ipcMain.handle('file:write',async (_e,filePath,dataUrl)=>{try{const {writeFile}=await import('fs/promises');const base64=dataUrl.split(',')[1];const buf=Buffer.from(base64,'base64');await writeFile(filePath,buf);return true;}catch(e){return false;}});
  ipcMain.handle('file:rename',async (_e,oldPath,newPath)=>{try{const {rename}=await import('fs/promises');await rename(oldPath,newPath);return true;}catch(e){return false;}});
  ipcMain.handle('dialog:saveFile',async (_e,sourcePath)=>{
    const r=await dialog.showSaveDialog(mainWindow,{title:'另存为',defaultPath:sourcePath.split('\\').pop().split('/').pop(),filters:[{name:'图片文件',extensions:['jpg','jpeg','png','webp','bmp','gif']}]});
    if(r.canceled||!r.filePath) return null;
    const {copyFile}=await import('fs/promises');await copyFile(sourcePath,r.filePath);return r.filePath;
  });
}
function registerWindowIpc(){
  ipcMain.handle('window:min',()=>{if(mainWindow) mainWindow.minimize();});
  ipcMain.handle('window:max',()=>{if(mainWindow) mainWindow[mainWindow.isMaximized()?'unmaximize':'maximize']();});
  ipcMain.handle('window:close',()=>{if(mainWindow) mainWindow.close();});
}
function registerTokenIpc(){
  ipcMain.handle('token:get',async ()=>{
    try{
      const content=await readFile(ENV_PATH,'utf-8');
      const match=content.match(/^NX_API_KEY=(.+)$/m);
      return match?match[1].trim():'';
    }catch(e){
      return '';
    }
  });
  ipcMain.handle('token:set',async (_e,value)=>{
    try{
      let content='';
      try{content=await readFile(ENV_PATH,'utf-8');}catch(e){}
      if(content.match(/^NX_API_KEY=/m)){
        content=content.replace(/^NX_API_KEY=.*/m,`NX_API_KEY=${value}`);
      }else{
        content=content.trimEnd();
        if(content) content+='\n';
        content+=`NX_API_KEY=${value}`;
      }
      await writeFile(ENV_PATH,content,'utf-8');
      return true;
    }catch(e){
      console.error('[Token] 写入 .env 失败:',e.message);
      return false;
    }
  });
}

// 第二个实例激活已有窗口
app.on('second-instance',()=>{
  if(mainWindow){if(mainWindow.isMinimized()) mainWindow.restore();mainWindow.focus();}
});

app.whenReady().then(async ()=>{
  // 生产环境清除 HTTP 缓存，开发环境跳过（加速热重载）
  if(!isDev) await session.defaultSession.clearCache();

  registerWindowIpc();registerDialogIpc();registerTokenIpc();

  createWindow();

  // DevTools 快捷键：开发环境 F12，生产环境 Ctrl+Alt+Shift+F12（防误触）
  const devToolsKey=isDev?'F12':'CmdOrCtrl+Alt+Shift+F12';
  globalShortcut.register(devToolsKey,()=>{
    if(!mainWindow) return;
    if(mainWindow.isMinimized()) mainWindow.restore();
    if(mainWindow.webContents.isDevToolsOpened()){
      mainWindow.webContents.closeDevTools();
    }else{
      mainWindow.webContents.openDevTools();
    }
  });

  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0) createWindow();});
});

app.on('window-all-closed',()=>{app.quit();});
app.on('will-quit',()=>{globalShortcut.unregisterAll();});
