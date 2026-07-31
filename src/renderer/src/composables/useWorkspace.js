// 工作区辅助 composable — 滚动条检测 + 导出基础逻辑

import {ref,computed,watch,nextTick} from 'vue';
import {ElMessageBox,ElMessage} from 'element-plus';

// ===== 滚动条检测 =====
export function useScrollbarDetect(depRef){
  const elRef=ref(null);
  const hasScrollbar=ref(false);

  watch(depRef||(()=>{}),()=>{
    nextTick(()=>{
      if(elRef.value){
        hasScrollbar.value=elRef.value.scrollHeight>elRef.value.clientHeight;
      }
    });
  },{immediate:true});

  return {elRef,hasScrollbar};
}

// ===== 导出操作（单图模式） =====
export function useSingleExport(layers,activeLayer,resultKey,prefix='output'){
  const overwriting=ref(false);
  const exporting=ref(false);
  const canExport=computed(()=>!!activeLayer.value);

  // 覆盖原文件（单图）
  async function doOverwrite(applyFn){
    if(overwriting.value) return;
    const l=activeLayer.value;
    if(!l){ElMessage.warning('请先选中图片');return;}
    if(!l.filePath){ElMessage.warning('该文件无路径（拖拽导入），无法覆盖');return;}
    if(!applyFn){ElMessage.error('未提供处理函数');return;}
    try{
      await ElMessageBox.confirm(
        `确认覆盖 ${l.name}？`,'确认覆盖',
        {confirmButtonText:'覆盖',cancelButtonText:'取消',type:'warning'},
      );
    }catch(_e){return;}
    overwriting.value=true;
    try{
      const r=await applyFn(l);
      if(!r){ElMessage.error('处理失败');overwriting.value=false;return;}
      const ok=await window.electron.writeFile(l.filePath,r.dataUrl);
      if(ok) ElMessage.success('已覆盖');
      else ElMessage.error('写入失败');
    }catch(e){ElMessage.error('覆盖失败：'+e.message);}
    finally{overwriting.value=false;}
  }

  // 导出新文件（单图）
  async function exportAll(applyFn){
    const l=activeLayer.value;
    if(!l){ElMessage.warning('请先选中图片');return;}
    if(!applyFn){ElMessage.error('未提供处理函数');return;}
    const folder=await window.electron.openFolder();
    if(!folder){return;}
    exporting.value=true;
    try{
      const r=await applyFn(l);
      if(!r){ElMessage.error('处理失败');return;}
      const name=l.name.replace(/\.[^.]+$/,'');
      const ext=r.dataUrl.match(/^data:image\/(\w+)/)?.[1]||'png';
      const out=`${folder}\\${prefix}_${name}.${ext}`;
      const ok=await window.electron.writeFile(out,r.dataUrl);
      if(ok) ElMessage.success(`已导出到 ${folder}`);
      else ElMessage.error('导出失败');
    }catch(e){ElMessage.error('导出失败：'+e.message);}
    finally{exporting.value=false;}
  }

  return {overwriting,exporting,canExport,doOverwrite,exportAll};
}

// ===== 导出操作（多图批处理模式） =====
export function useBatchExport(layers,resultKey,prefix='output'){
  const overwriting=ref(false);
  const exporting=ref(false);
  const canExport=computed(()=>layers.some(l=>l[resultKey]));

  // 覆盖原文件（批量）
  async function doOverwrite(){
    const targets=layers.filter(l=>l[resultKey]);
    if(!targets.length){ElMessage.warning('没有可覆盖的已处理图片');return;}
    try{
      await ElMessageBox.confirm(
        `确认覆盖 ${targets.length} 个文件？`,'确认覆盖',
        {confirmButtonText:'覆盖',cancelButtonText:'取消',type:'warning'},
      );
    }catch(_e){return;}
    overwriting.value=true;
    try{
      let ok=0;
      for(const l of targets){
        const r=await window.electron.writeFile(l.filePath,l[resultKey]);
        if(r){l.dataUrl=l[resultKey];ok++;}
      }
      if(ok) ElMessage.success(`已覆盖 ${ok}/${targets.length} 张`);
      else ElMessage.error('覆盖失败');
    }catch(e){ElMessage.error('覆盖失败：'+e.message);}
    finally{overwriting.value=false;}
  }

  // 导出新文件（批量）
  async function exportAll(){
    const targets=layers.filter(l=>l[resultKey]);
    if(!targets.length){ElMessage.warning('没有可导出的已处理图片');return;}
    const folder=await window.electron.openFolder();
    if(!folder){return;}
    exporting.value=true;
    try{
      let count=0;
      for(const l of targets){
        const name=l.name.replace(/\.[^.]+$/,'');
        const ext=l[resultKey+'Ext']||'jpg';
        const out=`${folder}\\${prefix}_${name}.${ext}`;
        const r=await window.electron.writeFile(out,l[resultKey]);
        if(r){l.outputPath=out;count++;}
      }
      if(count) ElMessage.success(`已导出 ${count}/${targets.length} 张到 ${folder}`);
    }catch(e){ElMessage.error('导出失败：'+e.message);}
    finally{exporting.value=false;}
  }

  return {overwriting,exporting,canExport,doOverwrite,exportAll};
}
