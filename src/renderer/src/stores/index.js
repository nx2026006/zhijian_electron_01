import {defineStore} from 'pinia';
import {reactive,ref,computed} from 'vue';

let layerIdx=0;

export const useProjectStore=defineStore('project',()=>{
  const layers=reactive([]);
  const activeLayerId=ref(0);
  const selectedIds=ref([]);// 多选数组

  function addLayer(layer){
    if(layers.find(l=>l.filePath===layer.filePath)) return null;
    layer.id=++layerIdx;
    layer.originalDataUrl=layer.dataUrl;
    layer.originalPath=layer.filePath;
    layer.outputPath=layer.filePath;
    layer.cssFilter='';
    layer.cssTransform='';
    layers.push(layer);
    activeLayerId.value=layer.id;
    selectedIds.value=[...selectedIds.value,layer.id];
    return layer;
  }

  function removeLayer(layerId){
    const idx=layers.findIndex(l=>l.id===layerId);
    if(idx!==-1){
      layers.splice(idx,1);
      selectedIds.value=selectedIds.value.filter(id=>id!==layerId);
      if(activeLayerId.value===layerId) activeLayerId.value=layers.length>0?layers[layers.length-1].id:0;
    }
  }

  function setActiveLayer(id){activeLayerId.value=id;}

  function getActiveLayer(){
    return layers.find(l=>l.id===activeLayerId.value)||null;
  }

  // 多选
  function toggleSelect(id){
    const arr=selectedIds.value;
    if(arr.includes(id)) selectedIds.value=arr.filter(i=>i!==id);
    else selectedIds.value=[...arr,id];
  }
  function selectAll(){selectedIds.value=layers.map(l=>l.id);}
  function deselectAll(){selectedIds.value=[];}
  const allSelected=computed(()=>layers.length>0&&selectedIds.value.length===layers.length);

  // 获取要操作的目标图层（多选或当前）
  function getTargetLayers(){
    if(selectedIds.value.length>0){
      return layers.filter(l=>selectedIds.value.includes(l.id));
    }
    const l=getActiveLayer();return l?[l]:[];
  }

  // 还原
  function resetLayer(layerId){
    const l=layerId?layers.find(ly=>ly.id===layerId):getActiveLayer();
    if(!l) return;
    l.dataUrl=l.originalDataUrl;l.outputPath=l.originalPath;
    l.cssFilter='';l.cssTransform='';
  }

  function resetAll(){
    for(const l of layers) resetLayer(l.id);
  }

  function clearAll(){
    layers.splice(0,layers.length);
    activeLayerId.value=0;
    selectedIds.value=[];
  }

  return {
    layers,activeLayerId,selectedIds,allSelected,
    addLayer,removeLayer,setActiveLayer,getActiveLayer,
    toggleSelect,selectAll,deselectAll,getTargetLayers,
    resetLayer,resetAll,clearAll
  };
});

export const useUiStore=defineStore('ui',()=>{
  const activePanel=ref('compress');
  const hasImages=ref(false);
  const appName=ref(APP_NAME);
  function setPanel(panel){activePanel.value=panel;}
  function setAppName(name){if(name) appName.value=name;}
  return {activePanel,hasImages,appName,setPanel,setAppName};
});

// ====== API Token 管理 ======
import {setTokenGetter} from '@/api/index.js';

export const useApiStore=defineStore('api',()=>{
  const token=ref('');

  async function loadToken(){
    try{
      const t=await window.electron.getToken();
      if(t) token.value=t;
    }catch(e){console.error('[API] 读取 token 失败:',e);}
  }

  function setToken(t){token.value=t;}

  // 向 API 层注入 token 获取函数
  setTokenGetter(()=>token.value);

  return {token,setToken,loadToken};
});
