<template>
  <div class='side-panel' :style='{"--side-w":width+"px"}'>
    <div class='side-config'>
      <div class='config-form'>
        <slot name='config'></slot>
      </div>
    </div>
    <div class='side-footer' v-if='$slots.footer'>
      <slot name='footer'></slot>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    width:{type:Number,default:320},
  });
</script>
