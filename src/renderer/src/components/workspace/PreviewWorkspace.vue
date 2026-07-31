<template>
  <div class='content-area'>
    <div class='preview-workspace'>
      <!-- 左侧缩略图条 -->
      <slot name='thumbList'></slot>
      <!-- 右侧预览区 -->
      <slot name='preview'></slot>
    </div>
  </div>
</template>

<script setup>
// 纯布局容器，通过插槽组合 ThumbnailStrip + ImagePreview
</script>
