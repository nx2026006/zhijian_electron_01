<template>
  <div class='app-body'>
    <WorkspaceToolbar :disabled='processing||loading'
      @addImages='addImages' @addFolder='addFolder' @clearAll='clearAll' />

    <div class='content-body'>
      <PreviewWorkspace>
        <template #thumbList>
          <ThumbnailStrip :items='layers' :active-id='activeLayer?.id'
            :loading='loading' @select='selectLayer' @drop='onDrop'></ThumbnailStrip>
        </template>
        <template #preview>
          <ImagePreview :image-url='activeLayer?.dataUrl'
            :loading='loading||processing' :loading-text='processing?"处理中...":"导入中..."'
            @imgLoad='onPreviewLoad' @drop='onDrop'>
            <template #empty>
              <el-icon :size='48' color='#b0b3bd'><PictureFilled></PictureFilled></el-icon>
              <p>点击左侧缩略图选中图片</p>
            </template>
            <template #overlay>
              <div class='wm-overlay' v-if='wmPreview.show' :style='{left:imgRect.ox+"px",top:imgRect.oy+"px",width:imgRect.w+"px",height:imgRect.h+"px"}'>
                <div v-if='wmPos==="tile"' class='wm-tile' :style='wmTileStyle'></div>
                <span v-else-if='wmType==="text"' class='wm-text'
                  :style='{fontSize:wmPreview.fs+"px",opacity:wmOpacity/100,transform:"translate(-50%,"+wmPreview.anchorY+") rotate("+wmRotate+"deg)",left:wmPreview.x+"px",top:wmPreview.anchorTop,bottom:wmPreview.anchorBottom,color:"#fff",textShadow:"0 0 3px rgba(0,0,0,0.5)"}'>{{wmText}}</span>
                <img v-else-if='wmType==="image"&&wmImgObj' class='wm-image'
                  :src='wmImgUrl' :style='{width:wmPreview.w+"px",opacity:wmOpacity/100,transform:"translate(-50%,"+wmPreview.anchorY+") rotate("+wmRotate+"deg)",left:wmPreview.x+"px",top:wmPreview.anchorTop,bottom:wmPreview.anchorBottom}'>
              </div>
            </template>
          </ImagePreview>
        </template>
      </PreviewWorkspace>

      <SidePanel>
        <template #config>
          <FormSection title='水印类型'>
            <el-radio-group v-model='wmType' size='large' style='width:100%' :disabled='processing'>
              <el-radio-button value='text'>文字水印</el-radio-button>
              <el-radio-button value='image'>图片水印</el-radio-button>
            </el-radio-group>
          </FormSection>
          <FormSection v-if='wmType==="text"' title='水印文字'>
            <el-input v-model='wmText' size='large' placeholder='请输入水印文字' :disabled='processing' clearable></el-input>
          </FormSection>
          <FormSection v-if='wmType==="text"' title='字体大小'>
            <el-input-number v-model='wmFontSize' :min='12' :max='200' size='large' style='width:100%' :disabled='processing' controls-position='right'></el-input-number>
          </FormSection>
          <FormSection v-if='wmType==="image"' title='水印图片'>
            <el-button size='large' style='width:100%' @click='addWmImage' :disabled='processing'>{{wmImgUrl?'已选择':'选择水印图片'}}</el-button>
          </FormSection>
          <FormSection v-if='wmType==="image"&&wmImgUrl' title='水印宽度 (px)'>
            <el-input-number v-model='wmImgW' :min='20' :max='500' size='large' style='width:100%' :disabled='processing' controls-position='right'></el-input-number>
          </FormSection>
          <FormSection title='透明度'>
            <SliderControl v-model='wmOpacity' :min='5' :max='100' suffix='%' :disabled='processing'></SliderControl>
          </FormSection>
          <FormSection title='旋转角度'>
            <SliderControl v-model='wmRotate' :min='-90' :max='90' suffix='°' :disabled='processing'></SliderControl>
          </FormSection>
          <FormSection title='水印位置'>
            <el-radio-group v-model='wmPos' size='large' style='width:100%' :disabled='processing'>
              <el-radio-button value='tile'>平铺</el-radio-button>
              <el-radio-button value='grid'>九宫格</el-radio-button>
              <el-radio-button value='custom'>自定义</el-radio-button>
            </el-radio-group>
          </FormSection>
          <FormSection v-if='wmPos==="tile"' title='平铺间距'>
            <SliderControl v-model='wmSpacing' :min='0' :max='200' suffix='px' :disabled='processing'></SliderControl>
          </FormSection>
          <FormSection v-if='wmPos==="grid"' title='九宫格位置'>
            <NineGridPicker v-model='wmGridPos'></NineGridPicker>
          </FormSection>
          <FormSection v-if='wmPos==="custom"' title='自定义位置 (%)'>
            <SliderControl label='X' v-model='wmX' :min='0' :max='100' suffix='%' :disabled='processing'></SliderControl>
            <SliderControl label='Y' v-model='wmY' :min='0' :max='100' suffix='%' :disabled='processing'></SliderControl>
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
  import {ref,reactive,computed,watch,nextTick} from 'vue';
  import {PictureFilled} from '@element-plus/icons-vue';
  import {ElMessageBox,ElMessage} from 'element-plus';
  import {WorkspaceToolbar,SidePanel,PreviewWorkspace,ThumbnailStrip,ImagePreview,
    NineGridPicker,SliderControl,FormSection} from '@/components/workspace/index.js';
  import {useImageImport} from '@/composables/useImageImport.js';
  import {calcContainRect} from '@/utils/image.js';
  import {GRID_POSITIONS} from '@/constants/workspace.js';

  const {layers,loading,addImages,addFolder,onDrop,clearAll}=useImageImport({
    onLayerAdded:(l)=>{
      if(!activeLayer.value) activeLayer.value=l;
    },
  });

  const processing=ref(false);
  const overwriting=ref(false);
  const exporting=ref(false);
  const activeLayer=ref(null);

  const wmType=ref('text');const wmText=ref('');const wmFontSize=ref(36);
  const wmImgUrl=ref('');const wmImgW=ref(100);const wmOpacity=ref(30);
  const wmRotate=ref(-45);const wmSpacing=ref(100);const wmPos=ref('tile');
  const wmGridPos=ref('mc');const wmX=ref(50);const wmY=ref(50);
  const wmImgObj=ref(null);

  const imgRect=reactive({w:0,h:0,ox:0,oy:0});
  const previewScale=ref(1);
  const wmPreview=reactive({show:false,x:0,w:0,h:0,fs:36,anchorTop:'auto',anchorBottom:'auto',anchorY:'-50%'});

  function measureText(text,fontSize){
    if(!text) return{w:0,h:0};
    const el=document.createElement('span');
    el.style.cssText=`position:fixed;left:-9999px;top:-9999px;font-size:${fontSize}px;font-family:"PingFang SC","Microsoft YaHei",sans-serif;white-space:nowrap;visibility:hidden;line-height:1;`;
    el.textContent=text;document.body.appendChild(el);
    const r=el.getBoundingClientRect();const w=r.width,h=r.height;
    document.body.removeChild(el);
    return{w,h};
  }

  function selectLayer(l){activeLayer.value=l;wmPreview.show=false;nextTick(()=>onPreviewLoad());}

  function onPreviewLoad(){
    const wrap=document.querySelector('.preview-wrap');if(!wrap) return;
    const img=wrap.querySelector('.preview-img');if(!img) return;
    const layer=activeLayer.value;if(!layer) return;
    const rect=calcContainRect(wrap.clientWidth,wrap.clientHeight,img.naturalWidth,img.naturalHeight);
    Object.assign(imgRect,rect);
    previewScale.value=rect.w/layer.origWidth;
    updateWmPreview();
  }

  function getAnchorV(){
    if(wmPos.value==='tile'||wmPos.value==='custom') return'm';
    return wmGridPos.value[0];
  }
  function getPreviewPos(origW,origH,wmW,wmH){
    if(wmPos.value==='tile') return null;
    if(wmPos.value==='custom'){
      const x=wmW/2+(origW-wmW)*wmX.value/100;
      const y=wmH/2+(origH-wmH)*wmY.value/100;
      return{x,top:y};
    }
    const av=getAnchorV();
    const hKey=wmGridPos.value[1];
    let x;if(hKey==='c') x=origW/2;else if(hKey==='r') x=origW-wmW/2;else x=wmW/2;
    if(av==='t') return{x,top:0};
    if(av==='b') return{x,bottom:0};
    return{x,top:origH/2};
  }

  function updateWmPreview(){
    const layer=activeLayer.value;if(!layer||!imgRect.w){wmPreview.show=false;return;}
    if(wmType.value==='text'){
      const text=wmText.value;if(!text){wmPreview.show=false;return;}
      const fs=Math.round(wmFontSize.value*imgRect.w/600);
      const {w:tw}=measureText(text,fs);
      const pos=getPreviewPos(imgRect.w,imgRect.h,tw,fs);
      wmPreview.fs=fs;wmPreview.show=true;wmPreview.x=pos?pos.x:0;
      wmPreview.anchorTop=pos&&pos.top!=null?pos.top+'px':'auto';
      wmPreview.anchorBottom=pos&&pos.bottom!=null?pos.bottom+'px':'auto';
      wmPreview.anchorY=getAnchorV()==='m'?'-50%':'0';
    }else{
      if(!wmImgUrl.value){wmPreview.show=false;return;}
      const ps=imgRect.w/600;
      const iw=Math.round(wmImgW.value*ps),ih=Math.round(iw*(wmImgObj.value?wmImgObj.value.naturalHeight/wmImgObj.value.naturalWidth:1));
      const pos=getPreviewPos(imgRect.w,imgRect.h,iw,ih);
      wmPreview.show=true;wmPreview.w=iw;wmPreview.h=ih;wmPreview.x=pos?pos.x:0;
      wmPreview.anchorTop=pos&&pos.top!=null?pos.top+'px':'auto';
      wmPreview.anchorBottom=pos&&pos.bottom!=null?pos.bottom+'px':'auto';
      wmPreview.anchorY=getAnchorV()==='m'?'-50%':'0';
    }
  }

  const wmTileStyle=computed(()=>{
    if(wmPos.value!=='tile'||!activeLayer.value||!imgRect.w) return{};
    if(wmType.value==='text'&&wmText.value){
      const fs=Math.round(wmFontSize.value*imgRect.w/600);const {w:tw}=measureText(wmText.value,fs);
      const th=fs;const sp=Math.round(wmSpacing.value*imgRect.w/600);
      const cx=(tw+sp)/2,cy=(th+sp)/2;
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${tw+sp}" height="${th+sp}"><text x="${cx}" y="${cy}" font-size="${fs}" fill="white" stroke="rgba(0,0,0,0.4)" stroke-width="1" text-anchor="middle" dy="${fs*0.35}" transform="rotate(${wmRotate.value},${cx},${cy})">${wmText.value}</text></svg>`;
      return{backgroundImage:`url("data:image/svg+xml,${encodeURIComponent(svg)}")`,backgroundRepeat:'repeat',opacity:wmOpacity.value/100};
    }
    if(wmType.value==='image'&&wmImgObj.value){
      const iw=Math.round(wmImgW.value*imgRect.w/600),ih=Math.round(iw*wmImgObj.value.naturalHeight/wmImgObj.value.naturalWidth);
      const sp=Math.round(wmSpacing.value*imgRect.w/600);
      const c=document.createElement('canvas');c.width=iw+sp;c.height=ih+sp;const ctx=c.getContext('2d');
      ctx.translate((iw+sp)/2,(ih+sp)/2);ctx.rotate(wmRotate.value*Math.PI/180);
      ctx.drawImage(wmImgObj.value,-iw/2,-ih/2,iw,ih);
      return{backgroundImage:`url(${c.toDataURL()})`,backgroundRepeat:'repeat',opacity:wmOpacity.value/100};
    }
    return{};
  });

  watch(wmType,(v)=>{
    if(v==='text'){wmPos.value='tile';wmOpacity.value=30;wmRotate.value=-45;wmSpacing.value=100;}
    else{wmPos.value='grid';wmGridPos.value='br';wmOpacity.value=100;wmRotate.value=0;wmSpacing.value=60;}
    updateWmPreview();
  });
  watch([wmText,wmFontSize,wmImgUrl,wmImgW,wmOpacity,wmRotate,wmSpacing,wmPos,wmGridPos,wmX,wmY],()=>{if(!activeLayer.value||!imgRect.w) return;updateWmPreview();});
  watch(activeLayer,()=>{wmPreview.show=false;});

  async function addWmImage(){
    const p=await window.electron.openFile();if(!p) return;
    const u=await window.electron.readAsDataUrl(p);if(!u) return;
    wmImgUrl.value=u;const i=new Image();i.onload=()=>{wmImgObj.value=i;updateWmPreview();};i.src=u;
  }

  function getWmPos(origW,origH,wmW,wmH){return getPreviewPos(origW,origH,wmW,wmH);}

  function drawWatermark(ctx,origW,origH,wmImg,scale){
    ctx.globalAlpha=wmOpacity.value/100;const angle=wmRotate.value*Math.PI/180;
    if(wmType.value==='text'){
      const text=wmText.value;if(!text) return;
      const fontSize=Math.round(wmFontSize.value*scale);
      ctx.font=`${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`;
      ctx.fillStyle='#ffffff';ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1;
      const tw=ctx.measureText(text).width;
      const sp=Math.round(wmSpacing.value*scale);
      if(wmPos.value==='tile'){const gy=fontSize+sp;for(let y=-(fontSize+sp/2);y<origH+fontSize;y+=gy)for(let x=-(tw+sp/2);x<origW+tw;x+=tw+sp){ctx.save();ctx.translate(x+tw/2,y+fontSize/2);ctx.rotate(angle);ctx.strokeText(text,-tw/2,fontSize*0.35);ctx.fillText(text,-tw/2,fontSize*0.35);ctx.restore();}}
      else{const pos=getWmPos(origW,origH,tw,fontSize);if(!pos) return;ctx.save();const av=getAnchorV();let cy,by;if(wmPos.value==='custom'){cy=pos.top;by=fontSize*0.35;}else if(av==='t'){cy=0;by=fontSize*0.8;}else if(av==='b'){cy=origH;by=-(fontSize*0.2);}else{cy=origH/2;by=fontSize*0.35;}ctx.translate(pos.x,cy);ctx.rotate(angle);ctx.strokeText(text,-tw/2,by);ctx.fillText(text,-tw/2,by);ctx.restore();}
    }else{
      if(!wmImg) return;const iw=Math.round(wmImgW.value*scale),ih=Math.round(iw*wmImg.naturalHeight/wmImg.naturalWidth);
      const sp=Math.round(wmSpacing.value*scale);
      if(wmPos.value==='tile'){const gx=iw+sp,gy=ih+sp;for(let y=-(ih+sp/2);y<origH+ih;y+=gy)for(let x=-(iw+sp/2);x<origW+iw;x+=gx){ctx.save();ctx.translate(x+iw/2,y+ih/2);ctx.rotate(angle);ctx.drawImage(wmImg,-iw/2,-ih/2,iw,ih);ctx.restore();}}
      else{const pos=getWmPos(origW,origH,iw,ih);if(!pos) return;ctx.save();const av=getAnchorV();let cy,dy;if(wmPos.value==='custom'){cy=pos.top;dy=-ih/2;}else if(av==='t'){cy=0;dy=0;}else if(av==='b'){cy=origH;dy=-ih;}else{cy=origH/2;dy=-ih/2;}ctx.translate(pos.x,cy);ctx.rotate(angle);ctx.drawImage(wmImg,-iw/2,dy,iw,ih);ctx.restore();}
    }
    ctx.globalAlpha=1;
  }

  async function applyWatermark(dataUrl){
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(null);i.src=dataUrl;}).catch(()=>null);
    if(!img) return null;
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    let wmImg=null;
    if(wmType.value==='image'&&wmImgUrl.value){wmImg=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(null);i.src=wmImgUrl.value;}).catch(()=>null);if(!wmImg) return null;}
    drawWatermark(ctx,img.naturalWidth,img.naturalHeight,wmImg,img.naturalWidth/600);
    const result=c.toDataURL('image/png');const hl=result.indexOf(',')+1;return{dataUrl:result,size:Math.round((result.length-hl)*3/4)};
  }

  async function doOverwrite(){
    const l=activeLayer.value;if(!l){ElMessage.warning('请先选中图片');return;}if(!l.filePath){ElMessage.warning('该文件无路径，无法覆盖');return;}
    try{await ElMessageBox.confirm(`确认覆盖 ${l.name}？`,'确认覆盖',{confirmButtonText:'覆盖',cancelButtonText:'取消',type:'warning'});}catch(_e){return;}
    overwriting.value=true;try{const r=await applyWatermark(l.dataUrl);if(!r){ElMessage.error('处理失败');return;}
      const ok=await window.electron.writeFile(l.filePath,r.dataUrl);if(ok) ElMessage.success('已覆盖');else ElMessage.error('写入失败');}catch(e){ElMessage.error('覆盖失败：'+e.message);}finally{overwriting.value=false;}
  }

  async function exportAll(){
    const l=activeLayer.value;if(!l){ElMessage.warning('请先选中图片');return;}const folder=await window.electron.openFolder();if(!folder){return;}
    exporting.value=true;try{const r=await applyWatermark(l.dataUrl);if(!r){ElMessage.error('处理失败');return;}
      const name=l.name.replace(/\.[^.]+$/,'');const out=`${folder}\\watermarked_${name}.png`;
      const ok=await window.electron.writeFile(out,r.dataUrl);if(ok) ElMessage.success(`已导出到 ${folder}`);else ElMessage.error('导出失败');}catch(e){ElMessage.error('导出失败：'+e.message);}finally{exporting.value=false;}
  }
</script>

<style scoped>
  .wm-overlay{position:absolute;top:0;left:0;overflow:hidden;pointer-events:none;}
  .wm-tile{position:absolute;top:0;left:0;width:100%;height:100%;}
  .wm-text{position:absolute;white-space:nowrap;font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-weight:400;line-height:1;}
  .wm-image{position:absolute;}
</style>
