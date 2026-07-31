<template>
  <div class='preview-area' @dragover.prevent @drop.prevent='$emit("drop",$event)'>
    <!-- 有图 -->
    <div class='preview-wrap' v-if='imageUrl'>
      <img :ref='el=>{if(el) imgRef=el;}' :src='imageUrl' class='preview-img' @load='$emit("imgLoad",$event)'>
      <slot name='overlay'></slot>
    </div>
    <!-- 空状态 -->
    <div class='preview-empty' v-else @dragover.prevent @drop.prevent='$emit("drop",$event)'>
      <slot name='empty'>
        <el-icon :size='48' color='#b0b3bd'><PictureFilled></PictureFilled></el-icon>
        <p>暂无图片</p>
      </slot>
    </div>
    <!-- 加载遮罩 -->
    <OverlayLoading :visible='loading' :text='loadingText' :icon-size='32'></OverlayLoading>
  </div>
</template>

<script setup>
  import {ref} from 'vue';
  import {PictureFilled} from '@element-plus/icons-vue';
  import OverlayLoading from './OverlayLoading.vue';

  defineProps({
    imageUrl:{type:String,default:''},
    loading:{type:Boolean,default:false},
    loadingText:{type:String,default:'处理中...'},
  });

  defineEmits(['drop','imgLoad']);

  const imgRef=ref(null);
  function getImg(){return imgRef.value;}
  function getWrap(){return imgRef.value?.parentElement||null;}
  defineExpose({getImg,getWrap});
</script>
