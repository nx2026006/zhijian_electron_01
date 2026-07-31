<template>
  <div class='app-body'>
    <WorkspaceToolbar :disabled='loading'
      @addImages='addImages' @addFolder='addFolder' @clearAll='clearAll' />

    <div class='content-body'>
      <ImageGrid :items='layers' :loading='loading||overwriting||exporting'
        :loading-text='loading?"导入中...":"处理中..."'
        grid-cols='72px 1fr 1fr 100px 90px 72px'
        :row-style='{cursor:"grab"}'
        @drop='onDrop'>
        <template #header>
          <span class='col-thumb'>缩略图</span>
          <span class='col-name'>原文件名</span>
          <span class='col-new-name'>新文件名</span>
          <span class='col-size'>尺寸</span>
          <span class='col-file'>大小</span>
          <span class='col-action'>操作</span>
        </template>
        <template #row='{item:l,index:idx}'>
          <div class='col-thumb' @click.stop>
            <el-image class='row-thumb' :src='l.thumbUrl||l.dataUrl'
              :preview-src-list='previewList' :initial-index='idx' fit='cover'></el-image>
          </div>
          <div class='col-name'>
            <el-tooltip :content='l.name' placement='top' :show-after='100' :show-arrow='false' :disabled='l.name.length<20'>
              <span class='row-filename'>{{l.name}}</span>
            </el-tooltip>
          </div>
          <div class='col-new-name'><span class='new-name-text'>{{getNewName(l,idx)}}</span></div>
          <div class='col-size'>{{l.origWidth}}×{{l.origHeight}}</div>
          <div class='col-file'>{{l.size||'-'}}</div>
          <div class='col-action'>
            <div class='btn-delete' @click.stop='delLayer(l)'><el-icon :size='16'><Delete></Delete></el-icon></div>
          </div>
        </template>
      </ImageGrid>

      <SidePanel>
        <template #config>
          <FormSection title='命名方式'>
            <el-radio-group v-model='nameMode' size='large' style='width:100%' :disabled='loading'>
              <el-radio-button value='rule'>命名规则</el-radio-button>
              <el-radio-button value='custom'>自定义</el-radio-button>
            </el-radio-group>
          </FormSection>
          <template v-if='nameMode==="rule"'>
            <FormSection title='名称前缀'>
              <el-input v-model='namePrefix' size='large' placeholder='如 photo_' :disabled='loading' clearable></el-input>
            </FormSection>
            <FormSection title='补零位数'>
              <el-input-number v-model='padLen' :min='0' :max='6' size='large' style='width:100%' :disabled='loading' controls-position='right'></el-input-number>
            </FormSection>
            <FormSection title='起始序号'>
              <el-input-number v-model='startNum' :min='0' :max='99999' size='large' style='width:100%' :disabled='loading' controls-position='right'></el-input-number>
            </FormSection>
            <FormSection title='序号间隔'>
              <el-input-number v-model='numStep' :min='1' :max='100' size='large' style='width:100%' :disabled='loading' controls-position='right'></el-input-number>
            </FormSection>
          </template>
          <template v-if='nameMode==="custom"'>
            <FormSection title='自定义规则'>
              <el-input v-model='customRule' size='large' placeholder='photo_{num}{ext}' :disabled='loading' clearable spellcheck='false'></el-input>
              <div class='rule-help'>
                <p class='help-label'>可用占位符：</p>
                <p class='help-line'><code>{num}</code> 序号，如 <code>1,2,3</code></p>
                <p class='help-line'><code>{num+2}</code> 间隔，如 <code>1,3,5</code></p>
                <p class='help-line'><code>{num:3}</code> 补零，如 <code>001</code></p>
                <p class='help-line'><code>{num+2:3}</code> 间隔+补零，如 <code>001,003</code></p>
                <p class='help-line'><code>{ext}</code> 原扩展名（含点），如 <code>.jpg</code></p>
                <p class='help-line'><code>{orig}</code> 原文件名（不含扩展名），如 <code>photo</code></p>
              </div>
            </FormSection>
          </template>
        </template>
        <template #footer>
          <el-button size='large' @click='doOverwrite'
            :loading='overwriting' :disabled='!layers.length||loading'>覆盖原文件</el-button>
          <el-button type='primary' size='large' @click='exportRenamed'
            :loading='exporting' :disabled='overwriting||!layers.length||loading'>导出新文件</el-button>
        </template>
      </SidePanel>
    </div>
  </div>
</template>

<script setup>
  import {ref,computed} from 'vue';
  import {Delete} from '@element-plus/icons-vue';
  import {ElMessage,ElMessageBox} from 'element-plus';
  import {WorkspaceToolbar,ImageGrid,SidePanel,FormSection} from '@/components/workspace/index.js';
  import {useImageImport} from '@/composables/useImageImport.js';

  const {layers,loading,addImages,addFolder,onDrop,clearAll,delLayer}=useImageImport();

  const overwriting=ref(false);
  const exporting=ref(false);
  const nameMode=ref('rule');
  const namePrefix=ref('photo_');
  const padLen=ref(0);
  const startNum=ref(1);
  const numStep=ref(1);
  const customRule=ref('{num}{ext}');

  const previewList=computed(()=>layers.map(l=>l.dataUrl));

  function getNewName(l,idx){
    const origExt=l.name.match(/\.\w+$/)?.[0]||'.jpg';
    const origBase=l.name.replace(/\.[^.]+$/,'');
    if(nameMode.value==='custom'){
      const base=customRule.value||'{num}{ext}';
      const num=startNum.value+idx*numStep.value;
      return base
        .replace(/\{num\+(\d+):(\d+)\}/g,(_,off,pad)=>String(num+Number(off)).padStart(pad,'0'))
        .replace(/\{num\+(\d+)\}/g,(_,off)=>String(num+Number(off)))
        .replace(/\{num:(\d+)\}/g,(_,pad)=>String(num).padStart(pad,'0'))
        .replace(/\{num\}/g,String(num))
        .replace(/\{ext\}/g,origExt)
        .replace(/\{orig\}/g,origBase);
    }
    const num=startNum.value+idx*numStep.value;
    const numStr=padLen.value>0?String(num).padStart(padLen.value,'0'):String(num);
    return `${namePrefix.value}${numStr}${origExt}`;
  }

  async function doOverwrite(){
    if(!layers.length){ElMessage.warning('请先添加图片');return;}
    try{await ElMessageBox.confirm(`确认覆盖重命名 ${layers.length} 个文件？`,'确认覆盖',{confirmButtonText:'覆盖',cancelButtonText:'取消',type:'warning'});}catch(_e){return;}
    overwriting.value=true;
    try{
      let ok=0;
      for(let i=0;i<layers.length;i++){
        const l=layers[i];
        const newName=getNewName(l,i);
        const dir=l.filePath.split('\\').slice(0,-1).join('\\');
        const newPath=`${dir}\\${newName}`;
        const r=await window.electron.renameFile(l.filePath,newPath);
        if(r){l.name=newName;l.filePath=newPath;ok++;}
      }
      if(ok) ElMessage.success(`已重命名 ${ok} 个文件`);
      else ElMessage.error('重命名失败');
    }catch(e){ElMessage.error('重命名失败：'+e.message);}
    finally{overwriting.value=false;}
  }

  async function exportRenamed(){
    if(!layers.length){ElMessage.warning('请先添加图片');return;}
    const folder=await window.electron.openFolder();
    if(!folder){return;}
    exporting.value=true;
    try{
      let count=0;
      for(let i=0;i<layers.length;i++){
        const l=layers[i];
        const newName=getNewName(l,i);
        const out=`${folder}\\${newName}`;
        const r=await window.electron.writeFile(out,l.dataUrl);
        if(r){l.outputPath=out;count++;}
      }
      if(count) ElMessage.success(`已导出 ${count} 个文件到 ${folder}`);
    }catch(e){ElMessage.error('导出失败：'+e.message);}
    finally{exporting.value=false;}
  }
</script>

<style lang='scss' scoped>
  .col-new-name{display:flex;align-items:center;min-width:0;overflow:hidden;padding:0 8px;}
  .new-name-text{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap;color:$color-primary;}
  .rule-help{margin-top:8px;padding:10px 12px;background:$bg-sidebar;border-radius:$border-radius;font-size:12px;color:$text-secondary;
    .help-label{margin-bottom:6px;font-weight:600;}
    .help-line{margin:3px 0;line-height:1.6;
      code{padding:1px 5px;border-radius:2px;background:$bg-hover;font-size:11px;color:$color-primary;}
    }
  }
</style>
