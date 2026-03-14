#!/usr/bin/env python3
"""
多设备蓝牙心率监测系统
- 支持多个蓝牙设备同时监听
- 每个设备对应一个学生
- 数据通过MQTT发送到后端
- 自动重连机制

基于现有的 fixed_heart_rate_tool.py 和 mqtt_publisher.py 代码
"""

import asyncio
import json
import time
from datetime import datetime
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError
import paho.mqtt.client as mqtt

# ====================== 配置 ======================
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sport/monitor/ble"

# 支持多个设备（可自由添加）
DEVICES = [
    {"mac": "E5:BF:3C:6E:3F:01", "name": "CC30", "student_id": "2023423320102"},
    # 在这里添加更多设备
    # {"mac": "E5:BF:3C:6E:3F:02", "name": "CC30-2", "student_id": "2023423320103"},
]

# 全局保存客户端
connected_clients = {}
heart_rate_data = {}
device_status = {}

# MQTT 客户端
mqtt_client = mqtt.Client(client_id="multi-heart-rate-monitor", protocol=mqtt.MQTTv311)

# ====================== 解析心率 ======================
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
    
    # 方法1: KCT专用格式 (21字节固定长度)
    if len(data) == 21:
        # 心率值在倒数第3个字节
        heart_rate = data[-3]
        
        # 验证心率值在合理范围内
        if 40 <= heart_rate <= 200:
            return heart_rate
    
    # 方法2: 在数据中搜索40-200之间的值 (备用)
    for byte in data:
        value = byte
        if 40 <= value <= 200:
            return value
    
    return None

# ====================== MQTT ======================
def mqtt_publish(device_info, heart_rate):
    """通过MQTT发布心率数据"""
    try:
        payload = json.dumps({
            "deviceId": device_info["mac"],
            "studentId": device_info["student_id"],
            "heartRate": heart_rate,
            "timestamp": datetime.now().isoformat(),
            "unixTime": int(time.time() * 1000),
            "dataType": "heart_rate"
        }, ensure_ascii=False)
        
        topic = f"{MQTT_TOPIC}/{device_info['mac']}/heartrate"
        mqtt_client.publish(topic, payload, qos=1)
        
        print(f"📡 {device_info['mac']} | 心率: {heart_rate} bpm")
        return True
    except Exception as e:
        print(f"❌ MQTT发布失败: {e}")
        return False

def mqtt_publish_status(device_info, status, error=None):
    """发布设备状态"""
    try:
        payload = json.dumps({
            "deviceId": device_info["mac"],
            "studentId": device_info["student_id"],
            "status": status,
            "timestamp": datetime.now().isoformat(),
            "error": error
        }, ensure_ascii=False)
        
        topic = f"{MQTT_TOPIC}/{device_info['mac']}/status"
        mqtt_client.publish(topic, payload, qos=1)
        
        print(f"📡 {device_info['mac']} | 状态: {status}")
        return True
    except Exception as e:
        print(f"❌ MQTT状态发布失败: {e}")
        return False

# ====================== BLE 通知处理 ======================
def make_handler(device_info):
    """创建BLE通知处理器"""
    def handler(sender, data):
        hr = parse_kct_heart_rate_fixed(data)
        if hr:
            # 更新心率数据
            heart_rate_data[device_info["mac"]] = {
                "heart_rate": hr,
                "timestamp": datetime.now().isoformat(),
                "device_info": device_info
            }
            
            # 发送到MQTT
            mqtt_publish(device_info, hr)
            
            # 更新设备状态
            device_status[device_info["mac"]] = {
                "status": "connected",
                "last_heart_rate": hr,
                "last_update": time.time()
            }
    
    return handler

# ====================== 连接单个设备 ======================
async def connect_device(device_info):
    """连接并监控单个设备"""
    mac = device_info["mac"]
    
    while True:
        try:
            print(f"\n🔗 连接设备: {mac} ({device_info['name']})")
            mqtt_publish_status(device_info, "connecting")
            
            # 扫描设备
            devices = await BleakScanner.discover(timeout=5)
            target_device = None
            
            for device in devices:
                if device.address.lower() == mac.lower():
                    target_device = device
                    break
                elif device.name and device_info["name"].lower() in device.name.lower():
                    target_device = device
                    break
            
            if not target_device:
                print(f"❌ 未找到设备: {mac}")
                mqtt_publish_status(device_info, "disconnected", "设备未找到")
                await asyncio.sleep(10)  # 等待10秒后重试
                continue
            
            # 连接设备
            client = BleakClient(target_device)
            await client.connect()
            connected_clients[mac] = client
            
            print(f"✅ {mac} 连接成功")
            mqtt_publish_status(device_info, "connected")
            
            # 探索服务并订阅
            services = client.services
            subscribed = False
            
            for service in services:
                for char in service.characteristics:
                    if "notify" in char.properties or "indicate" in char.properties:
                        try:
                            await client.start_notify(char.uuid, make_handler(device_info))
                            print(f"📩 {mac} 订阅成功: {char.uuid}")
                            subscribed = True
                        except Exception as e:
                            print(f"⚠️  {mac} 订阅失败: {e}")
            
            if not subscribed:
                print(f"⚠️  {mac} 未找到可订阅的特征")
                mqtt_publish_status(device_info, "connected", "未找到心率特征")
            
            # 保持连接
            last_heartbeat = time.time()
            while True:
                await asyncio.sleep(1)
                
                # 检查连接状态
                if not client.is_connected:
                    print(f"❌ {mac} 连接断开")
                    break
                
                # 检查心跳（每30秒发送一次状态）
                if time.time() - last_heartbeat > 30:
                    mqtt_publish_status(device_info, "connected")
                    last_heartbeat = time.time()
                
                # 检查是否有心率数据（超过60秒无数据视为异常）
                if mac in device_status:
                    last_update = device_status[mac].get("last_update", 0)
                    if time.time() - last_update > 60:
                        print(f"⚠️  {mac} 超过60秒无心率数据")
                        mqtt_publish_status(device_info, "connected", "无心率数据")
            
        except BleakError as e:
            print(f"❌ {mac} BLE错误: {e}")
            mqtt_publish_status(device_info, "disconnected", str(e))
        except Exception as e:
            print(f"❌ {mac} 连接错误: {e}")
            mqtt_publish_status(device_info, "disconnected", str(e))
        finally:
            # 清理连接
            if mac in connected_clients:
                try:
                    await connected_clients[mac].disconnect()
                except:
                    pass
                del connected_clients[mac]
            
            if mac in device_status:
                device_status[mac]["status"] = "disconnected"
            
            print(f"🔄 {mac} 将在10秒后重连...")
            await asyncio.sleep(10)

# ====================== MQTT回调 ======================
def on_mqtt_connect(client, userdata, flags, rc):
    """MQTT连接回调"""
    if rc == 0:
        print("✅ MQTT连接成功")
    else:
        print(f"❌ MQTT连接失败，错误码: {rc}")

def on_mqtt_disconnect(client, userdata, rc):
    """MQTT断开回调"""
    print(f"📴 MQTT已断开连接，错误码: {rc}")

# ====================== 主程序 ======================
async def main():
    """主函数"""
    print("=" * 60)
    print("多设备蓝牙心率监测系统")
    print("=" * 60)
    
    print(f"\n📋 监控设备列表:")
    for i, device in enumerate(DEVICES, 1):
        print(f"  {i}. {device['name']} ({device['mac']}) -> 学生: {device['student_id']}")
    
    print(f"\n🔌 MQTT服务器: {MQTT_BROKER}:{MQTT_PORT}")
    print("=" * 60)
    
    # 设置MQTT回调
    mqtt_client.on_connect = on_mqtt_connect
    mqtt_client.on_disconnect = on_mqtt_disconnect
    
    # 连接MQTT
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        print("🔄 启动MQTT连接...")
        
        # 等待MQTT连接
        await asyncio.sleep(2)
    except Exception as e:
        print(f"❌ MQTT连接失败: {e}")
        print("⚠️  请确保MQTT服务器正在运行: node simple_mqtt_broker.js")
        return
    
    # 初始化设备状态
    for device in DEVICES:
        device_status[device["mac"]] = {
            "status": "disconnected",
            "last_heart_rate": None,
            "last_update": 0
        }
    
    # 并发连接所有设备
    tasks = [connect_device(device) for device in DEVICES]
    
    if not tasks:
        print("❌ 未配置任何设备，请在DEVICES列表中添加设备")
        return
    
    print(f"\n🚀 开始监控 {len(tasks)} 个设备...")
    print("按 Ctrl+C 停止")
    print("=" * 60)
    
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        print("\n🛑 正在停止所有设备连接...")
    except Exception as e:
        print(f"💥 主程序错误: {e}")
    finally:
        # 断开所有设备连接
        print("\n📴 断开所有设备连接...")
        for mac, client in list(connected_clients.items()):
            try:
                await client.disconnect()
                print(f"  - {mac} 已断开")
            except:
                pass
        
        # 断开MQTT
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("📴 MQTT已断开连接")
        
        # 显示最终状态
        print("\n" + "=" * 60)
        print("最终状态:")
        print("=" * 60)
        
        for device in DEVICES:
            mac = device["mac"]
            if mac in device_status:
                status = device_status[mac]
                print(f"{device['name']} ({mac}):")
                print(f"  状态: {status['status']}")
                if status['last_heart_rate']:
                    print(f"  最后心率: {status['last_heart_rate']} bpm")
                print()

# ====================== 命令行界面 ======================
def show_menu():
    """显示命令行菜单"""
    print("\n" + "=" * 60)
    print("多设备蓝牙心率监测系统 - 命令行界面")
    print("=" * 60)
    print("1. 启动监控所有设备")
    print("2. 查看设备状态")
    print("3. 添加新设备")
    print("4. 查看实时心率数据")
    print("5. 退出")
    print("=" * 60)

async def interactive_mode():
    """交互式模式"""
    while True:
        show_menu()
        choice = input("请选择操作 (1-5): ").strip()
        
        if choice == "1":
            print("\n🚀 启动监控所有设备...")
            await main()
        elif choice == "2":
            print("\n📋 设备状态:")
            print("-" * 40)
            for device in DEVICES:
                mac = device["mac"]
                if mac in device_status:
                    status = device_status[mac]
                    print(f"{device['name']} ({mac}):")
                    print(f"  状态: {status['status']}")
                    if status['last_heart_rate']:
                        print(f"  最后心率: {status['last_heart_rate']} bpm")
                    print()
                else:
                    print(f"{device['name']} ({mac}): 未连接")
                    print()
        elif choice == "3":
            print("\n➕ 添加新设备")
            mac = input("设备MAC地址 (如 E5:BF:3C:6E:3F:01): ").strip()
            name = input("设备名称 (如 CC30): ").strip()
            student_id = input("学生ID (如 2023423320102): ").strip()
            
            new_device = {
                "mac": mac,
                "name": name,
                "student_id": student_id
            }
            
            DEVICES.append(new_device)
            print(f"✅ 设备已添加: {name} ({mac})")
            
            # 保存到配置文件
            try:
                with open("ble_devices_config.json", "w", encoding="utf-8") as f:
                    json.dump(DEVICES, f, indent=2, ensure_ascii=False)
                print("✅ 配置已保存到 ble_devices_config.json")
            except Exception as e:
                print(f"⚠️  保存配置失败: {e}")
                
        elif choice == "4":
            print("\n💓 实时心率数据:")
            print("-" * 40)
            for device in DEVICES:
                mac = device["mac"]
                if mac in heart_rate_data:
                    data = heart_rate_data[mac]
                    print(f"{device['name']} ({mac}):")
                    print(f"  心率: {data['heart_rate']} bpm")
                    print(f"  时间: {data['timestamp']}")
                    print()
                else:
                    print(f"{device['name']} ({mac}): 无数据")
                    print()
        elif choice == "5":
            print("\n👋 再见！")
            break
        else:
            print("❌ 无效选择，请重新输入")

# ====================== 启动 ======================
if __name__ == "__main__":
    print("=" * 60)
    print("多设备蓝牙心率监测系统")
    print("=" * 60)
    
    # 尝试加载配置文件
    try:
        with open("ble_devices_config.json", "r", encoding="utf-8") as f:
            saved_devices = json.load(f)
            if saved_devices:
                DEVICES = saved_devices
                print("✅ 从配置文件加载设备列表")
    except FileNotFoundError:
        print("⚠️  未找到配置文件，使用默认设备列表")
    except Exception as e:
        print(f"⚠️  加载配置文件失败: {e}")
    
    # 检查是否有设备
    if not DEVICES:
        print("❌ 未配置任何设备")
        print("\n请先添加设备:")
        print("1. 运行此脚本")
        print("2. 选择选项 3 添加新设备")
        print("3. 然后选择选项 1 启动监控")
        input("\n按回车键继续...")
        asyncio.run(interactive_mode())
    else:
        # 直接启动监控
        asyncio.run(main())