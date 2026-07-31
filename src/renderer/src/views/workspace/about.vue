<template>
  <div class='about-view'>
    <div class='about-card'>
      <!-- 二维码区 -->
      <div class='about-qrcode'>
        <img class='qrcode-img' :src='qrcodeUrl'>
        <p class='qrcode-tip'>扫码了解更多</p>
      </div>

      <!-- 品牌标识 -->
      <div class='about-brand'>
        <span class='brand-dot'></span>
        <h2 class='about-title'>纸简 · 桌面版</h2>
      </div>
      <div class='about-contact'>
        <span class='about-desc'>api请联系微信 : <span class='contact-wx'>zhjian_2026</span></span>
        <el-button size='small' :icon='CopyDocument' circle @click='copyWx'></el-button>
      </div>

      <!-- 分割线 -->
      <div class='about-divider'></div>

      <!-- 功能列表 -->
      <div class='about-features'>
        <div class='feature-item'>
          <span class='feature-dot'></span>
          <span>批量处理，高效便捷</span>
        </div>
        <div class='feature-item'>
          <span class='feature-dot'></span>
          <span>智能压缩，画质可控</span>
        </div>
        <div class='feature-item'>
          <span class='feature-dot'></span>
          <span>格式转换，一键导出</span>
        </div>
        <div class='feature-item'>
          <span class='feature-dot'></span>
          <span>本地运行，数据安全</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
  import {CopyDocument} from '@element-plus/icons-vue';
  import {ElMessage} from 'element-plus';
  import qrcodeUrl from '@/assets/images/qrcode.jpg';

  async function copyWx(){
    try{await navigator.clipboard.writeText('zhjian_2026');ElMessage.success('已复制');}
    catch(e){ElMessage.error('复制失败');}
  }
</script>

<style lang='scss' scoped>
  $c-bg:#ffffff;
  $c-primary:#1664ff;
  $c-text:#1a1d26;
  $c-text2:#8e919e;
  $c-text3:#b0b3bd;
  $c-border:#f0f1f5;

  .about-view{
    display:flex;
    flex:1;
    align-items:center;
    justify-content:center;
    background:$c-bg;
  }
  .about-card{
    width:400px;
    padding:40px 36px 32px;
    display:flex;
    flex-direction:column;
    align-items:center;
    // border:1px solid $c-border;
    border-radius:8px;
    // box-shadow:0 2px 12px rgba(0,0,0,0.04);
  }
  .about-qrcode{
    padding:16px 16px 12px;
    margin-bottom:24px;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:8px;
    // border:1px solid $c-border;
    border-radius:8px;
    // background:#fafbfc;
  }
  .qrcode-img{
    display:block;
    width:180px;
    height:180px;
    border-radius:4px;
    object-fit:contain;
  }
  .qrcode-tip{
    margin:0;
    font-size:12px;
    color:$c-text3;
  }
  .about-brand{
    display:flex;
    align-items:center;
    gap:8px;
    margin-bottom:8px;
    .brand-dot{
      width:8px;
      height:8px;
      flex-shrink:0;
      border-radius:50%;
      background:$c-primary;
    }
  }
  .about-title{
    margin:0;
    font-size:22px;
    font-weight:700;
    color:$c-text;
  }
  .about-contact{
    display:flex;
    align-items:center;
    gap:8px;
    .about-desc{
      margin:0;
      font-size:14px;
      line-height:1;
      color:$c-text2;
      user-select:none;
    }
    .contact-wx{
      user-select:text;
    }
  }
  .about-divider{
    width:48px;
    height:2px;
    margin:20px 0;
    border-radius:1px;
    background:$c-border;
  }
  .about-features{
    display:grid;
    grid-template-columns:auto auto;
    justify-content:space-between;
    gap:10px 38px;
  }
  .feature-item{
    display:flex;
    align-items:center;
    gap:6px;
    min-width:0;
    font-size:14px;
    color:$c-text2;
    .feature-dot{
      width:6px;
      height:6px;
      flex-shrink:0;
      border-radius:50%;
      background:$c-primary;
      opacity:0.5;
    }
    span{
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
  }
</style>
