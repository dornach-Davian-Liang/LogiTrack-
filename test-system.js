#!/usr/bin/env node

/**
 * 系统功能测试脚本
 * 验证后端 API 和前端连接
 */

const BASE_URL = 'http://localhost:8080';

// 测试用户凭证（根据系统配置调整）
const TEST_USER = {
  username: 'admin',
  password: 'admin123456'
};

async function test(name, fn) {
  try {
    console.log(`\n🧪 测试: ${name}`);
    await fn();
    console.log(`✅ 通过: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ 失败: ${name}`);
    console.error(`   错误: ${error.message}`);
    return false;
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`   请求: ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  console.log(`   响应: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json();
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  LogiTrack 系统功能测试  -  2026-02-25  ║');
  console.log('╚════════════════════════════════════════╝');

  let passCount = 0;
  let failCount = 0;

  // 测试1: 后端连接
  if (await test('后端服务连接', async () => {
    const response = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET'
    }).catch(e => {
      throw new Error(`无法连接到后端: ${e.message}`);
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`后端响应异常 (HTTP ${response.status})`);
    }
  })) {
    passCount++;
  } else {
    failCount++;
  }

  // 测试2: 登录 API
  if (await test('用户登录', async () => {
    const result = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: TEST_USER,
    });
    
    if (!result.token && !result.access_token) {
      throw new Error('响应中无 token 字段');
    }
    
    console.log(`   Token 获取成功: ${(result.token || result.access_token).substring(0, 20)}...`);
    
    // 保存 token 用于后续测试
    global.authToken = result.token || result.access_token;
  })) {
    passCount++;
  } else {
    failCount++;
  }

  // 测试3: 获取 Enquiry 列表
  if (await test('获取 Enquiry 列表', async () => {
    const result = await makeRequest('/api/enquiries', {
      headers: {
        'Authorization': `Bearer ${global.authToken}`,
      },
    });
    
    if (!Array.isArray(result) && !result.content) {
      throw new Error('响应格式异常');
    }
    
    const items = Array.isArray(result) ? result : result.content || [];
    console.log(`   获取数据: ${items.length} 条记录`);
  })) {
    passCount++;
  } else {
    failCount++;
  }

  // 测试4: 获取单条 Enquiry
  if (await test('获取单条 Enquiry 详情', async () => {
    // 先获取 ID
    const listResult = await makeRequest('/api/enquiries', {
      headers: {
        'Authorization': `Bearer ${global.authToken}`,
      },
    });
    
    const items = Array.isArray(listResult) ? listResult : listResult.content || [];
    if (items.length === 0) {
      throw new Error('无 Enquiry 数据可用');
    }
    
    const firstId = items[0].id;
    console.log(`   使用 ID: ${firstId}`);
    
    const result = await makeRequest(`/api/enquiries/${firstId}`, {
      headers: {
        'Authorization': `Bearer ${global.authToken}`,
      },
    });
    
    if (!result.id) {
      throw new Error('响应中无 id 字段');
    }
  })) {
    passCount++;
  } else {
    failCount++;
  }

  // 测试5: 主数据 - 国家
  if (await test('获取国家主数据', async () => {
    const result = await makeRequest('/api/master/countries', {
      headers: {
        'Authorization': `Bearer ${global.authToken}`,
      },
    });
    
    if (!Array.isArray(result) && !result.content) {
      throw new Error('响应格式异常');
    }
    
    const items = Array.isArray(result) ? result : result.content || [];
    console.log(`   获取数据: ${items.length} 条国家`);
  })) {
    passCount++;
  } else {
    failCount++;
  }

  // 测试6: 主数据 - 港口
  if (await test('获取港口主数据', async () => {
    const result = await makeRequest('/api/master/ports', {
      headers: {
        'Authorization': `Bearer ${global.authToken}`,
      },
    });
    
    if (!Array.isArray(result) && !result.content) {
      throw new Error('响应格式异常');
    }
    
    const items = Array.isArray(result) ? result : result.content || [];
    console.log(`   获取数据: ${items.length} 个海港`);
  })) {
    passCount++;
  } else {
    failCount++;
  }

  // 输出结果
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          测试结果汇总                  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📊 总计: ${passCount + failCount}`);

  if (failCount === 0) {
    console.log('\n🎉 所有测试通过! 系统运行正常。');
    process.exit(0);
  } else {
    console.log('\n❌ 部分测试失败，请检查系统配置。');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试执行出错:', error);
  process.exit(1);
});
