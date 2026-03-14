#!/usr/bin/env python3
"""
MQTT数据发布模块
将BLE设备采集的数据发送到Sport_Monitor后端服务器

使用方法：
from mqtt_publisher import MQTTPublisher

publisher = MQTTPublisher()
publisher.connect()
publisher.publish_heart_rate(device_id, heart_rate)
publisher.publish_health_data(device_id, data)
"""

import json
import time
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False
    print("⚠️  paho-mqtt 未安装，请运行: pip install paho-mqtt")


class MQTTPublisher:
    """MQTT数据发布器"""
    
    def __init__(self, broker="localhost", port=1883, client_id="ble-data-publisher"):
        """
        初始化MQTT发布器
        
        Args:
            broker: MQTT服务器地址，默认localhost
            port: MQTT服务器端口，默认1883
            client_id: 客户端ID
        """
        self.broker = broker
        self.port = port
        self.client_id = client_id
        self.client = None
        self.is_connected = False
        self.topic_prefix = "sport/monitor/ble/"
        
        if not MQTT_AVAILABLE:
            print("❌ MQTT功能不可用，请安装 paho-mqtt")
            return
        
        # 创建MQTT客户端 - 使用MQTT v3.1.1协议
        self.client = mqtt.Client(client_id=client_id, protocol=mqtt.MQTTv311)
        
        # 设置回调函数
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_publish = self._on_publish
    
    def _on_connect(self, client, userdata, flags, rc):
        """连接成功回调"""
        if rc == 0:
            self.is_connected = True
            print(f"✅ MQTT连接成功 - {self.broker}:{self.port}")
        else:
            self.is_connected = False
            print(f"❌ MQTT连接失败，错误码: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """断开连接回调"""
        self.is_connected = False
        if rc != 0:
            print(f"⚠️  MQTT意外断开连接，错误码: {rc}")
        else:
            print("📴 MQTT已断开连接")
    
    def _on_publish(self, client, userdata, mid):
        """发布成功回调"""
        pass  # 静默处理，避免刷屏
    
    def connect(self):
        """
        连接到MQTT服务器
        
        Returns:
            bool: 连接是否成功
        """
        if not MQTT_AVAILABLE or self.client is None:
            return False
        
        try:
            print(f"🔗 正在连接MQTT服务器 {self.broker}:{self.port}...")
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()  # 启动后台线程处理网络
            
            # 等待连接完成
            timeout = 5
            start_time = time.time()
            while not self.is_connected and (time.time() - start_time) < timeout:
                time.sleep(0.1)
            
            return self.is_connected
        except Exception as e:
            print(f"❌ MQTT连接错误: {e}")
            return False
    
    def disconnect(self):
        """断开MQTT连接"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.is_connected = False
    
    def publish(self, topic, data):
        """
        发布数据到指定主题
        
        Args:
            topic: MQTT主题
            data: 要发布的数据（字典）
            
        Returns:
            bool: 发布是否成功
        """
        if not self.is_connected:
            print("⚠️  MQTT未连接，无法发布数据")
            return False
        
        try:
            message = json.dumps(data, ensure_ascii=False)
            result = self.client.publish(topic, message, qos=1)
            result.wait_for_publish()
            return result.is_published()
        except Exception as e:
            print(f"❌ 发布数据失败: {e}")
            return False
    
    def publish_heart_rate(self, device_id, heart_rate, user_id=None):
        """
        发布心率数据
        
        Args:
            device_id: 设备ID（MAC地址）
            heart_rate: 心率值 (bpm)
            user_id: 用户ID（可选）
            
        Returns:
            bool: 发布是否成功
        """
        topic = f"{self.topic_prefix}{device_id}/heartrate"
        
        data = {
            "deviceId": device_id,
            "heartRate": heart_rate,
            "timestamp": datetime.now().isoformat(),
            "unixTime": int(time.time() * 1000),
            "dataType": "heart_rate"
        }
        
        if user_id:
            data["userId"] = user_id
        
        success = self.publish(topic, data)
        if success:
            print(f"📤 心率数据已发送: {heart_rate} bpm -> {topic}")
        return success
    
    def publish_blood_oxygen(self, device_id, blood_oxygen, user_id=None):
        """
        发布血氧数据
        
        Args:
            device_id: 设备ID（MAC地址）
            blood_oxygen: 血氧值 (%)
            user_id: 用户ID（可选）
            
        Returns:
            bool: 发布是否成功
        """
        topic = f"{self.topic_prefix}{device_id}/bloodoxygen"
        
        data = {
            "deviceId": device_id,
            "bloodOxygen": blood_oxygen,
            "timestamp": datetime.now().isoformat(),
            "unixTime": int(time.time() * 1000),
            "dataType": "blood_oxygen"
        }
        
        if user_id:
            data["userId"] = user_id
        
        success = self.publish(topic, data)
        if success:
            print(f"📤 血氧数据已发送: {blood_oxygen}% -> {topic}")
        return success
    
    def publish_steps(self, device_id, steps, distance=0, calorie=0, user_id=None):
        """
        发布步数数据
        
        Args:
            device_id: 设备ID（MAC地址）
            steps: 步数
            distance: 距离（米）
            calorie: 卡路里（千卡）
            user_id: 用户ID（可选）
            
        Returns:
            bool: 发布是否成功
        """
        topic = f"{self.topic_prefix}{device_id}/steps"
        
        data = {
            "deviceId": device_id,
            "steps": steps,
            "distance": distance,
            "calorie": calorie,
            "timestamp": datetime.now().isoformat(),
            "unixTime": int(time.time() * 1000),
            "dataType": "steps"
        }
        
        if user_id:
            data["userId"] = user_id
        
        success = self.publish(topic, data)
        if success:
            print(f"📤 步数数据已发送: {steps} 步 -> {topic}")
        return success
    
    def publish_temperature(self, device_id, temperature, user_id=None):
        """
        发布体温数据
        
        Args:
            device_id: 设备ID（MAC地址）
            temperature: 体温值 (°C)
            user_id: 用户ID（可选）
            
        Returns:
            bool: 发布是否成功
        """
        topic = f"{self.topic_prefix}{device_id}/temperature"
        
        data = {
            "deviceId": device_id,
            "bodyTemperature": temperature,
            "timestamp": datetime.now().isoformat(),
            "unixTime": int(time.time() * 1000),
            "dataType": "temperature"
        }
        
        if user_id:
            data["userId"] = user_id
        
        success = self.publish(topic, data)
        if success:
            print(f"📤 体温数据已发送: {temperature}°C -> {topic}")
        return success
    
    def publish_health_data(self, device_id, data, user_id=None):
        """
        发布完整的健康数据（包含多种指标）
        
        Args:
            device_id: 设备ID（MAC地址）
            data: 健康数据字典，可包含以下字段：
                - heartRate: 心率
                - bloodOxygen: 血氧
                - steps: 步数
                - bodyTemperature: 体温
                - bloodPressure: 血压 {systolic, diastolic}
            user_id: 用户ID（可选）
            
        Returns:
            bool: 发布是否成功
        """
        topic = f"{self.topic_prefix}{device_id}"
        
        health_data = {
            "deviceId": device_id,
            "timestamp": datetime.now().isoformat(),
            "unixTime": int(time.time() * 1000),
            "dataType": "health_data"
        }
        
        # 添加所有提供的健康数据
        if "heartRate" in data:
            health_data["heartRate"] = data["heartRate"]
        if "bloodOxygen" in data:
            health_data["bloodOxygen"] = data["bloodOxygen"]
        if "steps" in data:
            health_data["steps"] = data["steps"]
        if "bodyTemperature" in data:
            health_data["bodyTemperature"] = data["bodyTemperature"]
        if "bloodPressure" in data:
            health_data["bloodPressure"] = data["bloodPressure"]
        
        if user_id:
            health_data["userId"] = user_id
        
        success = self.publish(topic, health_data)
        if success:
            print(f"📤 健康数据已发送 -> {topic}")
        return success


# 全局发布器实例
_publisher = None

def get_publisher(broker="localhost", port=1883):
    """
    获取全局MQTT发布器实例
    
    Args:
        broker: MQTT服务器地址
        port: MQTT服务器端口
        
    Returns:
        MQTTPublisher: 发布器实例
    """
    global _publisher
    if _publisher is None:
        _publisher = MQTTPublisher(broker, port)
        _publisher.connect()
    return _publisher


def close_publisher():
    """关闭全局MQTT发布器"""
    global _publisher
    if _publisher:
        _publisher.disconnect()
        _publisher = None


# 测试代码
if __name__ == "__main__":
    print("=" * 60)
    print("MQTT发布器测试")
    print("=" * 60)
    
    # 创建发布器
    publisher = MQTTPublisher()
    
    # 连接到MQTT服务器
    if publisher.connect():
        print("\n测试发布数据...")
        
        # 测试设备ID
        test_device_id = "E5:BF:3C:6E:3F:01"
        
        # 发布心率数据
        publisher.publish_heart_rate(test_device_id, 75)
        time.sleep(0.5)
        
        # 发布血氧数据
        publisher.publish_blood_oxygen(test_device_id, 98)
        time.sleep(0.5)
        
        # 发布步数数据
        publisher.publish_steps(test_device_id, 5000, distance=3500, calorie=150)
        time.sleep(0.5)
        
        # 发布体温数据
        publisher.publish_temperature(test_device_id, 36.5)
        time.sleep(0.5)
        
        # 发布完整健康数据
        publisher.publish_health_data(test_device_id, {
            "heartRate": 78,
            "bloodOxygen": 97,
            "steps": 5100,
            "bodyTemperature": 36.6
        })
        
        print("\n✅ 测试完成！")
        
        # 断开连接
        publisher.disconnect()
    else:
        print("\n❌ 无法连接到MQTT服务器")
        print("请确保MQTT服务器正在运行:")
        print("  cd Sport_Monitor")
        print("  node simple_mqtt_broker.js")