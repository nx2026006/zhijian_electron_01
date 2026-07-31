<template>
  <div class='slider-row'>
    <span class='slider-label' v-if='label'>{{label}}</span>
    <input type='range'
      :min='min' :max='max' :step='step'
      :value='modelValue'
      @input='$emit("update:modelValue",Number($event.target.value))'
      class='slider'
      :disabled='disabled'>
    <span class='slider-val' v-if='showValue'>{{modelValue}}{{suffix}}</span>
  </div>
</template>

<script setup>
  defineProps({
    modelValue:{type:Number,default:50},
    min:{type:Number,default:0},
    max:{type:Number,default:100},
    step:{type:Number,default:1},
    disabled:{type:Boolean,default:false},
    label:{type:String,default:''},
    suffix:{type:String,default:''},
    showValue:{type:Boolean,default:true},
  });

  defineEmits(['update:modelValue']);
</script>
