<template>
  <div class='content-toolbar'>
    <div class='toolbar-left'>
      <el-button type='primary' size='default' :icon='Plus' @click='$emit("addImages")' :disabled='disabled'>添加</el-button>
      <el-button size='default' :icon='FolderOpened' @click='$emit("addFolder")' :disabled='disabled'>添加文件夹</el-button>
      <el-button size='default' @click='$emit("clearAll")' :disabled='disabled'>清空</el-button>
      <slot name='extra'></slot>
    </div>
  </div>
</template>

<script setup>
  import {Plus,FolderOpened} from '@element-plus/icons-vue';

  defineProps({
    disabled:{type:Boolean,default:false},
  });

  defineEmits(['addImages','addFolder','clearAll']);
</script>
