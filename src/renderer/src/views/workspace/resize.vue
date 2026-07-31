<template>
  <div class='app-body'>
    <WorkspaceToolbar :disabled='resizing||loading'
      @addImages='addImages' @addFolder='addFolder' @clearAll='clearAll' />

    <div class='content-body'>
      <ImageGrid :items='layers' :loading='loading'
        :loading-text='"导入中..."'
        grid-cols='72px 1fr 110px 90px 90px 140px 72px'
        @drop='onDrop'>
        <template #header>
          <span class='col-thumb'>缩略图</span>
          <span class='col-name'>文件名</span>
          <span class='col-size'>原尺寸</span>
          <span class='col-file'>大小</span>
          <span class='col-status'>状态</span>
          <span class='col-effect'>修改结果</span>
          <span class='col-action'>操作</span>
        </template>
        <template #row='{item:l}'>
          <div class='col-thumb' @click.stop>
            <el-image class='row-thumb' :src='l.thumbUrl||l.dataUrl'
              :preview-src-list='previewList' :initial-index='layers.indexOf(l)' fit='cover'></el-image>
          </div>
          <div class='col-name'>
            <el-tooltip :content='l.name' placement='top' :show-after='100' :show-arrow='false' :disabled='l.name.length<20'>
              <span class='row-filename'>{{l.name}}</span>
            </el-tooltip>
          </div>
          <div class='col-size'>{{l.origWidth}}×{{l.origHeight}}</div>
          <div class='col-file'>{{l.size||'-'}}</div>
          <div class='col-status'>
            <span v-if='l.resizedSize' class='status-tag done'>修改成功</span>
            <span v-else-if='l._resizing' class='status-tag processing'>正在处理</span>
            <span v-else class='status-tag waiting'>等待处理</span>
          </div>
          <div class='col-effect'>
            <template v-if='l.resizedSize'>
              <span class='effect-dims'>{{l.resizedWidth}}×{{l.resizedHeight}}</span>
            </template>
            <div class='effect-bar' v-else-if='l._resizing'>
              <div class='bar-fill' :style='{width:progress+"%"}'></div>
            </div>
            <span v-else>-</span>
          </div>
          <div class='col-action'>
            <div class='btn-delete' @click.stop='delLayer(l)'><el-icon :size='16'><Delete></Delete></el-icon></div>
          </div>
        </template>
      </ImageGrid>

      <SidePanel>
        <template #config>
          <FormSection title='缩放方式'>
            <el-radio-group v-model='resizeMode' size='large' style='width:100%' :disabled='resizing'>
              <el-radio-button value='percent'>按百分比</el-radio-button>
              <el-radio-button value='width'>按宽度</el-radio-button>
              <el-radio-button value='height'>按高度</el-radio-button>
            </el-radio-group>
          </FormSection>
          <FormSection title='缩放百分比' v-if='resizeMode==="percent"'>
            <SliderControl v-model='percentVal' :min='10' :max='200' suffix='%' :disabled='resizing'></SliderControl>
          </FormSection>
          <FormSection title='目标宽度 (px)' v-if='resizeMode==="width"'>
            <el-input-number v-model='targetW' :min='1' :max='99999' size='large' style='width:100%' :disabled='resizing' controls-position='right'></el-input-number>
          </FormSection>
          <FormSection title='目标高度 (px)' v-if='resizeMode==="height"'>
            <el-input-number v-model='targetH' :min='1' :max='99999' size='large' style='width:100%' :disabled='resizing' controls-position='right'></el-input-number>
          </FormSection>
          <FormSection title=''>
            <el-button type='primary' size='large' style='width:100%' @click='startResize' :loading='resizing' :disabled='resizing||loading'>开始修改</el-button>
          </FormSection>
        </template>
        <template #footer>
          <el-button size='large' @click='doOverwrite' :loading='overwriting' :disabled='!canExport||resizing||exporting||loading'>覆盖原文件</el-button>
          <el-button type='primary' size='large' @click='exportAll' :loading='exporting' :disabled='!canExport||resizing||overwriting||loading'>导出新文件</el-button>
        </template>
      </SidePanel>
    </div>
  </div>
</template>

<script setup>
  import {ref,computed} from 'vue';
  import {Delete} from '@element-plus/icons-vue';
  import {ElMessage} from 'element-plus';
  import {WorkspaceToolbar,ImageGrid,SidePanel,FormSection,SliderControl} from '@/components/workspace/index.js';
  import {useImageImport} from '@/composables/useImageImport.js';
  import {useBatchExport} from '@/composables/useWorkspace.js';
  import {formatSize} from '@/utils/image.js';

  const {layers,loading,addImages,addFolder,onDrop,clearAll,delLayer}=useImageImport();

  const resizing=ref(false);
  const progress=ref(0);
  const resizeMode=ref('percent');
  const percentVal=ref(50);
  const targetW=ref(1920);
  const targetH=ref(1080);

  const previewList=computed(()=>layers.map(l=>l.dataUrl));

  const {overwriting,exporting,canExport,doOverwrite:baseOverwrite,exportAll:baseExport}=useBatchExport(layers,'resizedUrl','resized');

  function calcSize(origW,origH){
    if(resizeMode.value==='percent'){
      const r=percentVal.value/100;
      return {w:Math.round(origW*r),h:Math.round(origH*r)};
    }
    if(resizeMode.value==='width'){
      const r=targetW.value/origW;
      return {w:targetW.value,h:Math.round(origH*r)};
    }
    const r=targetH.value/origH;
    return {w:Math.round(origW*r),h:targetH.value};
  }

  function resizeImage(dataUrl,w,h){
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>{
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        const result=c.toDataURL('image/jpeg',0.9);
        const headerLen=result.indexOf(',')+1;
        resolve({dataUrl:result,size:Math.round((result.length-headerLen)*3/4)});
      };
      img.onerror=()=>resolve(null);
      img.src=dataUrl;
    });
  }

  async function startResize(){
    if(loading.value){ElMessage.warning('导入中，请稍后再试');return;}
    if(!layers.length){ElMessage.warning('请先添加图片');return;}
    resizing.value=true;
    progress.value=0;
    const progressTimer=setInterval(()=>{if(progress.value<90) progress.value+=Math.max(1,Math.floor(Math.random()*5));},300);let ok=0;
    const list=[...layers];
    for(const l of list) l._resizing=true;
    const batchSize=3;
    for(let i=0;i<list.length;i+=batchSize){
      const batch=list.slice(i,i+batchSize);
      const results=await Promise.all(batch.map(l=>{
        const {w,h}=calcSize(l.origWidth,l.origHeight);
        return resizeImage(l.dataUrl,w,h);
      }));
      for(let j=0;j<batch.length;j++){
        const l=batch[j];const r=results[j];l._resizing=false;
        if(r){
          const {w,h}=calcSize(l.origWidth,l.origHeight);
          l.resizedUrl=r.dataUrl;l.resizedSize=formatSize(r.size);l.resizedRawSize=r.size;
          l.resizedWidth=w;l.resizedHeight=h;ok++;
        }
      }
    }
    clearInterval(progressTimer);
    progress.value=100;
    await new Promise(r=>setTimeout(r,400));
    resizing.value=false;
    if(ok) ElMessage.success(`修改完成 ${ok}/${list.length} 张`);
    else ElMessage.error('修改失败');
  }

  async function doOverwrite(){
    await baseOverwrite();// 使用 useBatchExport 的通用实现
  }

  async function exportAll(){
    await baseExport();// 使用 useBatchExport 的通用实现
  }
</script>

<style lang='scss' scoped>
  .effect-bar{width:70px;height:4px;background:$border-color;border-radius:2px;overflow:hidden;
    .bar-fill{height:100%;background:$color-primary;border-radius:2px;transition:width .3s;}
  }
  .col-effect{display:flex;align-items:center;justify-content:center;gap:8px;overflow:hidden;padding:0 8px;white-space:nowrap;}
  .effect-dims{font-weight:500;}
  .effect-size{font-size:13px;color:$text-secondary;line-height:1;}
</style>
