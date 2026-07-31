// ====== 压缩 API 模块 ======

import {axiosQueue} from '../index.js';

/**
 * 批量压缩图片
 * @param {Object} data - 请求参数 { urls, quality }
 * @returns {Promise}
 */
export function compressImage(data={}){
  return axiosQueue({
    url:'/v1/nx/compressImage',
    data,
    formData:true,
  });
}
