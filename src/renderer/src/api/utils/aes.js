// ====== AES 加解密工具 ======
// 开关由 api/config.js 的 AES_ENABLED 控制
// 当前为占位实现，后续对接具体加密方案

const KEY='';// 加密密钥（占位）
const IV=''; // 初始向量（占位）

/**
 * AES 加密
 * @param {string} data - 明文
 * @returns {string} 密文
 */
export function encrypt(data){
  // TODO: 接入具体 AES 加密实现
  return data;
}

/**
 * AES 解密
 * @param {string} data - 密文
 * @returns {string} 明文
 */
export function decrypt(data){
  // TODO: 接入具体 AES 解密实现
  return data;
}
