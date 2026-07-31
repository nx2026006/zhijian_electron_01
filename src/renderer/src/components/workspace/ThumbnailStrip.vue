<template>
  <div class='thumb-list' @dragover.prevent @drop.prevent='$emit("drop",$event)'>
    <!-- 加载中 -->
    <div class='thumb-loading' v-if='loading'>
      <el-icon class='loading-icon' :size='24'><Loading></Loading></el-icon>
    </div>
    <!-- 列表项 -->
    <div class='thumb-item'
      v-for='item in items' :key='item.id'
      :class='{active:activeId===item.id}'
      @click='$emit("select",item)'>
      <slot name='item' :item='item' :active='activeId===item.id'>
        <img :src='item.thumbUrl||item.dataUrl' class='thumb-img'>
        <span class='thumb-name'>{{item.name}}</span>
      </slot>
    </div>
    <!-- 空状态 -->
    <div class='thumb-empty' v-if='!items.length&&!loading'>
      <el-icon :size='24' color='#b0b3bd'><PictureFilled></PictureFilled></el-icon>
      <p>拖拽或点击添加</p>
    </div>
  </div>
</template>

<script setup>
  import {Loading,PictureFilled} from '@element-plus/icons-vue';

  defineProps({
    items:{type:Array,default:()=>[]},
    activeId:{type:[Number,String],default:null},
    loading:{type:Boolean,default:false},
  });

  defineEmits(['select','drop']);
</script>
