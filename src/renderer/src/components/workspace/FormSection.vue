<template>
  <div class='form-section'>
    <div class='section-title'>{{title}}</div>
    <slot></slot>
  </div>
</template>

<script setup>
  defineProps({
    title:{type:String,required:true},
  });
</script>
