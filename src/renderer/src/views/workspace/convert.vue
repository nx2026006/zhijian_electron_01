<template>
  <div class='app-body'>
    <WorkspaceToolbar :disabled='converting||loading'
      @addImages='addImages' @addFolder='addFolder' @clearAll='clearAll' />

    <div class='content-body'>
      <ImageGrid :items='layers' :loading='loading'
        :loading-text='"导入中..."'
        grid-cols='72px 1fr 110px 90px 90px 140px 72px'
        @drop='onDrop'>
        <template #header>
          <span class='col-thumb'>缩略图</span>
          <span class='col-name'>文件名</span>
          <span class='col-size'>格式</span>
          <span class='col-file'>大小</span>
          <span class='col-status'>状态</span>
          <span class='col-effect'>转换结果</span>
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
          <div class='col-size'>{{l.name.match(/\.(\w+)$/)?.[1]||''}}</div>
          <div class='col-file'>{{l.size||'-'}}</div>
          <div class='col-status'>
            <span v-if='l.convertedFmt' class='status-tag done'>转换成功</span>
            <span v-else-if='l._converting' class='status-tag processing'>正在处理</span>
            <span v-else class='status-tag waiting'>等待处理</span>
          </div>
          <div class='col-effect'>
            <template v-if='l.convertedFmt'>
              <span class='effect-size' v-if='l.convertedSize'>{{l.convertedSize}}</span>
              <span class='effect-fmt'>{{l.convertedFmt}}</span>
            </template>
            <div class='effect-bar' v-else-if='l._converting'>
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
          <FormSection title='目标格式'>
            <el-select v-model='targetFmt' size='large' style='width:100%' :disabled='converting'>
              <el-option v-for='f in supportedFormats' :key='f.value' :value='f.value' :label='f.label'></el-option>
            </el-select>
          </FormSection>
          <FormSection title='输出质量' v-if='needQuality'>
            <SliderControl v-model='convertQuality' :min='10' :max='100' suffix='%' :disabled='converting'></SliderControl>
          </FormSection>
          <FormSection title=''>
            <el-button type='primary' size='large' style='width:100%' @click='startConvert'
              :loading='converting' :disabled='converting||loading'>开始转换</el-button>
          </FormSection>
        </template>
        <template #footer>
          <el-button size='large' @click='doOverwrite'
            :loading='overwriting' :disabled='!canExport||converting||exporting||loading'>覆盖原文件</el-button>
          <el-button type='primary' size='large' @click='exportAll'
            :loading='exporting' :disabled='!canExport||converting||overwriting||loading'>导出新文件</el-button>
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
  import {formatSize,loadImageData,convertViaCanvas,encodeBmp,encodeIco} from '@/utils/image.js';
  import {FORMAT_OPTIONS} from '@/constants/workspace.js';

  const {layers,loading,addImages,addFolder,onDrop,clearAll,delLayer}=useImageImport();

  const converting=ref(false);
  const progress=ref(0);
  const overwriting=ref(false);
  const exporting=ref(false);
  const targetFmt=ref('jpg');
  const convertQuality=ref(100);

  const supportedFormats=FORMAT_OPTIONS;
  const needQuality=computed(()=>targetFmt.value==='jpg'||targetFmt.value==='webp');
  const previewList=computed(()=>layers.map(l=>l.dataUrl));
  const canExport=computed(()=>layers.some(l=>l.convertedUrl));

  async function convertOne(dataUrl,fmt,quality){
    if(fmt==='bmp'){
      const info=await loadImageData(dataUrl);
      if(!info) return null;
      const bmpUrl=encodeBmp(info.imageData,info.width,info.height);
      const headerLen=bmpUrl.indexOf(',')+1;
      return {dataUrl:bmpUrl,size:Math.round((bmpUrl.length-headerLen)*3/4)};
    }
    if(fmt==='ico') return await encodeIco(dataUrl,64);
    return await convertViaCanvas(dataUrl,fmt,quality);
  }

  async function startConvert(){
    if(loading.value){ElMessage.warning('导入中，请稍后再试');return;}
    if(!layers.length){ElMessage.warning('请先添加图片');return;}
    converting.value=true;
    progress.value=0;
    const progressTimer=setInterval(()=>{if(progress.value<90) progress.value+=Math.max(1,Math.floor(Math.random()*5));},300);let ok=0;
    const list=[...layers];
    for(const l of list) l._converting=true;
    const batchSize=3;
    for(let i=0;i<list.length;i+=batchSize){
      const batch=list.slice(i,i+batchSize);
      const results=await Promise.all(batch.map(l=>convertOne(l.dataUrl,targetFmt.value,convertQuality.value)));
      for(let j=0;j<batch.length;j++){
        const l=batch[j];const r=results[j];l._converting=false;
        if(r){
          l.convertedUrl=r.dataUrl;l.convertedSize=formatSize(r.size);
          l.convertedRawSize=r.size;l.convertedFmt=targetFmt.value;ok++;
        }
      }
    }
    clearInterval(progressTimer);
    progress.value=100;
    await new Promise(r=>setTimeout(r,400));
    converting.value=false;
    if(ok) ElMessage.success(`转换完成 ${ok}/${list.length} 张`);
    else ElMessage.error('转换失败');
  }

  async function doOverwrite(){
    const targets=layers.filter(l=>l.convertedUrl);
    if(!targets.length){ElMessage.warning('没有可覆盖的已转换图片');return;}
    overwriting.value=true;
    try{
      let ok=0;
      for(const l of targets){
        const r=await window.electron.writeFile(l.filePath,l.convertedUrl);
        if(r){l.dataUrl=l.convertedUrl;ok++;}
      }
      if(ok) ElMessage.success(`已覆盖 ${ok} 张`);
      else ElMessage.error('覆盖失败');
    }catch(e){ElMessage.error('覆盖失败：'+e.message);}
    finally{overwriting.value=false;}
  }

  async function exportAll(){
    const targets=layers.filter(l=>l.convertedUrl);
    if(!targets.length){ElMessage.warning('没有可导出的已转换图片');return;}
    const folder=await window.electron.openFolder();
    if(!folder){return;}
    exporting.value=true;
    try{
      let count=0;
      for(const l of targets){
        const name=l.name.replace(/\.[^.]+$/,'');
        const out=`${folder}\\converted_${name}.${targetFmt.value}`;
        const r=await window.electron.writeFile(out,l.convertedUrl);
        if(r){l.outputPath=out;count++;}
      }
      if(count) ElMessage.success(`已导出 ${count} 张到 ${folder}`);
    }catch(e){ElMessage.error('导出失败：'+e.message);}
    finally{exporting.value=false;}
  }
</script>

<style lang='scss' scoped>
  .effect-bar{width:70px;height:4px;background:$border-color;border-radius:2px;overflow:hidden;
    .bar-fill{height:100%;background:$color-primary;border-radius:2px;transition:width .3s;}
  }
  .effect-fmt{display:inline-block;padding:2px 6px;border-radius:3px;background:rgba(22,100,255,.08);color:$color-primary;font-size:12px;font-weight:600;line-height:1.4;}
  .effect-size{font-size:13px;color:$text-secondary;line-height:1;}
</style>
