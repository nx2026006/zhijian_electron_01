// ====== API 常量配置 ======

// 接口根地址
export const BASE_URL='https://ai.nxtici.com';

// 请求超时（同步压缩接口，大图需较长时间）
export const TIMEOUT=180*1000;

// 渠道标识
export const CHANNELS='default';

// 重试配置
export const RETRY_MAX=3;
export const RETRY_INTERVAL=1000;

// 队列并发数
export const QUEUE_CONCURRENCY=3;

// AES 加解密开关（默认关闭）
export const AES_ENABLED=false;
