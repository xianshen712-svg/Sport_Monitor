#!/usr/bin/env python3
"""
修复后的KCT手表心率数据获取工具
使用正确的数据解析算法 + MQTT数据上传

基于实际数据分析：
- 数据格式: 21字节固定长度
- 心率值位置: 倒数第3个字节
- 心率值范围: 40-200 bpm

新增功能：
- 自动将心率数据通过MQTT发送到后端服务器
- 支持实时数据推送到前端显示
"""

import asyncio
import struct
import json
import time
from datetime import datetime
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError

# 导入MQTT发布器
try:
    from mqtt_publisher import MQTTPublisher
    MQTT_ENABLED = True
except ImportError:
    MQTT_ENABLED = False
    print("⚠️  MQTT功能未启用（mqtt_publisher模块未找到或paho-mqtt未安装）")

# 目标设备MAC地址
TARGET_MAC = "E5:BF:3C:6E:3F:01"
TARGET_NAME = "CC30"

# MQTT配置
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

# 数据存储
heart_rate_data = []

# MQTT发布器实例
mqtt_publisher = None

def parse_kct_heart_rate_fixed(data):
    """
    修复后的KCT心率数据解析
    基于实际数据分析：
    - 数据格式: 21字节固定长度
    - 心率值位置: 倒数第3个字节
    - 心率值范围: 40-200 bpm
    """
    if not data:
        return None
    
    print(f"原始数据 ({len(data)}字节): {data.hex()}")
    
    # 方法1: KCT专用格式 (21字节固定长度)
    if len(data) == 21:
        # 心率值在倒数第3个字节
        heart_rate = data[-3]
        
        # 验证心率值在合理范围内
        if 40 <= heart_rate <= 200:
            print(f"✅ KCT格式心率: {heart_rate} bpm (字节[{len(data)-3}])")
            return heart_rate
        else:
            print(f"⚠️  KCT格式心率值超出范围: {heart_rate} bpm")
    
    # 方法2: 标准BLE心率格式 (备用)
    if len(data) >= 2:
        flags = data[0]
        
        if flags & 0x01 == 0 and len(data) >= 2:
            # 8位心率值
            heart_rate = data[1]
            if 40 <= heart_rate <= 200:
                print(f"标准8位心率: {heart_rate} bpm")
                return heart_rate
        elif flags & 0x01 == 1 and len(data) >= 3:
            # 16位心率值
            heart_rate = struct.unpack('<H', data[1:3])[0]
            if 40 <= heart_rate <= 200:
                print(f"标准16位心率: {heart_rate} bpm")
                return heart_rate
    
    # 方法3: 在数据中搜索40-200之间的值 (备用)
    for i, byte in enumerate(data):
        value = byte
        if 40 <= value <= 200:
            print(f"在字节[{i}]找到心率: {value} bpm (0x{value:02x})")
            return value
    
    print("❌ 未找到有效心率值")
    return None

def save_heart_rate(heart_rate):
    """保存心率数据并发送到MQTT服务器"""
    global mqtt_publisher
    
    if heart_rate is None:
        return
    
    timestamp = datetime.now().isoformat()
    data_point = {
        "timestamp": timestamp,
        "heart_rate": heart_rate,
        "unix_time": time.time()
    }
    
    heart_rate_data.append(data_point)
    
    # 保存到JSON
    with open("fixed_heart_rate_log.json", "w", encoding="utf-8") as f:
        json.dump(heart_rate_data, f, indent=2, ensure_ascii=False)
    
    # 保存到CSV
    with open("fixed_heart_rate_log.csv", "a", encoding="utf-8") as f:
        if f.tell() == 0:
            f.write("timestamp,heart_rate,unix_time\n")
        f.write(f"{timestamp},{heart_rate},{time.time()}\n")
    
    print(f"💓 心率: {heart_rate} bpm ({timestamp})")
    
    # 发送到MQTT服务器
    if MQTT_ENABLED and mqtt_publisher and mqtt_publisher.is_connected:
        mqtt_publisher.publish_heart_rate(TARGET_MAC, heart_rate)

def notification_handler(sender, data):
    """处理BLE通知"""
    print(f"\n📨 收到通知 from {sender}")
    heart_rate = parse_kct_heart_rate_fixed(data)
    if heart_rate:
        save_heart_rate(heart_rate)

async def find_connected_device():
    """查找已连接的设备"""
    print("🔍 查找已连接的BLE设备...")
    
    devices = await BleakScanner.discover(timeout=5)
    
    print(f"发现 {len(devices)} 个设备:")
    
    connected_devices = []
    
    for device in devices:
        print(f"  - {device.address}: {device.name if device.name else '未知'}")
        
        # 检查是否为目标设备
        if device.address.lower() == TARGET_MAC.lower():
            print(f"✅ 找到目标设备: {device.name if device.name else '未知'} ({device.address})")
            connected_devices.append(device)
        elif device.name and TARGET_NAME.lower() in device.name.lower():
            print(f"✅ 通过名称找到设备: {device.name} ({device.address})")
            connected_devices.append(device)
    
    return connected_devices

async def explore_services_and_subscribe(client):
    """探索服务并订阅心率数据"""
    print("\n🔧 探索设备服务...")
    
    try:
        services = client.services
        print(f"发现 {len(services.services)} 个服务")
        
        subscribed = False
        
        for service in services:
            service_uuid = service.uuid.lower()
            print(f"\n服务: {service_uuid}")
            print(f"描述: {service.description}")
            
            # 检查是否是心率相关服务
            is_heart_service = (
                "180d" in service_uuid or  # 标准心率服务
                "ffe0" in service_uuid or  # KCT可能使用的服务
                "ffb0" in service_uuid or  # 其他可能服务
                "ae02" in service_uuid     # 从实际数据中看到的服务
            )
            
            if is_heart_service:
                print("🎯 可能是心率服务!")
            
            # 遍历特征
            for char in service.characteristics:
                char_uuid = char.uuid.lower()
                print(f"  特征: {char_uuid}")
                print(f"    描述: {char.description}")
                print(f"    属性: {char.properties}")
                
                # 尝试订阅支持通知的特征
                if "notify" in char.properties or "indicate" in char.properties:
                    try:
                        print(f"    尝试订阅...")
                        await client.start_notify(char.uuid, notification_handler)
                        print(f"    ✅ 订阅成功")
                        subscribed = True
                    except Exception as e:
                        print(f"    ❌ 订阅失败: {e}")
                
                # 尝试读取特征值
                if "read" in char.properties:
                    try:
                        value = await client.read_gatt_char(char.uuid)
                        print(f"    读取值: {value.hex()}")
                        
                        # 尝试解析心率
                        heart_rate = parse_kct_heart_rate_fixed(value)
                        if heart_rate:
                            save_heart_rate(heart_rate)
                    except Exception as e:
                        print(f"    ❌ 读取失败: {e}")
        
        return subscribed
        
    except Exception as e:
        print(f"探索服务失败: {e}")
        return False

async def main():
    """主函数"""
    print("=" * 60)
    print("修复后的KCT手表心率数据获取工具")
    print("=" * 60)
    
    print(f"\n目标设备:")
    print(f"  MAC地址: {TARGET_MAC}")
    print(f"  设备名称: {TARGET_NAME}")
    
    print("\n数据解析说明:")
    print("✅ 使用修复后的解析算法")
    print("✅ 心率值在21字节数据的倒数第3个字节")
    print("✅ 正确解析范围: 40-200 bpm")
    
    print("\n重要提示:")
    print("1. 请先运行BLEDebug.exe并连接手表")
    print("2. 确保手表已连接并显示在BLEDebug中")
    print("3. 然后在手表上启动心率测量")
    print("4. 最后运行此脚本获取数据")
    print("-" * 60)
    
    # 查找设备
    devices = await find_connected_device()
    
    if not devices:
        print(f"\n❌ 未找到目标设备")
        print("\n可能的原因:")
        print("1. BLEDebug未运行或未连接设备")
        print("2. 手表未开机或蓝牙未开启")
        print("3. 设备使用了不同的MAC地址")
        
        print("\n解决方案:")
        print("1. 运行BLEDebug.exe")
        print("2. 在BLEDebug中连接设备")
        print("3. 确保设备在范围内")
        print("4. 重启手表蓝牙")
        return
    
    # 连接第一个找到的设备
    device = devices[0]
    print(f"\n🔗 连接设备: {device.address}")
    
    try:
        async with BleakClient(device) as client:
            print("✅ 连接成功!")
            
            # 探索服务并订阅
            subscribed = await explore_services_and_subscribe(client)
            
            if subscribed:
                print("\n" + "=" * 60)
                print("🎧 正在监听心率数据...")
                print("按 Ctrl+C 停止")
                print("=" * 60)
                
                # 显示统计信息
                last_display = time.time()
                try:
                    while True:
                        await asyncio.sleep(1)
                        
                        # 每5秒显示一次统计
                        if time.time() - last_display >= 5:
                            last_display = time.time()
                            if heart_rate_data:
                                latest = heart_rate_data[-1]
                                print(f"📊 最新心率: {latest['heart_rate']} bpm | 总数据点: {len(heart_rate_data)}")
                            else:
                                print("⏳ 等待心率数据...")
                                
                except KeyboardInterrupt:
                    print("\n🛑 停止监听...")
            else:
                print("\n⚠️  未找到可订阅的心率特征")
                print("可能的原因:")
                print("1. 设备不支持心率监测")
                print("2. 需要手动启动心率测量")
                print("3. 设备使用不同的服务UUID")
                
                print("\n建议:")
                print("1. 在手表上手动启动心率测量")
                print("2. 检查BLEDebug中显示的服务和特征")
                print("3. 查看BLEDebug的输出窗口")
    
    except BleakError as e:
        print(f"❌ 连接失败: {e}")
    except Exception as e:
        print(f"💥 错误: {e}")
    
    # 显示结果
    print("\n" + "=" * 60)
    print("测试结果:")
    print("=" * 60)
    
    if heart_rate_data:
        print(f"✅ 成功获取 {len(heart_rate_data)} 个心率数据点")
        
        # 计算统计信息
        heart_rates = [d["heart_rate"] for d in heart_rate_data]
        
        print(f"📈 统计信息:")
        print(f"   平均心率: {sum(heart_rates)/len(heart_rates):.1f} bpm")
        print(f"   最低心率: {min(heart_rates)} bpm")
        print(f"   最高心率: {max(heart_rates)} bpm")
        
        # 时间范围
        if len(heart_rate_data) > 1:
            first_time = heart_rate_data[0]["timestamp"]
            last_time = heart_rate_data[-1]["timestamp"]
            duration = heart_rate_data[-1]["unix_time"] - heart_rate_data[0]["unix_time"]
            print(f"   时间范围: {first_time} 到 {last_time}")
            print(f"   持续时间: {duration:.1f} 秒")
        
        print(f"\n💾 数据已保存到:")
        print(f"   - fixed_heart_rate_log.json (JSON格式)")
        print(f"   - fixed_heart_rate_log.csv (CSV格式)")
        
        print(f"\n📊 数据示例:")
        for i, data in enumerate(heart_rate_data[:3], 1):
            print(f"   {i}. {data['timestamp']}: {data['heart_rate']} bpm")
        
        if len(heart_rate_data) > 3:
            print(f"   ... 还有 {len(heart_rate_data) - 3} 个数据点")
    else:
        print("❌ 未获取到心率数据")
        
        print("\n可能的原因和解决方案:")
        print("1. 设备未开启心率监测")
        print("   → 在手表上手动启动心率测量")
        print("2. 需要发送命令启动心率监测")
        print("   → 在BLEDebug中发送启动命令")
        print("3. 设备使用自定义数据格式")
        print("   → 在BLEDebug中查看原始数据格式")
    
    print("\n" + "=" * 60)
    print("使用说明:")
    print("=" * 60)
    print("1. 启动BLEDebug: 运行BLEDebug.exe")
    print("2. 连接设备: 在BLEDebug中连接手表")
    print("3. 启动心率测量: 在手表上启动心率测量")
    print("4. 运行此脚本: python fixed_heart_rate_tool.py")
    print("5. 查看数据: 查看生成的JSON/CSV文件")
    print("=" * 60)

def init_mqtt():
    """初始化MQTT连接"""
    global mqtt_publisher
    
    if not MQTT_ENABLED:
        print("⚠️  MQTT功能未启用，数据将仅保存到本地文件")
        return False
    
    print(f"\n🔌 正在连接MQTT服务器 {MQTT_BROKER}:{MQTT_PORT}...")
    mqtt_publisher = MQTTPublisher(MQTT_BROKER, MQTT_PORT)
    
    if mqtt_publisher.connect():
        print("✅ MQTT连接成功！数据将实时发送到后端服务器")
        return True
    else:
        print("⚠️  MQTT连接失败，数据将仅保存到本地文件")
        print("   请确保MQTT服务器正在运行: node simple_mqtt_broker.js")
        return False


def cleanup_mqtt():
    """清理MQTT连接"""
    global mqtt_publisher
    
    if mqtt_publisher:
        mqtt_publisher.disconnect()
        mqtt_publisher = None


if __name__ == "__main__":
    # 清空旧数据文件
    try:
        open("fixed_heart_rate_log.csv", "w").close()
    except:
        pass
    
    # 初始化MQTT
    mqtt_connected = init_mqtt()
    
    # 运行主程序
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 程序已终止")
    except Exception as e:
        print(f"💥 程序错误: {e}")
    finally:
        # 清理MQTT连接
        cleanup_mqtt()
        
        if mqtt_connected:
            print("📊 MQTT连接已关闭")
