<template>
  <div class='crop-mask' v-if='box.w>0' :style='maskStyle'>
    <div class='mask-hole' :style='{borderRadius:borderRadiusUnit==="percent"?borderRadius+"%":borderRadius+"px"}'></div>
    <div class='mask-center'>
      <!-- 裁切框（本体拖拽） -->
      <div class='crop-frame' @mousedown='startBodyDrag($event)'>
        <div class='crop-grid'>
          <div class='grid-line grid-h1'></div>
          <div class='grid-line grid-h2'></div>
          <div class='grid-line grid-v1'></div>
          <div class='grid-line grid-v2'></div>
        </div>
      </div>
      <!-- 方向手柄 -->
      <div v-for='h in handles' :key='h'
        :class='[`crop-handle`,`crop-handle--${h}`]'
        @mousedown.stop='startHandleDrag($event,h)'></div>
    </div>
  </div>
</template>

<script setup>
  import {ref,computed,watch} from 'vue';
  import {MIN_CROP_SIZE,ALL_HANDLES,CORNER_HANDLES,DIR_MAP} from '@/constants/workspace.js';

  const props=defineProps({
    mode:{type:String,default:'free'},
    ratioW:{type:Number,default:1},
    ratioH:{type:Number,default:1},
    borderRadius:{type:Number,default:0},
    borderRadiusUnit:{type:String,default:'%'},
    displayW:{type:Number,required:true},
    displayH:{type:Number,required:true},
    displayOx:{type:Number,default:0},
    displayOy:{type:Number,default:0},
    defaultPosition:{type:String,default:'mc'},
    defaultW:{type:Number,default:300},
    defaultH:{type:Number,default:300},
    minSize:{type:Number,default:10},
  });

  const emit=defineEmits(['update:box','drag-start','drag-end']);

  const box=ref({x:0,y:0,w:0,h:0});
  const dragInfo=ref(null);
  const isDragging=ref(false);

  const handles=computed(()=>props.mode==='ratio'?CORNER_HANDLES:ALL_HANDLES);

  function getPosOffset(dw,dh,cw,ch){
    const key=props.defaultPosition;
    const v=key[0];const h=key[1];
    let x=0;let y=0;
    if(h==='c') x=Math.round((dw-cw)/2);
    else if(h==='r') x=dw-cw;
    if(v==='m') y=Math.round((dh-ch)/2);
    else if(v==='b') y=dh-ch;
    return {x,y};
  }

  function initBox(){
    const d=props;
    if(!d.displayW) return;
    let w,h;
    if(d.mode==='ratio'){
      const r=d.ratioW/d.ratioH;
      w=Math.min(300,d.displayW);
      h=Math.round(w/r);
      if(h>d.displayH){h=d.displayH;w=Math.round(h*r);}
    }else{
      w=Math.min(d.defaultW,d.displayW);
      h=Math.min(d.defaultH,d.displayH);
    }
    if(!w||!h) return;
    const {x,y}=getPosOffset(d.displayW,d.displayH,w,h);
    box.value={x,y,w,h};
    emit('update:box',{...box.value});
  }

  // 仅初始显示区域就绪时初始化一次，后续由父组件通过 ref 调用 initBox
  watch(()=>props.displayW,(w)=>{
    if(w&&!box.value.w) initBox();
  });

  function updateBoxSize(nw,nh){
    const d=props;
    if(d.mode==='ratio'){
      const r=d.ratioW/d.ratioH;
      nw=Math.min(300,d.displayW);
      nh=Math.round(nw/r);
      if(nh>d.displayH){nh=d.displayH;nw=Math.round(nh*r);}
    }else{
      nw=Math.min(nw||d.defaultW,d.displayW);
      nh=Math.min(nh||d.defaultH,d.displayH);
    }
    if(!nw||!nh) return;
    const {x,y}=getPosOffset(d.displayW,d.displayH,nw,nh);
    box.value={x,y,w:nw,h:nh};
    emit('update:box',{...box.value});
  }

  function adjustBoxBounds(nw,nh){
    const d=props;
    let nx=box.value.x,ny=box.value.y;
    if(nx+nw>d.displayW) nx=Math.max(0,d.displayW-nw);
    if(ny+nh>d.displayH) ny=Math.max(0,d.displayH-nh);
    box.value={x:nx,y:ny,w:nw,h:nh};
    emit('update:box',{...box.value});
  }

  // ===== 遮罩样式 =====
  const maskStyle=computed(()=>{
    const {x,y,w,h}=box.value;
    return {
      '--mx':(x+(props.displayOx||0))+'px',
      '--my':(y+(props.displayOy||0))+'px',
      '--mw':w+'px',
      '--mh':h+'px',
    };
  });

  // ===== 拖拽逻辑 =====
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

  function startBodyDrag(e){
    e.preventDefault();
    if(!props.displayW) return;
    isDragging.value=true;
    emit('drag-start');
    dragInfo.value={
      mode:'move',
      mx:e.clientX,my:e.clientY,
      ox:box.value.x,oy:box.value.y,
      ow:box.value.w,oh:box.value.h,
      iw:props.displayW,ih:props.displayH,
    };
    document.addEventListener('mousemove',onDrag);
    document.addEventListener('mouseup',stopDrag);
  }

  function startHandleDrag(e,h){
    e.preventDefault();
    isDragging.value=true;
    emit('drag-start');
    dragInfo.value={
      mode:'resize',handle:h,
      mx:e.clientX,my:e.clientY,
      ox:box.value.x,oy:box.value.y,
      ow:box.value.w,oh:box.value.h,
      iw:props.displayW,ih:props.displayH,
      ratio:props.mode==='ratio'?props.ratioW/props.ratioH:null,
    };
    document.addEventListener('mousemove',onDrag);
    document.addEventListener('mouseup',stopDrag);
  }

  function onDrag(e){
    const d=dragInfo.value;if(!d) return;
    const dx=e.clientX-d.mx;
    const dy=e.clientY-d.my;

    if(d.mode==='move'){
      const nx=clamp(Math.round(d.ox+dx),0,d.iw-d.ow);
      const ny=clamp(Math.round(d.oy+dy),0,d.ih-d.oh);
      box.value={x:nx,y:ny,w:d.ow,h:d.oh};
    }else{
      const dir=DIR_MAP[d.handle];if(!dir) return;
      const isCorner=dir.sx!==0&&dir.sy!==0;
      let nx=d.ox,ny=d.oy,nw=d.ow,nh=d.oh;

      if(isCorner&&d.ratio){
        const ax=dir.sx===1?d.ox:d.ox+d.ow;
        const ay=dir.sy===1?d.oy:d.oy+d.oh;
        const cx=dir.sx===1?d.ox+d.ow:d.ox;
        const cy=dir.sy===1?d.oy+d.oh:d.oy;
        let tx=clamp(cx+dx,0,d.iw);
        let ty=clamp(cy+dy,0,d.ih);
        let rw=dir.sx===1?tx-ax:ax-tx;
        let rh=dir.sy===1?ty-ay:ay-ty;
        rw=Math.max(props.minSize,rw);rh=Math.max(props.minSize,rh);
        if(rw/rh>=d.ratio){nh=rh;nw=Math.round(nh*d.ratio);}
        else{nw=rw;nh=Math.round(nw/d.ratio);}
        nx=dir.sx===1?ax:ax-nw;
        ny=dir.sy===1?ay:ay-nh;
        if(nx<0){nw+=nx;nx=0;}
        if(ny<0){nh+=ny;ny=0;}
        if(nx+nw>d.iw) nw=d.iw-nx;
        if(ny+nh>d.ih) nh=d.ih-ny;
      }else{
        if(dir.sx!==0) nw=Math.max(props.minSize,d.ow+dir.sx*dx);
        if(dir.sy!==0) nh=Math.max(props.minSize,d.oh+dir.sy*dy);
        const ax=dir.sx===-1?d.ox+d.ow:dir.sx===1?d.ox:d.ox+d.ow/2;
        const ay=dir.sy===-1?d.oy+d.oh:dir.sy===1?d.oy:d.oy+d.oh/2;
        nx=ax-(dir.sx===-1?nw:dir.sx===1?0:nw/2);
        ny=ay-(dir.sy===-1?nh:dir.sy===1?0:nh/2);
        if(dir.sx===-1&&nx<0){nw-=(0-nx);nx=0;}
        if(dir.sy===-1&&ny<0){nh-=(0-ny);ny=0;}
        if(nx+nw>d.iw) nw=d.iw-nx;
        if(ny+nh>d.ih) nh=d.ih-ny;
        if(dir.sx!==-1&&nx<0) nx=0;
        if(dir.sy!==-1&&ny<0) ny=0;
      }
      box.value={x:Math.round(nx),y:Math.round(ny),w:Math.round(nw),h:Math.round(nh)};
    }
    emit('update:box',{...box.value});
  }

  function stopDrag(){
    isDragging.value=false;
    emit('drag-end');
    dragInfo.value=null;
    document.removeEventListener('mousemove',onDrag);
    document.removeEventListener('mouseup',stopDrag);
  }

  function getBox(){return{...box.value};}
  defineExpose({initBox,updateBoxSize,adjustBoxBounds,getBox});
</script>

<style scoped>
  .crop-mask{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}
  .mask-hole{
    position:absolute;left:var(--mx);top:var(--my);width:var(--mw);height:var(--mh);
    pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.45);
  }
  .mask-center{position:absolute;left:var(--mx);top:var(--my);width:var(--mw);height:var(--mh);pointer-events:auto;}
  .crop-frame{
    position:absolute;top:0;left:0;width:100%;height:100%;cursor:move;
    &::after{content:'';position:absolute;z-index:1;left:-3px;top:-3px;width:calc(100% + 6px);height:calc(100% + 6px);border:3px dashed #1664ff;border-radius:inherit;pointer-events:none;box-sizing:border-box;}
  }
  .crop-grid{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}
  .grid-line{position:absolute;background:rgba(255,255,255,.2);}
  .grid-h1{top:33.33%;left:0;width:100%;height:1px;}
  .grid-h2{top:66.66%;left:0;width:100%;height:1px;}
  .grid-v1{left:33.33%;top:0;width:1px;height:100%;}
  .grid-v2{left:66.66%;top:0;width:1px;height:100%;}
  .crop-handle{
    position:absolute;z-index:2;width:16px;height:16px;background:#fff;
    border:3px solid #1664ff;border-radius:50%;box-sizing:border-box;
    box-shadow:0 0 2px rgba(0,0,0,.12);transform:translate(-50%,-50%);
  }
  .crop-handle--tl{left:-1px;top:-1px;cursor:nw-resize;}
  .crop-handle--tm{left:50%;top:-1px;cursor:n-resize;}
  .crop-handle--tr{left:calc(100% + 1px);top:-1px;cursor:ne-resize;}
  .crop-handle--mr{left:calc(100% + 1px);top:50%;cursor:e-resize;}
  .crop-handle--br{left:calc(100% + 1px);top:calc(100% + 1px);cursor:se-resize;}
  .crop-handle--bm{left:50%;top:calc(100% + 1px);cursor:s-resize;}
  .crop-handle--bl{left:-1px;top:calc(100% + 1px);cursor:sw-resize;}
  .crop-handle--ml{left:-1px;top:50%;cursor:w-resize;}
</style>
