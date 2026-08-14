<template>
  <div class='app-body'>
    <WorkspaceToolbar :disabled='compressing||loading'
      @addImages='addImages' @addFolder='addFolder' @clearAll='clearAll' />

    <div class='content-body'>
      <ImageGrid :items='layers' :loading='loading'
        :loading-text='"导入中..."'
        grid-cols='72px 1fr 110px 90px 90px 140px 72px'
        @drop='onDrop'>
        <template #header>
          <span class='col-thumb'>缩略图</span>
          <span class='col-name'>文件名</span>
          <span class='col-size'>尺寸</span>
          <span class='col-file'>大小</span>
          <span class='col-status'>状态</span>
          <span class='col-effect'>压缩效果</span>
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
            <span v-if='l.compressRate' class='status-tag done'>压缩成功</span>
            <span v-else-if='l._error' class='status-tag error'>压缩失败</span>
            <span v-else-if='l._active' class='status-tag processing'>压缩中</span>
            <span v-else-if='l._processing' class='status-tag pending'>排队中</span>
            <span v-else class='status-tag waiting'>等待处理</span>
          </div>
          <div class='col-effect'>
            <template v-if='l.compressRate'>
              <span class='effect-size'>{{l.compressSize}}</span>
              <span class='effect-rate'>
                <img class='rate-icon' :src='downSvg'><span class='rate-text'>{{l.compressRate}}%</span>
              </span>
            </template>
            <div class='effect-bar' v-else-if='l._processing'>
              <div class='bar-fill' :style='{width:(l._progress||0)+"%"}'></div>
            </div>
            <span v-else class='effect-none'>-</span>
          </div>
          <div class='col-action'>
            <div class='btn-delete' @click.stop='delLayer(l)'><el-icon :size='16'><Delete></Delete></el-icon></div>
          </div>
        </template>
      </ImageGrid>

      <SidePanel>
        <template #config>
          <FormSection title='压缩方式'>
            <el-radio-group v-model='compressMode' size='large' style='width:100%' :disabled='compressing'>
              <el-radio-button value='degree'>压缩程度</el-radio-button>
              <el-radio-button value='custom'>自定义</el-radio-button>
            </el-radio-group>
          </FormSection>
          <FormSection title='压缩质量' v-if='compressMode==="degree"'>
            <el-select v-model='compressLevel' size='large' style='width:100%' :disabled='compressing'>
              <el-option value='low' label='轻度 (最清晰)'></el-option>
              <el-option value='medium' label='中度 (品质均衡)'></el-option>
              <el-option value='high' label='深度 (最小体积)'></el-option>
            </el-select>
          </FormSection>
          <FormSection title='压缩质量' v-if='compressMode==="custom"'>
            <SliderControl v-model='customQuality' :min='10' :max='100' suffix='%' :disabled='compressing'></SliderControl>
          </FormSection>
          <FormSection title=''>
            <el-button type='primary' size='large' style='width:100%' @click='startCompress'
              :loading='compressing' :disabled='compressing||loading'>开始压缩</el-button>
          </FormSection>
        </template>
        <template #footer>
          <el-button size='large' @click='doOverwrite'
            :loading='overwriting' :disabled='!canExport||compressing||exporting||loading'>覆盖原文件</el-button>
          <el-button type='primary' size='large' @click='exportAll'
            :loading='exporting' :disabled='!canExport||compressing||overwriting||loading'>导出新文件</el-button>
        </template>
      </SidePanel>
    </div>
  </div>

  <!-- 自定义弹窗 -->
  <div v-if='tokenDialog.visible' class='api-key-overlay' @click.self='onTokenCancel'>
    <div class='api-key-dialog'>
      <div class='api-key-header'>
        <span class='api-key-title'>{{tokenDialog.title}}</span>
        <span class='api-key-close' @click='onTokenCancel'>✕</span>
      </div>
      <div class='api-key-body'>
        <template v-if='tokenDialog.mode==="confirm"'>
          <p class='api-key-msg'>API Key 验证失败，是否更新？</p>
        </template>
        <template v-else>
          <p class='api-key-contact'>获取api key，请加入qq群：1105028359</p>
          <input ref='tokenInputRef' v-model='tokenInput' class='api-key-input' placeholder='请输入 NX_API_KEY' @keyup.enter='onTokenConfirm'>
        </template>
      </div>
      <div class='api-key-footer'>
        <button class='api-key-btn cancel' @click='onTokenCancel'>取消</button>
        <button class='api-key-btn confirm' @click='onTokenConfirm'>{{tokenDialog.confirmText||'确认'}}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {ref,reactive,computed,nextTick} from 'vue';
  import {Delete} from '@element-plus/icons-vue';
  import downSvg from '@/assets/images/down.svg';
  import {ElMessage} from 'element-plus';
  import {WorkspaceToolbar,ImageGrid,SidePanel,FormSection,SliderControl} from '@/components/workspace/index.js';
  import {useImageImport} from '@/composables/useImageImport.js';
  import {compressImage} from '@/api/modules/compress.js';
  import {useApiStore} from '@/stores/index.js';
  import {formatSize} from '@/utils/image.js';

  const apiStore=useApiStore();
  const {layers,loading,addImages,addFolder,onDrop,clearAll,delLayer}=useImageImport();

  const compressing=ref(false);
  const overwriting=ref(false);
  const exporting=ref(false);
  const compressMode=ref('degree');
  const compressLevel=ref('medium');
  const customQuality=ref(80);

  // Token 弹窗（自定义，不用 Element 组件）
  let tokenResolve=null;
  const tokenDialog=reactive({
    visible:false,
    mode:'input',// 'input' | 'confirm'
    title:'API Key 设置',
    confirmText:'确认',
  });
  const tokenInput=ref('');
  const tokenInputRef=ref(null);

  function showTokenDialog(mode,title,confirmText){
    tokenDialog.mode=mode;
    tokenDialog.title=title;
    tokenDialog.confirmText=confirmText||'确认';
    tokenInput.value='';
    tokenDialog.visible=true;
    if(mode==='input') nextTick(()=>{tokenInputRef.value&&tokenInputRef.value.focus();});
    return new Promise((resolve)=>{tokenResolve=resolve;});
  }
  function onTokenConfirm(){
    const val=tokenInput.value.trim();
    if(tokenDialog.mode==='input'&&!val) return;
    tokenDialog.visible=false;
    if(tokenResolve) tokenResolve(tokenDialog.mode==='input'?val:true);
  }
  function onTokenCancel(){
    tokenDialog.visible=false;
    if(tokenResolve) tokenResolve(null);
  }

  const previewList=computed(()=>layers.map(l=>l.dataUrl));
  const canExport=computed(()=>layers.some(l=>l.compressedUrl));

  function getQuality(){
    if(compressMode.value==='custom') return customQuality.value;
    return {low:90,medium:75,high:50}[compressLevel.value]||75;
  }

  function chunk(arr,size){
    const r=[];
    for(let i=0;i<arr.length;i+=size) r.push(arr.slice(i,i+size));
    return r;
  }

  function applyCompressResult(items,layers,quality){
    let ok=0;
    for(let i=0;i<layers.length;i++){
      const l=layers[i];
      const item=items[i];
      if(!item||item.error){l._error=item?.error||'请求失败';continue;}
      l.compressedUrl=item.compressedUrl;
      l.rawCompressSize=item.compressedSize;
      l.compressSize=formatSize(item.compressedSize);
      if(!l.rawSize){
        l.rawSize=item.originalSize;
        l.size=formatSize(item.originalSize);
      }
      l.compressRate=l.rawSize?Math.max(1,Math.round((1-item.compressedSize/l.rawSize)*100)):0;
      ok++;
    }
    for(const l of layers){
      if(items[layers.indexOf(l)]&&!items[layers.indexOf(l)].error){
        l._compressedQuality=quality;
      }
    }
    return ok;
  }

  // ===== API 错误统一处理 =====
  let authCancelled=false;// 跨批次去重
  let fatalError=false;// 致命错误（auth 取消 / 余额不足），命中后停止后续批次
  let progressPaused=false;// 弹窗期间暂停进度条
  async function handleApiError(code,message,errorType){
    const msg=message||errorType||'未知错误';
    // 余额不足：code===20000 或 message 含"余额"，致命，停止后续
    if(code===20000||(msg&&msg.includes('余额'))){
      ElMessage.error({message:'账户余额不足，请加入qq群：1105028359 充值',duration:6000});
      fatalError=true;
      return false;
    }
    // auth 失败：暂停进度→确认→输入新 key→重试，取消则为致命
    if(errorType==='auth_failed'||code===40004){
      if(authCancelled) return false;
      ElMessage.error(msg);
      progressPaused=true;
      const confirmed=await showTokenDialog('confirm','API Key 错误','更新');
      if(!confirmed){progressPaused=false;authCancelled=true;fatalError=true;return false;}
      const newToken=await showTokenDialog('input','API Key 设置','确认');
      progressPaused=false;
      if(!newToken){authCancelled=true;fatalError=true;return false;}
      apiStore.setToken(newToken);
      await window.electron.setToken(newToken);
      return true;
    }
    // 其他错误：不致命，继续后续批次
    ElMessage.error(msg);
    return false;
  }

  // ===== 接口直连压缩 =====
  async function compressViaApi(batch,quality){
    let n=0;
    try{
      const urls=[],files=[];
      for(const l of batch){
        if(l.dataUrl&&l.dataUrl.startsWith('data:')) files.push(l.dataUrl);
        else urls.push(l.filePath);
      }
      const params={quality};
      if(urls.length) params.urls=urls;
      if(files.length) params.files=files;
      const res=await compressImage(params);
      const batchKb=Math.round(batch.reduce((s,l)=>s+((l.dataUrl||'').length*0.75||0),0)/1024);
      console.log(`[compress] ${new Date().toISOString().slice(11,23)} ${batch.length}张 ~${batchKb}KB → ${res.code===0?res.message:`code:${res.code} ${res.message}`}`);
      if(res.code===0){
        const items=res.data.items.map(it=>({
          compressedUrl:it.compressed_url,
          compressedSize:it.compressed_size,
          originalSize:it.original_size,
          error:it.error,
        }));
        n=applyCompressResult(items,batch,quality);
      }else{
        // API 业务错误
        if(await handleApiError(res.code,res.message,res.error_type)){
          return await compressViaApi(batch,quality);
        }
      }
    }catch(e){
      console.error('[compress] API 异常:',e);
      // axios 返回的业务错误（HTTP 非 2xx + response body）
      const body=e?.response?.data;
      if(body&&body.code){
        if(await handleApiError(body.code,body.message,body.error_type)){
          return await compressViaApi(batch,quality);
        }
      }else{
        ElMessage.error('网络请求失败，请检查网络后重试');
      }
    }
    return n;
  }

  async function startCompress(){
    const quality=getQuality();
    const allUncompressed=layers.filter(l=>!l.compressSize||l._compressedQuality!==quality);
    if(loading.value){ElMessage.warning('导入中，请稍后再试');return;}
    if(!layers.length){ElMessage.warning('请先添加图片');return;}
    if(!allUncompressed.length){ElMessage.info('所有图片已压缩');return;}
    authCancelled=false;fatalError=false;progressPaused=false;
    // ===== Token 检查 =====
    if(!apiStore.token){
      const value=await showTokenDialog('input','API Key 设置','确认');
      if(!value){ElMessage.warning('未配置 API Key，已取消');return;}
      await window.electron.setToken(value);
      apiStore.setToken(value);
    }
    compressing.value=true;
    const batches=chunk(allUncompressed,2);
    for(const l of allUncompressed){l._processing=true;l._progress=0;}
    // 每张图独立进度：0 → 随机涨到 ~90% → API 返回 → 100%
    const progressTimer=setInterval(()=>{
      if(progressPaused) return;
      for(const l of allUncompressed){
        if(l._active&&(l._progress||0)<90){
          l._progress=(l._progress||0)+Math.max(2,Math.floor(Math.random()*7));
        }
      }
    },300);
    // ===== 预请求：第一批先串行验证 Key/余额 =====
    const [firstBatch]=batches;
    for(const l of firstBatch) l._active=true;
    let ok=await compressViaApi(firstBatch,quality);
    console.log(`[progress] 批次1/${batches.length} 预检 → ${ok>0?'ok':'fail'}`);
    for(const l of firstBatch){
      l._processing=false;l._active=false;
      l._progress=ok>0?100:0;
    }
    if(fatalError){
      for(const l of allUncompressed){if(l._processing&&!l._active) l._processing=false;}
      clearInterval(progressTimer);
      compressing.value=false;
      return;
    }
    // 预检通过，剩余批次并发池 2
    const CONCURRENCY=2;
    let idx=1;
    async function runWorker(workerId){
      while(idx<batches.length&&!fatalError){
        const i=idx++;
        const batch=batches[i];
        for(const l of batch) l._active=true;
        const t0=Date.now();
        const n=await compressViaApi(batch,quality);
        const elapsed=((Date.now()-t0)/1000).toFixed(1);
        console.log(`[progress] 批次${i+1}/${batches.length} W${workerId} → ${n>0?'ok':'fail'} ${elapsed}s`);
        for(const l of batch){
          l._processing=false;l._active=false;
          l._progress=n>0?100:0;
        }
        ok+=n;
      }
    }
    const workers=Array.from({length:CONCURRENCY},(_,i)=>runWorker(i+1));
    await Promise.all(workers);
    for(const l of allUncompressed){
      if(l._processing&&!l._active) l._processing=false;
    }
    clearInterval(progressTimer);
    await new Promise(r=>setTimeout(r,400));
    compressing.value=false;
    if(ok) ElMessage.success(`压缩完成 ${ok}/${allUncompressed.length} 张`);
  }

  async function doOverwrite(){
    const targets=layers.filter(l=>l.compressedUrl);
    if(!targets.length){ElMessage.warning('没有可覆盖的已压缩图片');return;}
    overwriting.value=true;
    try{
      let ok=0;
      for(const l of targets){
        const r=await window.electron.writeFile(l.filePath,l.compressedUrl);
        if(r){l.dataUrl=l.compressedUrl;ok++;}
      }
      if(ok) ElMessage.success(`已覆盖 ${ok} 张`);
      else ElMessage.error('覆盖失败');
    }catch(e){ElMessage.error('覆盖失败：'+e.message);}
    finally{overwriting.value=false;}
  }

  async function exportAll(){
    const targets=layers.filter(l=>l.compressedUrl);
    if(!targets.length){ElMessage.warning('没有可导出的已压缩图片');return;}
    const folder=await window.electron.openFolder();
    if(!folder){return;}
    exporting.value=true;
    try{
      let count=0;
      for(const l of targets){
        const name=l.name.replace(/\.[^.]+$/,'');
        const out=`${folder}\\compressed_${name}.jpg`;
        const res=await fetch(l.compressedUrl);
        const blob=await res.blob();
        const dataUrl=await new Promise((resolve)=>{
          const reader=new FileReader();
          reader.onloadend=()=>resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const r=await window.electron.writeFile(out,dataUrl);
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
  .effect-rate{display:inline-flex;align-items:center;gap:2px;color:$color-success;font-weight:500;position:relative;top:1px;
    .rate-icon{width:16px;height:16px;display:block;flex-shrink:0;}
    .rate-text{line-height:1;}
  }
  .effect-size{line-height:1;font-size:13px;color:$text-secondary;}
  .effect-none{color:$text-muted;}
</style>

<style lang='scss'>
  .api-key-overlay{
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:rgba(0,0,0,.45);z-index:2000;
    display:flex;align-items:center;justify-content:center;
  }
  .api-key-dialog{
    width:420px;background:#fff;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,.15);
  }
  .api-key-header{
    display:flex;align-items:center;justify-content:space-between;
    height:48px;padding:0 20px;border-bottom:1px solid #e8eaef;
  }
  .api-key-title{font-size:16px;font-weight:600;color:#1a1d26;}
  .api-key-close{
    position:relative;left:8px;
    width:28px;height:28px;display:flex;align-items:center;justify-content:center;
    border-radius:4px;cursor:pointer;color:#8e919e;font-size:16px;
    &:hover{background:#f3f5fa;color:#1a1d26;}
  }
  .api-key-body{padding:20px;}
  .api-key-msg{font-size:15px;color:#1a1d26;margin:0;}
  .api-key-contact{margin:0 0 20px;font-size:13px;color:rgba(26,29,38,.5);}
  .api-key-input{
    width:100%;height:40px;padding:0 12px;border:1px solid #e8eaef;border-radius:6px;
    font-size:14px;color:#1a1d26;outline:none;box-sizing:border-box;
    &:focus{border-color:#1664ff;box-shadow:0 0 0 2px rgba(22,100,255,.1);}
  }
  .api-key-footer{
    display:flex;justify-content:flex-end;gap:10px;
    padding:12px 20px;border-top:1px solid #e8eaef;
  }
  .api-key-btn{
    height:36px;padding:0 20px;border-radius:6px;font-size:14px;cursor:pointer;border:none;outline:none;
    &.cancel{background:#f3f5fa;color:#1a1d26;
      &:hover{background:#e8eaef;}
    }
    &.confirm{background:#1664ff;color:#fff;
      &:hover{background:#0050cc;}
    }
  }
</style>
