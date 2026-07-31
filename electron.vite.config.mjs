import {resolve} from 'path';
import {defineConfig,externalizeDepsPlugin} from 'electron-vite';
import vue from '@vitejs/plugin-vue';

// 全局常量 — 唯一出口，main/renderer 共用
const APP_NAME='纸简';

export default defineConfig({
  main:{
    plugins:[externalizeDepsPlugin()],
    build:{
      outDir:'out/main',
      rollupOptions:{
        input:{index:resolve('src/main/index.js')}
      }
    },
    define:{APP_NAME:JSON.stringify(APP_NAME)}
  },
  preload:{
    plugins:[externalizeDepsPlugin()],
    build:{
      outDir:'out/preload',
      rollupOptions:{
        input:{index:resolve('src/preload/index.js')}
      }
    }
  },
  renderer:{
    root:resolve('src/renderer'),
    plugins:[vue()],
    resolve:{
      alias:{
        '@':resolve('src/renderer/src'),
        '~':resolve('src/renderer')
      },
      extensions:['.js','.json','.vue']
    },
    build:{
      outDir:'out/renderer',
      rollupOptions:{
        input:{index:resolve('src/renderer/index.html')}
      }
    },
    define:{APP_NAME:JSON.stringify(APP_NAME)},
    server:{
      watch:{
        ignored:['**/.env']
      }
    },
    css:{
      preprocessorOptions:{
        scss:{
          additionalData:'@use "@/assets/css/variate.scss" as *;'
        }
      }
    }
  }
});
