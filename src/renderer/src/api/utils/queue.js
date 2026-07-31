// ====== 并发控制队列 ======

/**
 * 创建一个并发控制队列
 * @param {Object} options
 * @param {number} options.concurrency - 最大并发数
 * @param {number} options.timeout     - 单个任务的超时时间（ms）
 */
export function createQueue({concurrency=3,timeout=6e5}={}){
  let running=0;
  const pending=[];

  function next(){
    if(running>=concurrency||!pending.length) return;
    const task=pending.shift();
    running++;
    task().finally(()=>{
      running--;
      next();
    });
  }

  /**
   * 将任务加入队列
   * @param {Function} fn - 返回 Promise 的异步函数
   * @returns {Promise}
   */
  function enqueue(fn){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        reject(new Error('队列任务超时'));
      },timeout);

      const task=()=>{
        return fn().then(
          result=>{
            clearTimeout(timer);
            resolve(result);
          },
          err=>{
            clearTimeout(timer);
            reject(err);
          }
        );
      };

      pending.push(task);
      next();
    });
  }

  return {enqueue};
}
