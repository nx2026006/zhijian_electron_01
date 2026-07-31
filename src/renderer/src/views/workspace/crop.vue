<template>
  <div class='app-body'>
    <WorkspaceToolbar :disabled='cropping||loading'
      @addImages='addImages' @addFolder='addFolder' @clearAll='clearAll' />

    <div class='content-body'>
      <PreviewWorkspace>
        <template #thumbList>
          <ThumbnailStrip :items='layers' :active-id='activeLayer?.id'
            :loading='loading' @select='selectLayer' @drop='onDrop'></ThumbnailStrip>
        </template>
        <template #preview>
          <ImagePreview ref='previewRef' :image-url='activeLayer?.dataUrl'
            :loading='loading||cropping' :loading-text='cropping?"处理中...":"导入中..."'
            @imgLoad='onPreviewLoad' @drop='onDrop'>
            <template #empty>
              <el-icon :size='48' color='#b0b3bd'><PictureFilled></PictureFilled></el-icon>
              <p>点击左侧缩略图选中图片</p>
            </template>
            <template #overlay>
              <CropBox ref='cropBoxRef'
                :mode='cropMode' :ratio-w='ratioW' :ratio-h='ratioH'
                :border-radius='cornerRadius' :border-radius-unit='radiusMode'
                :display-w='imgDisplay.w' :display-h='imgDisplay.h'
                :display-ox='imgDisplay.ox' :display-oy='imgDisplay.oy'
                :default-position='defaultPos'
                :default-w='cropW' :default-h='cropH'
                @update:box='onCropBoxChange'
                @drag-start='isDragging=true'
                @drag-end='isDragging=false'></CropBox>
            </template>
          </ImagePreview>
        </template>
      </PreviewWorkspace>

      <SidePanel>
        <template #config>
          <FormSection title='裁切方式'>
            <el-radio-group v-model='cropMode' size='large' style='width:100%' :disabled='cropping'>
              <el-radio-button value='size'>固定大小</el-radio-button>
              <el-radio-button value='ratio'>固定比例</el-radio-button>
            </el-radio-group>
          </FormSection>
          <FormSection title='裁切参数'>
            <div class='input-row' v-if='cropMode==="size"'>
              <el-input-number v-model='cropW' :min='1' :max='99999' size='large' style='flex:1' :disabled='cropping' controls-position='right' placeholder='宽'></el-input-number>
              <span class='input-sep'>×</span>
              <el-input-number v-model='cropH' :min='1' :max='99999' size='large' style='flex:1' :disabled='cropping' controls-position='right' placeholder='高'></el-input-number>
            </div>
            <div class='input-row' v-else>
              <el-input-number v-model='ratioW' :min='1' :max='100' size='large' style='flex:1' :disabled='cropping' controls-position='right' placeholder='宽'></el-input-number>
              <span class='input-sep'>:</span>
              <el-input-number v-model='ratioH' :min='1' :max='100' size='large' style='flex:1' :disabled='cropping' controls-position='right' placeholder='高'></el-input-number>
            </div>
          </FormSection>
          <FormSection title='选取圆角'>
            <el-radio-group v-model='radiusMode' size='large' style='width:100%' :disabled='cropping'>
              <el-radio-button value='percent'>百分比</el-radio-button>
              <el-radio-button value='px'>像素</el-radio-button>
            </el-radio-group>
            <div style='margin-top:10px'>
              <SliderControl v-if='radiusMode==="percent"'
                v-model='cornerRadius' :min='0' :max='50' suffix='%' :disabled='cropping'></SliderControl>
              <SliderControl v-else
                v-model='cornerRadius' :min='0' :max='200' suffix='px' :disabled='cropping'></SliderControl>
            </div>
          </FormSection>
          <FormSection title='默认位置'>
            <NineGridPicker v-model='defaultPos'></NineGridPicker>
          </FormSection>
        </template>
        <template #footer>
          <el-button size='large' @click='doOverwrite'
            :loading='overwriting' :disabled='!activeLayer||overwriting||exporting||loading'>覆盖原文件</el-button>
          <el-button type='primary' size='large' @click='exportAll'
            :loading='exporting' :disabled='!activeLayer||exporting||overwriting||loading'>导出新文件</el-button>
        </template>
      </SidePanel>
    </div>
  </div>
</template>

<script setup>
  import {ref,computed,watch,nextTick,onMounted,onUnmounted} from 'vue';
  import {PictureFilled} from '@element-plus/icons-vue';
  import {ElMessageBox,ElMessage} from 'element-plus';
  import {WorkspaceToolbar,SidePanel,PreviewWorkspace,ThumbnailStrip,ImagePreview,
    CropBox,NineGridPicker,SliderControl,FormSection} from '@/components/workspace/index.js';
  import {useImageImport} from '@/composables/useImageImport.js';
  import {calcContainRect} from '@/utils/image.js';

  const {layers,loading,addImages,addFolder,onDrop,clearAll}=useImageImport({
    onLayerAdded:(l)=>{
      if(!activeLayer.value) activeLayer.value=l;
    },
  });

  const cropping=ref(false);
  const overwriting=ref(false);
  const exporting=ref(false);
  const activeLayer=ref(null);
  const cropBoxRef=ref(null);
  const previewRef=ref(null);

  const cropMode=ref('size');
  const cropW=ref(300);
  const cropH=ref(300);
  const ratioW=ref(1);
  const ratioH=ref(1);
  const radiusMode=ref('percent');
  const percentRadius=ref(0);
  const pxRadius=ref(0);
  const cornerRadius=computed({
    get:()=>radiusMode.value==='percent'?percentRadius.value:pxRadius.value,
    set:(v)=>{if(radiusMode.value==='percent') percentRadius.value=v;else pxRadius.value=v;},
  });
  const defaultPos=ref('mc');

  const imgDisplay=ref({w:0,h:0,scale:1,ox:0,oy:0});
  const currentBox=ref({x:0,y:0,w:0,h:0});
  const isDragging=ref(false);

  function r2(v){return Math.round(v*100)/100;}

  function getCropSize(){
    const d=imgDisplay.value;if(!d.w) return {w:0,h:0};
    if(cropMode.value==='size') return {w:Math.min(cropW.value,d.w),h:Math.min(cropH.value,d.h)};
    const r=ratioW.value/ratioH.value;
    let w=Math.min(300,d.w);
    let h=r2(w/r);
    if(h>d.h){h=d.h;w=r2(h*r);}
    return {w,h};
  }

  function getPosOffset(dw,dh,cw,ch){
    const key=defaultPos.value;
    const v=key[0],h=key[1];
    let x=0,y=0;
    if(h==='c') x=Math.round((dw-cw)/2);
    else if(h==='r') x=dw-cw;
    if(v==='m') y=Math.round((dh-ch)/2);
    else if(v==='b') y=dh-ch;
    return {x,y};
  }

  function updateCropBox(){
    const d=imgDisplay.value;if(!d.w) return;
    const {w:cw,h:ch}=getCropSize();if(!cw||!ch) return;
    const {x,y}=getPosOffset(d.w,d.h,cw,ch);
    currentBox.value={x,y,w:cw,h:ch};
    nextTick(()=>cropBoxRef.value?.initBox());
  }

  function selectLayer(l){
    if(activeLayer.value===l) return;
    activeLayer.value=l;
    currentBox.value={x:0,y:0,w:0,h:0};
    imgDisplay.value={w:0,h:0,scale:1,ox:0,oy:0};
  }

  function onPreviewLoad(){
    const img=previewRef.value?.getImg();
    if(!img||!activeLayer.value) return;
    const wrap=previewRef.value?.getWrap();
    if(!wrap) return;
    const rect=calcContainRect(wrap.clientWidth,wrap.clientHeight,img.naturalWidth,img.naturalHeight);
    imgDisplay.value={...rect,scale:rect.w/activeLayer.value.origWidth};
    updateCropBox();
  }

  function onCropBoxChange(box){
    currentBox.value=box;
    if(cropMode.value==='size'){
      cropW.value=box.w;
      cropH.value=box.h;
    }
  }

  // ===== Watcher（与原始逻辑一致） =====
  // 裁切方式/默认位置变化 → 完全重算
  watch([cropMode,defaultPos],()=>{
    if(!activeLayer.value||isDragging.value) return;
    nextTick(()=>updateCropBox());
  });
  // 比率参数变化 → 重算尺寸（保留默认位置）
  watch([ratioW,ratioH],()=>{
    if(!activeLayer.value||isDragging.value||cropMode.value!=='ratio') return;
    const d=imgDisplay.value;if(!d.w) return;
    const r=ratioW.value/ratioH.value;
    let nw=Math.min(300,d.w),nh=r2(nw/r);
    if(nh>d.h){nh=d.h;nw=r2(nh*r);}
    const {x,y}=getPosOffset(d.w,d.h,nw,nh);
    currentBox.value={x,y,w:nw,h:nh};
    nextTick(()=>cropBoxRef.value?.initBox());
  });
  // 固定大小参数变化 → 仅更新尺寸，超出边界才调整位置
  watch([cropW,cropH],()=>{
    if(!activeLayer.value||isDragging.value||cropMode.value!=='size') return;
    const d=imgDisplay.value;if(!d.w) return;
    const box=currentBox.value;if(!box.w) return;
    const {w:nw,h:nh}=getCropSize();
    let nx=box.x,ny=box.y;
    if(nx+nw>d.w) nx=Math.max(0,d.w-nw);
    if(ny+nh>d.h) ny=Math.max(0,d.h-nh);
    currentBox.value={x:nx,y:ny,w:nw,h:nh};
    nextTick(()=>cropBoxRef.value?.initBox());
  });
  // activeLayer 清空时重置
  watch(activeLayer,()=>{
    if(!activeLayer.value) currentBox.value={x:0,y:0,w:0,h:0};
  });

  function onResize(){
    if(!activeLayer.value) return;
    nextTick(()=>onPreviewLoad());
  }
  onMounted(()=>window.addEventListener('resize',onResize));
  onUnmounted(()=>window.removeEventListener('resize',onResize));

  // ===== 裁切应用 =====
  function cropImage(layer,displayBox){
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>{
        const s=imgDisplay.value.scale||1;
        const b={x:Math.round(displayBox.x/s),y:Math.round(displayBox.y/s),w:Math.round(displayBox.w/s),h:Math.round(displayBox.h/s)};
        const c=document.createElement('canvas');c.width=b.w;c.height=b.h;
        const ctx=c.getContext('2d');
        if(cornerRadius.value>0){
          let rx,ry;
          if(radiusMode.value==='percent'){
            rx=Math.min(b.w*cornerRadius.value/100,b.w/2);
            ry=Math.min(b.h*cornerRadius.value/100,b.h/2);
          }else{
            const r=Math.min(Math.round(cornerRadius.value/s),Math.min(b.w,b.h)/2);
            rx=r;ry=r;
          }
          ctx.beginPath();
          ctx.moveTo(rx,0);ctx.lineTo(b.w-rx,0);
          ctx.ellipse(b.w-rx,ry,rx,ry,0,-Math.PI/2,0);
          ctx.lineTo(b.w,b.h-ry);
          ctx.ellipse(b.w-rx,b.h-ry,rx,ry,0,0,Math.PI/2);
          ctx.lineTo(rx,b.h);
          ctx.ellipse(rx,b.h-ry,rx,ry,0,Math.PI/2,Math.PI);
          ctx.lineTo(0,ry);
          ctx.ellipse(rx,ry,rx,ry,0,Math.PI,Math.PI*1.5);
          ctx.closePath();ctx.clip();
        }
        ctx.drawImage(img,b.x,b.y,b.w,b.h,0,0,b.w,b.h);
        const dataUrl=c.toDataURL('image/png');
        const headerLen=dataUrl.indexOf(',')+1;
        resolve({dataUrl,size:Math.round((dataUrl.length-headerLen)*3/4),w:b.w,h:b.h});
      };
      img.onerror=()=>resolve(null);
      img.src=layer.dataUrl;
    });
  }

  async function doOverwrite(){
    const l=activeLayer.value;if(!l){ElMessage.warning('请先选中图片');return;}
    if(!l.filePath){ElMessage.warning('该文件无路径（拖拽导入），无法覆盖');return;}
    if(!currentBox.value.w){ElMessage.warning('裁切参数无效');return;}
    try{await ElMessageBox.confirm(`确认覆盖 ${l.name}？`,'确认覆盖',{confirmButtonText:'覆盖',cancelButtonText:'取消',type:'warning'});}catch(_e){return;}
    overwriting.value=true;
    try{
      const r=await cropImage(l,currentBox.value);
      if(!r){ElMessage.error('裁切失败');overwriting.value=false;return;}
      const ok=await window.electron.writeFile(l.filePath,r.dataUrl);
      if(ok) ElMessage.success('已覆盖');else ElMessage.error('写入失败');
    }catch(e){ElMessage.error('覆盖失败：'+e.message);}
    finally{overwriting.value=false;}
  }

  async function exportAll(){
    const l=activeLayer.value;if(!l){ElMessage.warning('请先选中图片');return;}
    if(!currentBox.value.w){ElMessage.warning('裁切参数无效');return;}
    const folder=await window.electron.openFolder();if(!folder){return;}
    exporting.value=true;
    try{
      const r=await cropImage(l,currentBox.value);if(!r){ElMessage.error('裁切失败');return;}
      const name=l.name.replace(/\.[^.]+$/,'');const out=`${folder}\\cropped_${name}.png`;
      const ok=await window.electron.writeFile(out,r.dataUrl);
      if(ok) ElMessage.success(`已导出到 ${folder}`);else ElMessage.error('导出失败');
    }catch(e){ElMessage.error('导出失败：'+e.message);}
    finally{exporting.value=false;}
  }
</script>
