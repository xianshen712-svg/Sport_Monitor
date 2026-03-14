const axios = require('axios');

async function testFix() {
  try {
    console.log('测试API修复效果...');
    
    // 测试JWT令牌（从之前的日志中获取）
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiIyMDIzNDIzMzIwMTAyIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NzM0NjEzNjksImV4cCI6MTc3MzU0Nzc2OX0.UddBLkwGB27vSCUzJJoJs7-8s6XmTTrIsAuRimH4WRc';
    
    console.log('1. 测试实时数据API...');
    const realtimeResponse = await axios.get('http://localhost:3001/api/device-data/user/realtime', {
      headers: { Authorization: 'Bearer ' + jwt }
    });
    
    console.log('实时数据API响应:', JSON.stringify(realtimeResponse.data, null, 2));
    
    console.log('\n2. 测试历史数据API...');
    const today = new Date().toISOString().split('T')[0];
    const historyResponse = await axios.get('http://localhost:3001/api/device-data/user/history', {
      headers: { Authorization: 'Bearer ' + jwt },
      params: { date: today }
    });
    
    console.log('历史数据API响应:', JSON.stringify(historyResponse.data, null, 2));
    
    console.log('\n✅ API测试成功！SQL参数错误已修复。');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testFix();