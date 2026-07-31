<template>
  <div class='content-area'>
    <div class='grid-wrap'>
      <!-- 表头 -->
      <div class='grid-header' :class='{"has-scrollbar":hasScrollbar}'>
        <slot name='header'></slot>
      </div>

      <!-- 列表 -->
      <div ref='elRef' class='grid-body' v-if='items.length' @dragover.prevent @drop.prevent='$emit("drop",$event)'>
        <div class='grid-row' v-for='(item,i) in items' :key='item.id' :style='rowStyle'>
          <slot name='row' :item='item' :index='i'></slot>
        </div>
      </div>

      <!-- 空状态 -->
      <div class='grid-empty' v-else @dragover.prevent @drop.prevent='$emit("drop",$event)'>
        <el-icon :size='48' color='#b0b3bd'><PictureFilled></PictureFilled></el-icon>
        <p>{{emptyText}}</p>
      </div>

      <!-- 加载遮罩 -->
      <OverlayLoading :visible='loading' :text='loadingText' :icon-size='32'></OverlayLoading>
    </div>
  </div>
</template>

<script setup>
  import {PictureFilled} from '@element-plus/icons-vue';
  import OverlayLoading from './OverlayLoading.vue';
  import {useScrollbarDetect} from '@/composables/useWorkspace.js';

  const props=defineProps({
    items:{type:Array,default:()=>[]},
    loading:{type:Boolean,default:false},
    loadingText:{type:String,default:'导入中...'},
    emptyText:{type:String,default:'点击「添加」导入图片或拖拽到此处'},
    gridCols:{type:String,default:'72px 1fr 110px 90px 90px 140px 72px'},
    rowStyle:{type:Object,default:()=>({})},
  });

  defineEmits(['drop']);

  // 注：dep 为 items.length 函数，触发滚动条重检
  const {elRef,hasScrollbar}=useScrollbarDetect(()=>props.items.length);
</script>

<style scoped>
  .grid-wrap{--grid-cols:v-bind(gridCols);}
</style>
