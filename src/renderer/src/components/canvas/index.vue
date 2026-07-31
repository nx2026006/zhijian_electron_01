<template>
  <div class="canvas-container">
    <div class="canvas-area" @click="onCanvasClick" @dragover.prevent @drop.prevent="onDrop">
      <!-- 空状态：导入 -->
      <div class="canvas-empty" v-if="!hasLayers&&!loading">
        <el-icon :size="48" color="#c9cdd4"><PictureFilled/></el-icon>
        <div class="empty-text">拖拽图片到此处或点击导入</div>
        <div class="empty-btns">
          <el-button type="primary" size="large" :icon="Upload" round @click.stop="importFiles">导入图片</el-button>
          <el-button size="large" :icon="FolderOpened" round @click.stop="importFolder">导入文件夹</el-button>
        </div>
        <div class="empty-hint">支持 JPG、PNG、WebP 格式，可多选</div>
      </div>

      <!-- 加载中 -->
      <div class="canvas-empty" v-if="loading">
        <el-icon :size="36" class="spin"><Loading/></el-icon>
        <div class="empty-text">正在读取图片...</div>
      </div>

      <!-- 单张预览 -->
      <img v-if="hasLayers&&currentLayer&&!loading" class="canvas-preview"
        :src="currentLayer.dataUrl" :style="{filter:currentLayer.cssFilter||'none',transform:currentLayer.cssTransform||'none'}" @click.stop>
    </div>

    <!-- Toast -->
    <div class="canvas-toast" :class="{show:!!toast}">{{toast}}</div>
  </div>
</template>

<script setup>
import {ref,computed} from 'vue';
import {Upload,PictureFilled,Loading,FolderOpened} from '@element-plus/icons-vue';
import {useProjectStore} from '@/stores/index.js';

const projectStore=useProjectStore();
const loading=ref(false);const toast=ref('');

const hasLayers=computed(()=>projectStore.layers.length>0);
const currentLayer=computed(()=>projectStore.getActiveLayer());

function tip(msg){toast.value=msg;setTimeout(()=>{toast.value='';},2500);}

function imgSize(dataUrl){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({w:img.naturalWidth,h:img.naturalHeight,img});img.onerror=()=>resolve({w:0,h:0});img.src=dataUrl;});}
// 生成缩略图 dataUrl（最大 200px）
function makeThumb(img){const max=200;let w=img.naturalWidth,h=img.naturalHeight;if(w>max||h>max){const r=Math.min(max/w,max/h);w=Math.round(w*r);h=Math.round(h*r);}const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);return c.toDataURL('image/jpeg',0.8);}
async function addImage(p){
  const url=await window.electron.readAsDataUrl(p);
  if(!url) return;
  const size=await imgSize(url);
  const thumb=size.img?makeThumb(size.img):url;
  projectStore.addLayer({name:p.split('\\').pop().split('/').pop(),filePath:p,dataUrl:url,thumbUrl:thumb,origWidth:size.w,origHeight:size.h,width:'-',height:'-',size:'-'});
}

async function importFiles(){
  loading.value=true;
  try{const paths=await window.electron.openFiles();if(!paths||!paths.length){loading.value=false;return;}
    for(const p of paths) await addImage(p);
    tip(`已导入 ${paths.length} 张`);
  }catch(e){tip('导入失败：'+e.message);}
  finally{loading.value=false;}
}

async function importFolder(){
  loading.value=true;
  try{
    const dir=await window.electron.openFolder();if(!dir){loading.value=false;return;}
    const files=await window.electron.listImages(dir);
    if(!files||!files.length){tip('目录中无图片文件');loading.value=false;return;}
    for(const f of files) await addImage(f);
    tip(`已导入 ${files.length} 张`);
  }catch(e){tip('导入文件夹失败：'+e.message);}
  finally{loading.value=false;}
}

function onCanvasClick(){if(!hasLayers.value) importFiles();}
function readFileAsDataUrl(file){return new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>resolve(null);r.readAsDataURL(file);});}
async function onDrop(e){
  const files=e.dataTransfer?.files;if(!files||!files.length) return;
  loading.value=true;
  let count=0;
  try{
    for(const f of files){
      if(!f.type.startsWith('image/')) continue;
      const url=await readFileAsDataUrl(f);
      if(!url) continue;
      const size=await imgSize(url);
      const thumb=size.img?makeThumb(size.img):url;
      // Electron 下优先用 file.path，否则用文件名
      const name=f.name||'drop_'+Date.now();
      const filePath=f.path||name;
      projectStore.addLayer({name,filePath,dataUrl:url,thumbUrl:thumb,origWidth:size.w,origHeight:size.h,width:'-',height:'-',size:'-'});
      count++;
    }
    if(count) tip(`已导入 ${count} 张`);
  }catch(e){tip('拖拽导入失败：'+e.message);}
  finally{loading.value=false;}
}
</script>

<style lang='scss' scoped>
.canvas-container{flex:1;display:flex;align-items:center;justify-content:center;padding:$spacing-lg;position:relative;}
.canvas-area{width:100%;height:100%;background:$bg-white;border-radius:$border-radius;border:1px solid $border-color;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;position:relative;padding:$spacing-lg;}

.canvas-empty{display:flex;flex-direction:column;align-items:center;gap:16px;user-select:none;.empty-text{font-size:15px;color:$text-secondary;}.empty-hint{font-size:12px;color:$text-muted;}.empty-btns{display:flex;gap:10px;}}
.canvas-preview{max-width:100%;max-height:100%;object-fit:contain;pointer-events:none;}
.spin{animation:spin 1s linear infinite;color:$color-primary;}@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

.canvas-toast{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;font-size:12px;padding:8px 18px;border-radius:20px;z-index:10;opacity:0;transition:opacity .2s;&.show{opacity:1;}}
</style>
