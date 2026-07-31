<template>
  <div class='grid-9' :style='{maxWidth:size+"px"}'>
    <div v-for='p in positions' :key='p'
      :class='["grid-cell",{active:modelValue===p}]'
      @click='$emit("update:modelValue",p)'></div>
  </div>
</template>

<script setup>
  import {GRID_POSITIONS} from '@/constants/workspace.js';

  defineProps({
    modelValue:{type:String,default:'mc'},
    size:{type:Number,default:180},
  });

  defineEmits(['update:modelValue']);

  const positions=GRID_POSITIONS;
</script>
