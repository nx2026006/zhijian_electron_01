// ====== API 核心 — axios 实例 + 拦截器 + 重试 + 队列 ======

import axios from 'axios';
import {
  BASE_URL,TIMEOUT,RETRY_MAX,RETRY_INTERVAL,
  QUEUE_CONCURRENCY,AES_ENABLED,CHANNELS,
} from './config.js';
import {encrypt,decrypt} from './utils/aes.js';
import {createQueue} from './utils/queue.js';

// ====== axios 实例 ======
const http=axios.create({
  baseURL:BASE_URL,
  timeout:TIMEOUT,
  transformRequest:[(data,headers)=>{
    if(data instanceof FormData){
      delete headers['Content-Type'];// axios 自动设 multipart/form-data + boundary
      return data;
    }
    headers['Content-Type']='application/json';
    return JSON.stringify(data);
  }],
});

// ====== token 引用（由 store 初始化时注入） ======
let tokenGetter=null;

/**
 * 注入 token 获取函数（由 store 调用）
 * @param {Function} fn - 返回当前 token 字符串的函数
 */
export function setTokenGetter(fn){
  tokenGetter=fn;
}

// ====== 请求拦截器 ======
http.interceptors.request.use((config)=>{
  // 注入 Authorization
  const token=tokenGetter?tokenGetter():null;
  if(token){
    config.headers.Authorization=`Bearer ${token}`;
  }

  // 注入 channels
  config.headers.channels=CHANNELS;
  config.headers.authChannel='github_zhijian';
  config.headers.authSource='api';

  // AES 加密（开关控制）
  if(AES_ENABLED&&config.data){
    const body=JSON.stringify(config.data);
    config.data={data:encrypt(body)};
  }

  return config;
});

// ====== 响应拦截器 ======
http.interceptors.response.use((response)=>{
  const {config,data,status}=response;

  // AES 解密
  if(AES_ENABLED&&data&&data.data&&typeof data.data==='string'){
    try{
      data.data=JSON.parse(decrypt(data.data));
    }catch(e){
      // 解密失败，保持原数据
    }
  }

  return data;
},async (err)=>{
  const config=err.config||{};
  const retryCount=config._retryCount||0;

  // 无需重试的情况：无 config、已达上限、非网络错误
  if(!config.url||retryCount>=RETRY_MAX){
    return Promise.reject(err);
  }

  // 重试
  config._retryCount=retryCount+1;
  await new Promise(r=>setTimeout(r,RETRY_INTERVAL));
  return http(config);
});

// ====== 队列 ======
const TASK_TIMEOUT=TIMEOUT*(RETRY_MAX+1)+RETRY_INTERVAL*RETRY_MAX+10*1000;
const queue=createQueue({concurrency:QUEUE_CONCURRENCY,timeout:TASK_TIMEOUT});

/**
 * 加入队列请求
 * @param {Object} opts - { url, data, formData? }
 * @param {boolean} opts.formData - 为 true 时将 data 对象自动转为 FormData，header 切 multipart
 * @returns {Promise}
 */
function dataUrlToBlob(dataUrl){
  try{
    const [head,base64]=dataUrl.split(',');
    if(!base64) return null;
    const mime=head.match(/:(.*?);/)?.[1]||'image/png';
    const bytes=atob(base64);
    const buf=new Uint8Array(bytes.length);
    for(let i=0;i<bytes.length;i++) buf[i]=bytes.charCodeAt(i);
    return new Blob([buf],{type:mime});
  }catch(e){
    return null;
  }
}

export function axiosQueue(opts={}){
  let payload=opts.data;
  if(opts.formData&&opts.data&&typeof opts.data==='object'&&!(opts.data instanceof FormData)){
    const fd=new FormData();
    for(const [key,val] of Object.entries(opts.data)){
      if(Array.isArray(val)){
        val.forEach(v=>{
          const blob=typeof v==='string'&&v.startsWith('data:')?dataUrlToBlob(v):v;
          if(blob) fd.append(key,blob);
        });
      }else{
        const blob=typeof val==='string'&&val.startsWith('data:')?dataUrlToBlob(val):val;
        if(blob) fd.append(key,blob);
      }
    }
    payload=fd;
  }
  return queue.enqueue(()=>http.post(opts.url,payload));
}

export default http;
