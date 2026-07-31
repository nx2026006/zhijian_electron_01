<template>
  <div class="chat-panel">
    <div class="chat-header">
      <span>AI 对话</span>
      <el-button text size="small" @click="uiStore.toggleChat()">
        <el-icon :size="16"><Close /></el-icon>
      </el-button>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages" ref="msgList">
      <div class="chat-empty" v-if="messages.length===0">
        <div class="empty-icon">
          <el-icon :size="36" color="#c9cdd4"><ChatLineSquare /></el-icon>
        </div>
        <div class="empty-title">AI 图像助手</div>
        <div class="empty-desc">通过自然语言描述来操作图像</div>
        <div class="empty-examples">
          <span class="example-tag" v-for="ex in examples" :key="ex" @click="sendMsg(ex)">{{ex}}</span>
        </div>
      </div>

      <div class="msg-item" v-for="(msg,i) in messages" :key="i" :class="msg.role">
        <div class="msg-bubble">
          <div class="msg-text">{{msg.text}}</div>
          <div class="msg-time">{{msg.time}}</div>
        </div>
      </div>

      <div class="msg-item assistant" v-if="sending">
        <div class="msg-bubble">
          <el-icon class="loading-icon" :size="16"><Loading /></el-icon>
          <span class="loading-text">处理中...</span>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="chat-input">
      <el-input
        v-model="input"
        placeholder="描述你想做的操作..."
        type="textarea"
        :rows="2"
        resize="none"
        @keydown.enter.exact="handleSend"
        :disabled="sending"
      />
      <el-button type="primary" :disabled="!input.trim()||sending" @click="handleSend" style="width:100%">
        <el-icon :size="14" style="margin-right:4px"><Promotion /></el-icon>发送
      </el-button>
    </div>
  </div>
</template>

<script setup>
import {ref,reactive,nextTick} from 'vue';
import {Close,ChatLineSquare,Promotion,Loading} from '@element-plus/icons-vue';
import {useUiStore} from '@/stores/index.js';

const uiStore=useUiStore();
const input=ref('');
const sending=ref(false);
const msgList=ref(null);
const messages=reactive([]);

const examples=[
  '查看可用工具',
  '把图片调成暖色调',
  '裁剪为1:1比例'
];

function now(){return new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});}

function addMsg(role,text){
  messages.push({role,text,time:now()});
}

function scrollBottom(){
  nextTick(()=>{
    if(msgList.value) msgList.value.scrollTop=msgList.value.scrollHeight;
  });
}

async function handleSend(){
  const msg=input.value.trim();
  if(!msg||sending.value) return;
  addMsg('user',msg);
  input.value='';
  scrollBottom();

  sending.value=true;
  addMsg('assistant','MCP 服务已移除，请使用压缩功能处理图片');
  sending.value=false;
  scrollBottom();
}

function sendMsg(text){
  input.value=text;
  handleSend();
}
</script>

<style lang='scss' scoped>
.chat-panel{
  display:flex;
  flex-direction:column;
  height:100%;
}

.chat-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  height:40px;
  padding:0 $spacing-sm 0 $spacing-md;
  border-bottom:1px solid $border-color;
  font-size:13px;
  font-weight:600;
  color:$text-primary;
  flex-shrink:0;
}

.chat-messages{
  flex:1;
  overflow-y:auto;
  padding:$spacing-sm;
}

.chat-empty{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  height:100%;
  text-align:center;

  .empty-icon{
    margin-bottom:12px;
  }

  .empty-title{
    font-size:15px;
    font-weight:600;
    color:$text-primary;
    margin-bottom:6px;
  }

  .empty-desc{
    font-size:13px;
    color:$text-secondary;
    margin-bottom:16px;
  }

  .empty-examples{
    display:flex;
    flex-direction:column;
    gap:6px;
    align-items:center;

    .example-tag{
      display:inline-block;
      font-size:12px;
      color:$color-primary;
      background:$bg-active;
      padding:5px 12px;
      border-radius:12px;
      cursor:pointer;

      &:hover{
        background:rgba(22,100,255,0.15);
      }
    }
  }
}

.msg-item{
  margin-bottom:12px;

  &.user{
    display:flex;
    justify-content:flex-end;

    .msg-bubble{
      background:$color-primary;
      color:#fff;
      border-radius:12px 12px 4px 12px;
      max-width:85%;
    }

    .msg-time{
      color:rgba(255,255,255,0.6);
    }
  }

  &.assistant{
    display:flex;
    justify-content:flex-start;

    .msg-bubble{
      background:$bg-hover;
      color:$text-primary;
      border-radius:12px 12px 12px 4px;
      max-width:85%;
    }

    .msg-time{
      color:$text-muted;
    }
  }
}

.msg-bubble{
  padding:10px 14px;
  font-size:13px;
  line-height:1.6;
  white-space:pre-wrap;
  word-break:break-word;
  display:flex;
  align-items:center;
  gap:8px;

  .loading-icon{
    animation:spin 1s linear infinite;
    flex-shrink:0;
  }

  .loading-text{
    color:$text-secondary;
    font-size:12px;
  }
}

.msg-time{
  font-size:12px;
  text-align:right;
  margin-top:4px;
}

@keyframes spin{
  from{transform:rotate(0deg);}
  to{transform:rotate(360deg);}
}

.chat-input{
  padding:$spacing-sm;
  border-top:1px solid $border-color;
  display:flex;
  flex-direction:column;
  gap:8px;
  flex-shrink:0;
}
</style>
