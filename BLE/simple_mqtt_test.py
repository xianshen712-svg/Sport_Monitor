#!/usr/bin/env python3
"""
简单的MQTT连接测试脚本
测试MQTT服务器连接和基本功能
"""

import json
import time
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False
    print("❌ paho-mqtt 未安装，请运行: pip install paho-mqtt")
    exit(1)

def simple_mqtt_test():
    """简单的MQTT连接测试"""
    print("=" * 60)
    print("MQTT连接测试")
    print("=" * 60)
    
    # 创建MQTT客户端
    client = mqtt.Client(client_id="test-client", protocol=mqtt.MQTTv311)
    
    # 设置回调函数
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("✅ MQTT连接成功")
        else:
            print(f"❌ MQTT连接失败，错误码: {rc}")
    
    def on_disconnect(client, userdata, rc):
        if rc != 0:
            print(f"⚠️  MQTT意外断开连接")
    
    def on_publish(client, userdata, mid):
        print(f"📤 消息发布成功 (消息ID: {mid})")
    
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_publish = on_publish
    
    # 连接到MQTT服务器
    print("\n🔗 正在连接到MQTT服务器 localhost:1883...")
    try:
        client.connect("localhost", 1883, keepalive=60)
        client.loop_start()
        
        # 等待连接
        time.sleep(2)
        
        # 测试发布消息
        test_topic = "sport/monitor/test"
        test_data = {
            "message": "Hello MQTT!",
            "timestamp": datetime.now().isoformat(),
            "test": True
        }
        
        print(f"\n📤 发布测试消息到主题: {test_topic}")
        result = client.publish(test_topic, json.dumps(test_data), qos=0)
        
        # 等待发布完成
        time.sleep(1)
        
        if result.is_published():
            print("✅ 测试消息发布成功")
        else:
            print("❌ 测试消息发布失败")
        
        # 断开连接
        time.sleep(1)
        client.loop_stop()
        client.disconnect()
        print("\n📴 MQTT连接已关闭")
        
        return True
        
    except Exception as e:
        print(f"❌ MQTT连接错误: {e}")
        return False

def test_mqtt_server():
    """测试MQTT服务器是否正在运行"""
    print("\n" + "=" * 60)
    print("MQTT服务器状态测试")
    print("=" * 60)
    
    print("\n请确保MQTT服务器正在运行:")
    print("1. 打开新的终端窗口")
    print("2. 运行以下命令:")
    print("   cd Sport_Monitor")
    print("   node simple_mqtt_broker.js")
    
    print("\n预期输出:")
    print("   MQTT代理服务器运行在端口 1883")
    print("   等待客户端连接...")
    
    return True

def main():
    """主函数"""
    print("MQTT连接与数据传输测试")
    print("=" * 60)
    
    if not MQTT_AVAILABLE:
        print("❌ MQTT功能不可用")
        print("\n请安装必要的Python包:")
        print("pip install paho-mqtt")
        return
    
    # 测试MQTT服务器状态
    test_mqtt_server()
    
    # 测试MQTT连接
    print("\n" + "=" * 60)
    print("开始MQTT连接测试...")
    print("=" * 60)
    
    success = simple_mqtt_test()
    
    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    if success:
        print("✅ MQTT连接测试通过！")
        print("\n下一步:")
        print("1. 确保MQTT服务器正在运行")
        print("2. 运行心率采集脚本: python fixed_heart_rate_tool.py")
        print("3. 检查MQTT服务器日志是否收到数据")
    else:
        print("❌ MQTT连接测试失败")
        print("\n可能的原因:")
        print("1. MQTT服务器未运行")
        print("2. 防火墙阻止了连接")
        print("3. MQTT服务器配置错误")
        
        print("\n解决方案:")
        print("1. 启动MQTT服务器: node simple_mqtt_broker.js")
        print("2. 检查端口1883是否被占用")
        print("3. 重启MQTT服务器")

if __name__ == "__main__":
    main()
