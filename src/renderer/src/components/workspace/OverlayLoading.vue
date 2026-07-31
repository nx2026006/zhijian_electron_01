<template>
  <div v-if='visible' class='grid-loading'>
    <el-icon class='loading-icon' :size='iconSize'><Loading></Loading></el-icon>
    <p>{{text}}</p>
  </div>
</template>

<script setup>
  import {Loading} from '@element-plus/icons-vue';

  defineProps({
    visible:{type:Boolean,default:false},
    text:{type:String,default:'处理中...'},
    iconSize:{type:[Number,String],default:32},
  });
</script>
