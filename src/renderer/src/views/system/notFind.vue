<template>
  <div class="not-found-page">
    <div class="nf-content">
      <div class="nf-code">404</div>
      <div class="nf-text">页面未找到</div>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang='scss' scoped>
.not-found-page{
  display:flex;
  align-items:center;
  justify-content:center;
  width:100%;
  height:100%;
  background:$bg-body;
}

.nf-content{
  text-align:center;
}

.nf-code{
  font-size:72px;
  font-weight:700;
  color:$text-muted;
  letter-spacing:8px;
}

.nf-text{
  font-size:16px;
  color:$text-secondary;
  margin:$spacing-lg 0;
}
</style>
