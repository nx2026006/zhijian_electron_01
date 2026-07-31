/**
 * Vue Router — 路由配置
 */

import {createRouter,createWebHashHistory} from 'vue-router';

const routes=[
  {
    path:'/',
    redirect:'/home/compress'
  },
  {
    path:'/home',
    component:()=>import('@/views/home/index.vue'),
    redirect:'/home/compress',
    children:[
      {
        path:'compress',
        name:'compress',
        component:()=>import('@/views/workspace/compress.vue'),
        meta:{title:'压缩'}
      },
      {
        path:'convert',
        name:'convert',
        component:()=>import('@/views/workspace/convert.vue'),
        meta:{title:'格式转换'}
      },
      {
        path:'resize',
        name:'resize',
        component:()=>import('@/views/workspace/resize.vue'),
        meta:{title:'修改规格'}
      },
      {
        path:'rename',
        name:'rename',
        component:()=>import('@/views/workspace/rename.vue'),
        meta:{title:'重命名'}
      },
      {
        path:'crop',
        name:'crop',
        component:()=>import('@/views/workspace/crop.vue'),
        meta:{title:'裁切图片'}
      },
      {
        path:'watermark',
        name:'watermark',
        component:()=>import('@/views/workspace/watermark.vue'),
        meta:{title:'加水印'}
      },
      {
        path:'about',
        name:'about',
        component:()=>import('@/views/workspace/about.vue'),
        meta:{title:'关于'}
      }
    ]
  },
  {
    path:'/:pathMatch(.*)*',
    name:'notFound',
    component:()=>import('@/views/system/notFind.vue'),
    meta:{title:'404'}
  }
];

const router=createRouter({
  history:createWebHashHistory(),
  routes
});

export default router;
