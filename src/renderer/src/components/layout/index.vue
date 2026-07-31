<template>
  <div class='main-layout'>
    <!-- ════ 第1行：Header ════ -->
    <div class='body-row row-header'>
      <div class='row-left'>
        <img class='header-logo-img' :src='logoUrl'>
        <span class='header-logo'>{{uiStore.appName}}</span>
      </div>
      <div class='row-right'>
        <div class='header-window'>
          <div class='win-btn' @click='minWin'><img :src='topIcon.electronMin'></div>
          <div class='win-btn' @click='maxWin'><img :src='topIcon.electronMax'></div>
          <div class='win-btn win-close' @click='closeWin'><img :src='topIcon.electronClose'></div>
        </div>
      </div>
    </div>

    <!-- ════ 第2行：内容区 ════ -->
    <div class='body-row row-content'>
      <!-- 左侧功能菜单 220px -->
      <div class='row-left menu-left'>
        <div class='menu-list'>
          <div v-for='m in menuItems' :key='m.key'
            :class='["menu-item",{active:route.path.includes(m.key)}]'
            @click='router.push(m.path)'>
            <el-icon :size='16'><component :is='m.icon'></component></el-icon>
            <span>{{m.label}}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：子路由内容 -->
      <div class='row-right'>
        <slot name='content'></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
  import {useRouter,useRoute} from 'vue-router';
  import {Operation,InfoFilled,Connection,Edit,FullScreen,Crop,Stamp} from '@element-plus/icons-vue';
  import topIcon from '@/assets/electronTop/index.js';
  import logoUrl from '@/assets/images/logo.png';
  import {useUiStore} from '@/stores/index.js';

  const router=useRouter();
  const route=useRoute();
  const uiStore=useUiStore();

  // ====== 菜单 ======
  const menuItems=[
    {key:'compress',label:'压缩',icon:Operation,path:'/home/compress'},
    {key:'resize',label:'修改规格',icon:FullScreen,path:'/home/resize'},
    {key:'convert',label:'格式转换',icon:Connection,path:'/home/convert'},
    {key:'crop',label:'裁切图片',icon:Crop,path:'/home/crop'},
    {key:'rename',label:'重命名',icon:Edit,path:'/home/rename'},
    {key:'watermark',label:'加水印',icon:Stamp,path:'/home/watermark'},
    {key:'about',label:'关于',icon:InfoFilled,path:'/home/about'},
  ];

  // ====== 窗口控制 ======
  function minWin(){window.electron.min();}
  function maxWin(){window.electron.max();}
  function closeWin(){window.electron.close();}
</script>

<style lang='scss' scoped>
  // ====== Color Vars — #1664ff 主题 ======
  $c-bg:#ffffff;
  $c-bg2:#f6f7fa;
  $c-primary:#1664ff;
  $c-border:#e8eaef;
  $c-text:#1a1d26;
  $c-text2:#8e919e;
  $c-radius:4px;
  $left-w:220px;

  .main-layout{
    height:100vh;
    display:flex;
    flex-direction:column;
    background:$c-bg;
  }

  // ====== 行：上下布局通用 ======
  .body-row{
    display:flex;
    flex-shrink:0;
  }
  .row-header{
    user-select:none;
    -webkit-app-region:drag;
  }
  .row-content{
    flex:1;
    overflow:hidden;
  }

  // ====== 列：左右布局通用 ======
  .row-left{
    width:$left-w;
    flex-shrink:0;
    background:$c-bg;
  }
  .row-right{
    flex:1;
    min-width:0;
    background:$c-bg;
  }

  // ====== Header 行 ======
  .row-header{
    .row-left{
      padding:14px $spacing-base;
      display:flex;
      align-items:center;
      gap:10px;
      border-bottom:1px solid $c-border;
      background:$c-bg;
      .header-logo-img{
        width:32px;
        height:32px;
        flex-shrink:0;
        border-radius:50%;
        object-fit:contain;
      }
      .header-logo{
        font-size:18px;
        font-weight:700;
        color:$c-text;
        letter-spacing:0.5px;
      }
    }
    .row-right{
      padding:14px $spacing-base;
      display:flex;
      align-items:center;
      justify-content:flex-end;
      border-bottom:1px solid $c-border;
      background:$c-bg;
      .header-window{
        display:flex;
        align-items:center;
        gap:$spacing-xs;
        -webkit-app-region:no-drag;
        .win-btn{
          width:28px;
          height:28px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:$c-radius;
          cursor:pointer;
          img{
            width:16px;
            height:16px;
            opacity:1;
            filter:brightness(0.6);
          }
          &:hover{
            background:$c-bg2;
            img{opacity:1;}
          }
          &.win-close:hover{
            background:#e8453c;
            img{
              opacity:1;
              filter:brightness(10);
            }
          }
        }
      }
    }
  }

  // ====== 左侧菜单 ======
  .row-content .row-left{
    border-right:1px solid $c-border;
  }
  .menu-left{
    display:flex;
    flex-direction:column;
  }
  .menu-list{
    padding:$spacing-base;
    display:flex;
    flex-direction:column;
    gap:$spacing-sm;
  }
  .menu-item{
    padding:10px $spacing-base;
    display:flex;
    align-items:center;
    gap:$spacing-sm;
    border-radius:$c-radius;
    font-size:14px;
    color:$c-text2;
    cursor:pointer;
    transition:background .15s,color .15s;
    &:hover{
      background:rgba(22,100,255,0.04);
      color:$c-text;
    }
    &.active{
      background:rgba(22,100,255,0.06);
      color:$c-primary;
      font-weight:500;
    }
  }

  // ====== 右侧内容容器 ======
  .row-content{
    .row-right{
      display:flex;
      flex-direction:column;
    }
  }
</style>
