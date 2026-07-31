// 图片工具函数 — nowCreate workspace 共用

// ===== 常量 =====
const IMG_EXTS=['png','jpg','jpeg','bmp','webp','tga','ico','gif'];

// ===== 格式判断 =====
function isValidImage(name){
  const ext=name.split('.').pop().toLowerCase();
  return IMG_EXTS.includes(ext);
}

// ===== 文件大小格式化 =====
function formatSize(bytes){
  if(!bytes||bytes===0) return '-';
  const units=['b','kb','mb','gb'];
  let i=0;
  let size=bytes;
  while(size>=1024&&i<units.length-1){size/=1024;i++;}
  return `${parseFloat(size.toFixed(1))} ${units[i]}`;
}

// ===== FileReader 读 dataUrl =====
function readFileAsDataUrl(file){
  return new Promise(resolve=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=()=>resolve(null);
    r.readAsDataURL(file);
  });
}

// ===== base64 dataUrl 大小计算 =====
function calcBase64Size(dataUrl){
  const headerLen=dataUrl.indexOf(',')+1;
  return Math.round((dataUrl.length-headerLen)*3/4);
}

// ===== 缩略图生成 =====
// @param {string} dataUrl - 原图 dataUrl
// @param {Image|null} imgObj - 已加载的 Image 对象（可选）
// @param {number} maxSize - 缩略图最大边长，默认 80
// @param {number} quality - JPEG 质量，默认 0.7
function generateThumb(dataUrl,imgObj=null,maxSize=80,quality=0.7){
  if(!imgObj){
    // 无预加载 Image 对象时直接用 dataUrl 作为 fallback
    return dataUrl;
  }
  let w=imgObj.naturalWidth;
  let h=imgObj.naturalHeight;
  if((w<=maxSize)&&(h<=maxSize)){
    // 小图直接返回原图
    return dataUrl;
  }
  const ratio=Math.min(maxSize/w,maxSize/h);
  w=Math.round(w*ratio);
  h=Math.round(h*ratio);
  const c=document.createElement('canvas');
  c.width=w;
  c.height=h;
  c.getContext('2d').drawImage(imgObj,0,0,w,h);
  return c.toDataURL('image/jpeg',quality);
}

// ===== 加载图片获取信息 =====
// @returns {Promise<{w:number,h:number,img:Image}|null>}
function loadImageInfo(dataUrl){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve({w:img.naturalWidth,h:img.naturalHeight,img});
    img.onerror=()=>resolve({w:0,h:0,img:null});
    img.src=dataUrl;
  });
}

// ===== 加载图片获取 ImageData（Canvas 上下文） =====
// @returns {Promise<{canvas,ctx,width,height,imageData}|null>}
function loadImageData(dataUrl){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas');
      c.width=img.naturalWidth;
      c.height=img.naturalHeight;
      const ctx=c.getContext('2d');
      ctx.drawImage(img,0,0);
      resolve({canvas:c,ctx,width:img.naturalWidth,height:img.naturalHeight,imageData:ctx.getImageData(0,0,img.naturalWidth,img.naturalHeight)});
    };
    img.onerror=()=>resolve(null);
    img.src=dataUrl;
  });
}

// ===== object-fit: contain 下的实际显示区域计算 =====
// 给定容器尺寸和图片原始尺寸，返回 contain 模式下的显示区域
function calcContainRect(containerW,containerH,imageW,imageH){
  let w,h,ox,oy;
  if(imageW/imageH>containerW/containerH){
    w=containerW;
    h=Math.floor(containerW*imageH/imageW);
    ox=0;
    oy=Math.floor((containerH-h)/2);
  }else{
    h=containerH;
    w=Math.floor(containerH*imageW/imageH);
    ox=Math.floor((containerW-w)/2);
    oy=0;
  }
  return {w,h,ox,oy};
}

// ===== Canvas 格式转换（jpg/png/webp） =====
function convertViaCanvas(dataUrl,targetFormat,quality=100){
  const mimeMap={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
  const mime=mimeMap[targetFormat]||'image/jpeg';
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement('canvas');
      c.width=img.naturalWidth;
      c.height=img.naturalHeight;
      c.getContext('2d').drawImage(img,0,0);
      const result=c.toDataURL(mime,quality/100);
      const byteSize=calcBase64Size(result);
      resolve({dataUrl:result,size:byteSize});
    };
    img.onerror=()=>resolve(null);
    img.src=dataUrl;
  });
}

// ===== BMP 编码器（24-bit Canvas ImageData → BMP dataUrl） =====
function encodeBmp(imageData,width,height){
  const rowStride=((width*3)+3)&~3;
  const pixelDataSize=rowStride*height;
  const fileHeaderSize=14;
  const dibHeaderSize=40;
  const pixelOffset=fileHeaderSize+dibHeaderSize;
  const fileSize=pixelOffset+pixelDataSize;
  const buf=new ArrayBuffer(fileSize);
  const dv=new DataView(buf);
  let off=0;

  dv.setUint8(off++,0x42);
  dv.setUint8(off++,0x4D);
  dv.setUint32(off,fileSize,true);off+=4;
  dv.setUint32(off,0,true);off+=4;
  dv.setUint32(off,pixelOffset,true);off+=4;

  dv.setUint32(off,dibHeaderSize,true);off+=4;
  dv.setInt32(off,width,true);off+=4;
  dv.setInt32(off,height,true);off+=4;
  dv.setUint16(off,1,true);off+=2;
  dv.setUint16(off,24,true);off+=2;
  dv.setUint32(off,0,true);off+=4;
  dv.setUint32(off,pixelDataSize,true);off+=4;
  dv.setInt32(off,2835,true);off+=4;
  dv.setInt32(off,2835,true);off+=4;
  dv.setUint32(off,0,true);off+=4;
  dv.setUint32(off,0,true);off+=4;

  const px=imageData.data;
  for(let y=height-1;y>=0;y--){
    const rowOff=pixelOffset+y*rowStride;
    let col=0;
    for(let x=0;x<width;x++){
      const src=(y*width+x)*4;
      dv.setUint8(rowOff+col++,px[src+2]);
      dv.setUint8(rowOff+col++,px[src+1]);
      dv.setUint8(rowOff+col++,px[src]);
    }
  }

  const bytes=new Uint8Array(buf);
  let binary='';
  for(let i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
  return 'data:image/bmp;base64,'+btoa(binary);
}

// ===== ICO 编码器（内含单尺寸 PNG） =====
function encodeIco(dataUrl,size=64){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const w=Math.min(size||img.naturalWidth,256);
      const h=Math.min(size||img.naturalHeight,256);
      const c=document.createElement('canvas');
      c.width=w;
      c.height=h;
      const ctx=c.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      const pngDataUrl=c.toDataURL('image/png');
      const pngBase64=pngDataUrl.split(',')[1];
      const pngBytes=atob(pngBase64);
      const pngSize=pngBytes.length;

      const headerSize=6;
      const entrySize=16;
      const totalSize=headerSize+entrySize+pngSize;
      const buf=new ArrayBuffer(totalSize);
      const dv=new DataView(buf);
      let off=0;

      dv.setUint16(off,0,true);off+=2;
      dv.setUint16(off,1,true);off+=2;
      dv.setUint16(off,1,true);off+=2;

      dv.setUint8(off,w>=256?0:w);off+=1;
      dv.setUint8(off,h>=256?0:h);off+=1;
      dv.setUint8(off,0);off+=1;
      dv.setUint8(off,0);off+=1;
      dv.setUint16(off,1,true);off+=2;
      dv.setUint16(off,32,true);off+=2;
      dv.setUint32(off,pngSize,true);off+=4;
      dv.setUint32(off,headerSize+entrySize,true);off+=4;

      for(let i=0;i<pngSize;i++) dv.setUint8(off+i,pngBytes.charCodeAt(i));

      const bytes=new Uint8Array(buf);
      let binary='';
      for(let i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
      resolve({dataUrl:'data:image/x-icon;base64,'+btoa(binary),size:totalSize});
    };
    img.onerror=()=>resolve(null);
    img.src=dataUrl;
  });
}

// ===== 应用图像到 Canvas（缩放+绘制） =====
function drawImageToCanvas(img,targetW,targetH){
  const c=document.createElement('canvas');
  c.width=targetW;
  c.height=targetH;
  c.getContext('2d').drawImage(img,0,0,targetW,targetH);
  return c;
}

export{
  IMG_EXTS,
  isValidImage,
  formatSize,
  readFileAsDataUrl,
  calcBase64Size,
  generateThumb,
  loadImageInfo,
  loadImageData,
  calcContainRect,
  convertViaCanvas,
  encodeBmp,
  encodeIco,
  drawImageToCanvas,
};
