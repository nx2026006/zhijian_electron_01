/**
 * 开发启动脚本 — 清理 ELECTRON_RUN_AS_NODE 后启动 electron-vite dev
 */

import {spawn} from 'child_process';
import {join,dirname} from 'path';
import {fileURLToPath} from 'url';

const __dirname=dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT=join(__dirname,'..');

// 从环境变量中删除 ELECTRON_RUN_AS_NODE
const env={...process.env};
delete env.ELECTRON_RUN_AS_NODE;

// Windows 下用 cmd /c 包裹，先切 UTF-8 代码页解决中文乱码
const isWin=process.platform==='win32';
const cmd=isWin?'cmd':'npx';
const args=isWin?['/c','chcp 65001 >nul && npx electron-vite dev']:['electron-vite','dev'];

const child=spawn(cmd,args,{
  cwd:PROJECT_ROOT,
  env,
  stdio:'inherit',
  shell:false// 上面已指定 cmd 为 shell
});

child.on('exit',(code)=>{process.exit(code);});
