// ====== 本地图层管理（各视图独立，不跨视图共享） ======

import {reactive,ref,computed} from 'vue';

let layerIdx=0;

export function useLocalLayers(){
  const layers=reactive([]);
  const activeLayerId=ref(0);
  const selectedIds=ref([]);

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

  function clearAll(){
    layers.splice(0,layers.length);
    activeLayerId.value=0;
    selectedIds.value=[];
  }

  return {layers,activeLayerId,selectedIds,addLayer,removeLayer,clearAll};
}
