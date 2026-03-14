# AndroidSDK与Sport_Monitor数据传输集成指南

## 概述
本文档详细说明如何将AndroidSDK项目与Sport_Monitor系统通过MQTT协议实现数据传输。

## 1. 系统架构

```
Android设备 (数据采集) 
       ↓
   MQTT发布 (JSON数据)
       ↓
Sport_Monitor服务器 (MQTT订阅)
       ↓
   数据处理与存储
       ↓
   Web界面展示
```

## 2. Android端实现

### 2.1 添加依赖
在`app/build.gradle`中添加：

```gradle
dependencies {
    implementation 'org.eclipse.paho:org.eclipse.paho.client.mqttv3:1.2.5'
    implementation 'org.eclipse.paho:org.eclipse.paho.android.service:1.1.1'
    implementation 'androidx.localbroadcastmanager:localbroadcastmanager:1.0.0'
}
```

### 2.2 创建MQTT配置类

```java
// MQTTConfig.java
public class MQTTConfig {
    public static final String BROKER_URL = "tcp://YOUR_SERVER_IP:1883";
    public static final String CLIENT_ID_PREFIX = "android-health-";
    public static final String TOPIC_PREFIX = "sport/monitor/android/";
    public static final int QOS = 1; // 至少发送一次
    public static final int CONNECTION_TIMEOUT = 10;
    public static final int KEEP_ALIVE_INTERVAL = 60;
}
```

### 2.3 创建健康数据模型

```java
// HealthData.java
public class HealthData {
    private String deviceId;
    private String userId;
    private long timestamp;
    private int heartRate;
    private int steps;
    private float bloodOxygen;
    private float bodyTemperature;
    private BloodPressure bloodPressure;
    private float bloodSugar;
    
    // 构造函数、getter、setter...
    
    public static class BloodPressure {
        private int systolic;
        private int diastolic;
        
        // 构造函数、getter、setter...
    }
}
```

### 2.4 创建MQTT管理器

```java
// MQTTManager.java
public class MQTTManager {
    private static MQTTManager instance;
    private MqttAndroidClient mqttClient;
    private Context context;
    private boolean isConnected = false;
    
    private MQTTManager(Context context) {
        this.context = context.getApplicationContext();
    }
    
    public static synchronized MQTTManager getInstance(Context context) {
        if (instance == null) {
            instance = new MQTTManager(context);
        }
        return instance;
    }
    
    public void connect() {
        if (isConnected) return;
        
        try {
            String clientId = MQTTConfig.CLIENT_ID_PREFIX + 
                Build.MODEL + "-" + System.currentTimeMillis();
            
            mqttClient = new MqttAndroidClient(context, 
                MQTTConfig.BROKER_URL, clientId);
            
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(MQTTConfig.CONNECTION_TIMEOUT);
            options.setKeepAliveInterval(MQTTConfig.KEEP_ALIVE_INTERVAL);
            
            // 设置连接回调
            mqttClient.setCallback(new MqttCallbackExtended() {
                @Override
                public void connectComplete(boolean reconnect, String serverURI) {
                    isConnected = true;
                    Log.d("MQTT", "连接成功: " + serverURI);
                    sendConnectionStatusBroadcast(true);
                }
                
                @Override
                public void connectionLost(Throwable cause) {
                    isConnected = false;
                    Log.w("MQTT", "连接丢失", cause);
                    sendConnectionStatusBroadcast(false);
                }
                
                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    Log.d("MQTT", "收到消息: " + topic + " - " + message.toString());
                }
                
                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                    Log.d("MQTT", "消息发送完成");
                }
            });
            
            // 连接服务器
            mqttClient.connect(options, null, new IMqttActionListener() {
                @Override
                public void onSuccess(IMqttToken asyncActionToken) {
                    Log.d("MQTT", "连接请求成功");
                }
                
                @Override
                public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
                    isConnected = false;
                    Log.e("MQTT", "连接请求失败", exception);
                    sendConnectionStatusBroadcast(false);
                }
            });
            
        } catch (MqttException e) {
            Log.e("MQTT", "连接异常", e);
            isConnected = false;
        }
    }
    
    public void publishHealthData(HealthData data) {
        if (!isConnected || mqttClient == null) {
            Log.w("MQTT", "MQTT未连接，尝试重新连接");
            connect();
            // 延迟发送
            new Handler().postDelayed(() -> {
                if (isConnected) {
                    doPublish(data);
                } else {
                    Log.e("MQTT", "连接失败，数据未发送");
                    saveDataForLater(data);
                }
            }, 2000);
            return;
        }
        
        doPublish(data);
    }
    
    private void doPublish(HealthData data) {
        try {
            String topic = MQTTConfig.TOPIC_PREFIX + data.getDeviceId();
            String payload = convertToJson(data);
            
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(MQTTConfig.QOS);
            message.setRetained(false);
            
            mqttClient.publish(topic, message);
            Log.d("MQTT", "数据已发送: " + topic);
            
        } catch (MqttException e) {
            Log.e("MQTT", "发送数据失败", e);
            saveDataForLater(data);
        } catch (JSONException e) {
            Log.e("MQTT", "JSON转换失败", e);
        }
    }
    
    private String convertToJson(HealthData data) throws JSONException {
        JSONObject json = new JSONObject();
        json.put("deviceId", data.getDeviceId());
        json.put("userId", data.getUserId());
        json.put("timestamp", data.getTimestamp());
        json.put("heartRate", data.getHeartRate());
        json.put("steps", data.getSteps());
        json.put("bloodOxygen", data.getBloodOxygen());
        json.put("bodyTemperature", data.getBodyTemperature());
        json.put("bloodSugar", data.getBloodSugar());
        
        if (data.getBloodPressure() != null) {
            JSONObject bpJson = new JSONObject();
            bpJson.put("systolic", data.getBloodPressure().getSystolic());
            bpJson.put("diastolic", data.getBloodPressure().getDiastolic());
            json.put("bloodPressure", bpJson);
        }
        
        return json.toString();
    }
    
    private void saveDataForLater(HealthData data) {
        // 实现本地存储，等待网络恢复后重试
        Log.d("MQTT", "数据已保存到本地，等待重试");
    }
    
    private void sendConnectionStatusBroadcast(boolean connected) {
        Intent intent = new Intent("MQTT_CONNECTION_STATUS");
        intent.putExtra("connected", connected);
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }
    
    public void disconnect() {
        if (mqttClient != null && isConnected) {
            try {
                mqttClient.disconnect();
                isConnected = false;
                Log.d("MQTT", "已断开连接");
            } catch (MqttException e) {
                Log.e("MQTT", "断开连接失败", e);
            }
        }
    }
}
```

### 2.5 修改SyncTaskManager集成MQTT

```java
// 在SyncTaskManager.java中添加
private MQTTManager mqttManager;

public void syncDataToServer(HealthData data) {
    // 原有HTTP同步逻辑...
    
    // 新增MQTT同步
    if (mqttManager == null) {
        mqttManager = MQTTManager.getInstance(context);
        mqttManager.connect();
    }
    
    // 检查连接状态，如果未连接则延迟发送
    new Handler().postDelayed(() -> {
        mqttManager.publishHealthData(data);
    }, 1000);
    
    Log.d("SyncTaskManager", "数据已通过MQTT发送");
}
```

### 2.6 在AndroidManifest.xml中添加权限

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<service android:name="org.eclipse.paho.android.service.MqttService" />
```

## 3. Sport_Monitor端配置

### 3.1 环境变量配置
在`.env`文件中确保MQTT配置正确：

```
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

### 3.2 启动MQTT服务器
可以使用Mosquitto或其他MQTT代理：

```bash
# 安装Mosquitto
sudo apt-get install mosquitto mosquitto-clients

# 启动服务
sudo systemctl start mosquitto
```

### 3.3 测试连接
使用MQTT客户端测试：

```bash
# 订阅Android数据主题
mosquitto_sub -t "sport/monitor/android/#" -v

# 发布测试数据
mosquitto_pub -t "sport/monitor/android/test-device" -m '{"deviceId":"test-device","heartRate":75,"steps":1000}'
```

## 4. 数据格式规范

### 4.1 完整数据格式
```json
{
  "deviceId": "android-123456",
  "userId": "user-789",
  "timestamp": 1644567890123,
  "heartRate": 75,
  "steps": 1250,
  "bloodOxygen": 98.5,
  "bodyTemperature": 36.8,
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "bloodSugar": 5.2
}
```

### 4.2 必填字段
- `deviceId`: 设备唯一标识
- `timestamp`: 时间戳（毫秒）
- `heartRate`: 心率（bpm）

### 4.3 可选字段
- `userId`: 用户ID（用于关联用户）
- 其他健康指标根据设备能力提供

## 5. 错误处理与重试机制

### 5.1 连接失败处理
- 自动重连机制（MQTT客户端内置）
- 本地数据缓存
- 网络状态监听

### 5.2 数据验证
- JSON格式验证
- 数据范围检查（心率、血氧等合理范围）
- 时间戳有效性检查

### 5.3 监控与日志
- 连接状态监控
- 数据发送成功率统计
- 错误日志记录

## 6. 安全考虑

### 6.1 认证与授权
- 使用MQTT用户名/密码认证
- 设备白名单机制
- TLS/SSL加密传输（生产环境推荐）

### 6.2 数据安全
- 敏感数据加密
- 防止重放攻击
- 数据完整性验证

## 7. 部署步骤

### 7.1 Sport_Monitor端
1. 确保MQTT服务器运行
2. 更新`.env`文件中的MQTT配置
3. 重启Sport_Monitor服务
4. 验证MQTT连接状态

### 7.2 Android端
1. 添加MQTT依赖
2. 实现MQTTManager类
3. 集成到SyncTaskManager
4. 更新AndroidManifest.xml
5. 测试数据发送

## 8. 测试验证

### 8.1 单元测试
```java
// MQTT连接测试
@Test
public void testMQTTConnection() {
    // 测试连接建立
    // 测试数据发送
    // 测试错误处理
}
```

### 8.2 集成测试
1. Android应用发送测试数据
2. 验证Sport_Monitor接收数据
3. 检查数据库存储
4. 验证Web界面显示

### 8.3 性能测试
- 并发连接测试
- 大数据量传输测试
- 网络不稳定场景测试

## 9. 故障排除

### 9.1 常见问题
1. **连接失败**: 检查网络、防火墙、MQTT服务器状态
2. **数据未接收**: 检查主题匹配、JSON格式
3. **性能问题**: 调整QoS级别、优化数据频率

### 9.2 日志分析
- Android端日志：`adb logcat | grep MQTT`
- 服务器端日志：检查Sport_Monitor控制台输出
- MQTT服务器日志：`journalctl -u mosquitto`

## 10. 维护与监控

### 10.1 监控指标
- 连接状态
- 数据吞吐量
- 错误率
- 延迟时间

### 10.2 定期检查
- MQTT服务器健康状态
- 数据库存储空间
- 网络连接质量

---

**注意**: 将`YOUR_SERVER_IP`替换为实际的Sport_Monitor服务器IP地址。生产环境建议使用域名和SSL证书。
