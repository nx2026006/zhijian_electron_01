/**
 * Vue 渲染进程入口
 */

import {createApp} from 'vue';
import {createPinia} from 'pinia';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import 'element-plus/dist/index.css';
import './assets/css/main.scss';
import './assets/css/workspace.scss';

import App from './App.vue';
import router from './router';
import {useApiStore} from './stores/index.js';

const app=createApp(App);

// Element Plus（中文）
app.use(ElementPlus,{locale:zhCn});

// 注册所有 Element Plus 图标
for(const [key,component] of Object.entries(ElementPlusIconsVue)){
  app.component(key,component);
}

app.use(createPinia());

// 初始化 API Token Store（注册 token 拦截器 + 从 .env 加载 token）
useApiStore().loadToken();

app.use(router);

app.mount('#app');
