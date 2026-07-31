// 工作区通用常量

// ===== 图片格式 =====
const IMG_EXTS=['png','jpg','jpeg','bmp','webp','tga','ico','gif'];

const FORMAT_OPTIONS=[
  {value:'jpg',label:'jpeg (.jpg)',mime:'image/jpeg',ext:'jpg'},
  {value:'png',label:'png (.png)',mime:'image/png',ext:'png'},
  {value:'webp',label:'webp (.webp)',mime:'image/webp',ext:'webp'},
  {value:'bmp',label:'bmp (.bmp)',ext:'bmp'},
  {value:'ico',label:'ico (.ico)',ext:'ico'},
];

// ===== 压缩预设 =====
const COMPRESS_PRESETS={
  low:{label:'低压缩',quality:90},
  medium:{label:'中压缩',quality:75},
  high:{label:'高压缩',quality:50},
};

// ===== 九宫格位置 =====
const GRID_POSITIONS=['tl','tc','tr','ml','mc','mr','bl','bc','br'];

// ===== 剪裁方向映射 =====
const ALL_HANDLES=['tl','tm','tr','mr','br','bm','bl','ml'];
const CORNER_HANDLES=['tl','tr','br','bl'];

const DIR_MAP={
  tl:{sx:-1,sy:-1},
  tm:{sx:0,sy:-1},
  tr:{sx:1,sy:-1},
  mr:{sx:1,sy:0},
  br:{sx:1,sy:1},
  bm:{sx:0,sy:1},
  bl:{sx:-1,sy:1},
  ml:{sx:-1,sy:0},
};

// ===== 缩略图 =====
const THUMB_MAX_SIZE=80;
const THUMB_QUALITY=0.7;

// ===== 布局 =====
const SIDE_PANEL_WIDTH=320;
const THUMB_LIST_WIDTH=180;

// ===== 裁切 =====
const MIN_CROP_SIZE=10;

export{
  IMG_EXTS,
  FORMAT_OPTIONS,
  COMPRESS_PRESETS,
  GRID_POSITIONS,
  ALL_HANDLES,
  CORNER_HANDLES,
  DIR_MAP,
  THUMB_MAX_SIZE,
  THUMB_QUALITY,
  SIDE_PANEL_WIDTH,
  THUMB_LIST_WIDTH,
  MIN_CROP_SIZE,
};
