// 图片导入/删除/清空统一逻辑 — 所有 workspace 页面共用

import {ref} from 'vue';
import {ElMessageBox,ElMessage} from 'element-plus';
import {useLocalLayers} from './useLocalLayers.js';
import {
  isValidImage,formatSize,readFileAsDataUrl,
  generateThumb,calcBase64Size,loadImageInfo,
} from '@/utils/image.js';
import {THUMB_MAX_SIZE,THUMB_QUALITY} from '@/constants/workspace.js';

export function useImageImport(options={}){
  const {onLayerAdded}=options;
  const {layers,addLayer,removeLayer,clearAll:clearLayers}=useLocalLayers();
  const loading=ref(false);

  // ===== 内部：从文件路径构建图层 =====
  async function importFromPath(filePath,useRawSize=false){
    const u=await window.electron.readAsDataUrl(filePath);
    if(!u) return null;
    const info=await loadImageInfo(u);
    if(!info||!info.w) return null;
    const thumb=generateThumb(u,info.img,THUMB_MAX_SIZE,THUMB_QUALITY);
    const fileName=filePath.split('\\').pop().split('/').pop();
    const byteSize=calcBase64Size(u);
    const layer=addLayer({
      name:fileName,
      filePath,
      dataUrl:u,
      thumbUrl:thumb,
      origWidth:info.w,
      origHeight:info.h,
      size:formatSize(byteSize),
      rawSize:byteSize,
    });
    return layer;
  }

  // ===== 内部：从 File 对象构建图层 =====
  async function importFromFile(file){
    if(!file.type.startsWith('image/')||!isValidImage(file.name)) return null;
    const url=await readFileAsDataUrl(file);
    if(!url) return null;
    const info=await loadImageInfo(url);
    if(!info||!info.w) return null;
    const thumb=generateThumb(url,info.img,THUMB_MAX_SIZE,THUMB_QUALITY);
    const layer=addLayer({
      name:file.name||'drop',
      filePath:file.path||'',
      dataUrl:url,
      thumbUrl:thumb,
      origWidth:info.w,
      origHeight:info.h,
      size:formatSize(file.size),
      rawSize:file.size,
    });
    return layer;
  }

  // ===== 添加图片（文件选择对话框） =====
  async function addImages(){
    const paths=await window.electron.openFiles();
    if(!paths||!paths.length) return;
    loading.value=true;
    let count=0;
    for(const p of paths){
      if(!isValidImage(p)) continue;
      const l=await importFromPath(p);
      if(l){count++;if(onLayerAdded) onLayerAdded(l);}
    }
    if(count) ElMessage.success(`已导入 ${count} 张`);
    loading.value=false;
  }

  // ===== 添加文件夹 =====
  async function addFolder(){
    const folder=await window.electron.openFolder();
    if(!folder) return;
    loading.value=true;
    try{
      const paths=await window.electron.listImages(folder);
      if(!paths||!paths.length){ElMessage.info('文件夹中没有图片');loading.value=false;return;}
      let count=0;
      for(const p of paths){
        if(!isValidImage(p)) continue;
        const l=await importFromPath(p);
        if(l){count++;if(onLayerAdded) onLayerAdded(l);}
      }
      if(count) ElMessage.success(`已导入 ${count} 张`);
    }catch(e){ElMessage.error('导入失败');}
    finally{loading.value=false;}
  }

  // ===== 拖拽导入 =====
  async function onDrop(e){
    const files=e.dataTransfer?.files;
    if(!files||!files.length) return;
    loading.value=true;
    let count=0;
    try{
      for(const f of files){
        const l=await importFromFile(f);
        if(l){count++;if(onLayerAdded) onLayerAdded(l);}
      }
      if(count) ElMessage.success(`已导入 ${count} 张`);
    }catch(e){ElMessage.error('拖拽导入失败');}
    finally{loading.value=false;}
  }

  // ===== 清空全部 =====
  async function clearAll(){
    try{
      await ElMessageBox.confirm('确定清空所有图片？','确认',{
        confirmButtonText:'清空',cancelButtonText:'取消',type:'warning',
      });
    }catch(_e){return;}
    clearLayers();
    ElMessage.success('已清空');
  }

  // ===== 删除单个 =====
  async function delLayer(l){
    try{
      await ElMessageBox.confirm('确认删除？','提示',{
        confirmButtonText:'删除',cancelButtonText:'取消',type:'warning',
      });
    }catch(_e){return;}
    removeLayer(l.id);
  }

  return {
    layers,loading,
    addImages,addFolder,onDrop,clearAll,delLayer,
    addLayer,removeLayer,clearLayers,
    importFromPath,importFromFile,
  };
}
