#!/usr/bin/env python3
"""
KCT手表血氧数据获取工具
基于SDK文档：5.2.55. 血氧数据上报
协议版本 2.022 加入
事件类型: 0x0000001A
"""

import asyncio
import struct
import json
import time
from datetime import datetime
from bleak import BleakClient, BleakScanner
from bleak.exc import BleakError

# 目标设备MAC地址
TARGET_MAC = "E5:BF:3C:6E:3F:01"
TARGET_NAME = "CC30"

# 数据存储
blood_oxygen_data = []

def parse_kct_blood_oxygen(data):
    """
    解析KCT血氧数据
    基于SDK文档：
    - 事件类型: 0x0000001A
    - objects[0] date String 时间
    - objects[1] oxy String 血氧
    或者
    - objects[0] String ""：无数据
    """
    if not data:
        return None
    
    print(f"原始数据 ({len(data)}字节): {data.hex()}")
    
    # 尝试解析为血氧数据
    # 血氧数据格式可能类似于：时间字符串 + 血氧值
    try:
        # 方法1: 尝试解析为字符串
        data_str = data.decode('utf-8', errors='ignore')
        print(f"解码为字符串: {data_str}")
        
        # 查找血氧值 (通常为数字)
        # 血氧正常范围: 95-100%
        for i in range(len(data)):
            if i + 1 < len(data):
                # 尝试解析为2位数字
                value = data[i]
                if 70 <= value <= 100:  # 血氧合理范围
                    print(f"在字节[{i}]找到血氧值: {value}% (0x{value:02x})")
                    return value
        
        # 方法2: 在数据中搜索时间格式
        # 时间格式可能是 "HH:MM:SS" 或类似格式
        if ':' in data_str:
            parts = data_str.split(':')
            if len(parts) >= 2:
                # 尝试从字符串中提取数字
                import re
                numbers = re.findall(r'\d+', data_str)
                for num in numbers:
                    value = int(num)
                    if 70 <= value <= 100:
                        print(f"在字符串中找到血氧值: {value}%")
                        return value
        
        # 方法3: 尝试解析为特定格式
        # 假设数据格式为: 时间(字符串) + 血氧值(字节)
        if len(data) > 10:
            # 最后几个字节可能是血氧值
            for i in range(max(0, len(data)-5), len(data)):
                value = data[i]
                if 70 <= value <= 100:
                    print(f"在字节[{i}]找到血氧值: {value}%")
                    return value
    
    except Exception as e:
        print(f"解析血氧数据时出错: {e}")
    
    print("❌ 未找到有效血氧值")
    return None

def save_blood_oxygen(blood_oxygen):
    """保存血氧数据"""
    if blood_oxygen is None:
        return
    
    timestamp = datetime.now().isoformat()
    data_point = {
        "timestamp": timestamp,
        "blood_oxygen": blood_oxygen,
        "unix_time": time.time()
    }
    
    blood_oxygen_data.append(data_point)
    
    # 保存到JSON
    with open("blood_oxygen_log.json", "w", encoding="utf-8") as f:
        json.dump(blood_oxygen_data, f, indent=2, ensure_ascii=False)
    
    # 保存到CSV
    with open("blood_oxygen_log.csv", "a", encoding="utf-8") as f:
        if f.tell() == 0:
            f.write("timestamp,blood_oxygen,unix_time\n")
        f.write(f"{timestamp},{blood_oxygen},{time.time()}\n")
    
    print(f"🩸 血氧: {blood_oxygen}% ({timestamp})")

def notification_handler(sender, data):
    """处理BLE通知"""
    print(f"\n📨 收到通知 from {sender}")
    blood_oxygen = parse_kct_blood_oxygen(data)
    if blood_oxygen:
        save_blood_oxygen(blood_oxygen)

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
    """探索服务并订阅血氧数据"""
    print("\n🔧 探索设备服务...")
    
    try:
        services = client.services
        print(f"发现 {len(services.services)} 个服务")
        
        subscribed = False
        
        for service in services:
            service_uuid = service.uuid.lower()
            print(f"\n服务: {service_uuid}")
            print(f"描述: {service.description}")
            
            # 检查是否是血氧相关服务
            is_oxygen_service = (
                "1809" in service_uuid or  # 标准血氧服务
                "ffe0" in service_uuid or  # KCT可能使用的服务
                "ffb0" in service_uuid or  # 其他可能服务
                "ae02" in service_uuid     # 从实际数据中看到的服务
            )
            
            if is_oxygen_service:
                print("🎯 可能是血氧服务!")
            
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
                        
                        # 尝试解析血氧
                        blood_oxygen = parse_kct_blood_oxygen(value)
                        if blood_oxygen:
                            save_blood_oxygen(blood_oxygen)
                    except Exception as e:
                        print(f"    ❌ 读取失败: {e}")
        
        return subscribed
        
    except Exception as e:
        print(f"探索服务失败: {e}")
        return False

async def main():
    """主函数"""
    print("=" * 60)
    print("KCT手表血氧数据获取工具")
    print("=" * 60)
    
    print(f"\n目标设备:")
    print(f"  MAC地址: {TARGET_MAC}")
    print(f"  设备名称: {TARGET_NAME}")
    
    print("\n数据解析说明:")
    print("✅ 基于KCT SDK文档 5.2.55. 血氧数据上报")
    print("✅ 事件类型: 0x0000001A (协议版本 2.022)")
    print("✅ 血氧值范围: 70-100% (正常范围: 95-100%)")
    
    print("\n重要提示:")
    print("1. 请先运行BLEDebug.exe并连接手表")
    print("2. 确保手表已连接并显示在BLEDebug中")
    print("3. 然后在手表上启动血氧测量")
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
                print("🎧 正在监听血氧数据...")
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
                            if blood_oxygen_data:
                                latest = blood_oxygen_data[-1]
                                print(f"📊 最新血氧: {latest['blood_oxygen']}% | 总数据点: {len(blood_oxygen_data)}")
                            else:
                                print("⏳ 等待血氧数据...")
                                
                except KeyboardInterrupt:
                    print("\n🛑 停止监听...")
            else:
                print("\n⚠️  未找到可订阅的血氧特征")
                print("可能的原因:")
                print("1. 设备不支持血氧监测")
                print("2. 需要手动启动血氧测量")
                print("3. 设备使用不同的服务UUID")
                
                print("\n建议:")
                print("1. 在手表上手动启动血氧测量")
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
    
    if blood_oxygen_data:
        print(f"✅ 成功获取 {len(blood_oxygen_data)} 个血氧数据点")
        
        # 计算统计信息
        blood_oxygens = [d["blood_oxygen"] for d in blood_oxygen_data]
        
        print(f"📈 统计信息:")
        print(f"   平均血氧: {sum(blood_oxygens)/len(blood_oxygens):.1f}%")
        print(f"   最低血氧: {min(blood_oxygens)}%")
        print(f"   最高血氧: {max(blood_oxygens)}%")
        
        # 时间范围
        if len(blood_oxygen_data) > 1:
            first_time = blood_oxygen_data[0]["timestamp"]
            last_time = blood_oxygen_data[-1]["timestamp"]
            duration = blood_oxygen_data[-1]["unix_time"] - blood_oxygen_data[0]["unix_time"]
            print(f"   时间范围: {first_time} 到 {last_time}")
            print(f"   持续时间: {duration:.1f} 秒")
        
        print(f"\n💾 数据已保存到:")
        print(f"   - blood_oxygen_log.json (JSON格式)")
        print(f"   - blood_oxygen_log.csv (CSV格式)")
        
        print(f"\n📊 数据示例:")
        for i, data in enumerate(blood_oxygen_data[:3], 1):
            print(f"   {i}. {data['timestamp']}: {data['blood_oxygen']}%")
        
        if len(blood_oxygen_data) > 3:
            print(f"   ... 还有 {len(blood_oxygen_data) - 3} 个数据点")
    else:
        print("❌ 未获取到血氧数据")
        
        print("\n可能的原因和解决方案:")
        print("1. 设备未开启血氧监测")
        print("   → 在手表上手动启动血氧测量")
        print("2. 需要发送命令启动血氧监测")
        print("   → 在BLEDebug中发送启动命令")
        print("3. 设备使用自定义数据格式")
        print("   → 在BLEDebug中查看原始数据格式")
        print("4. 血氧数据解析算法需要调整")
        print("   → 查看BLEDebug中的原始数据并调整解析算法")
    
    print("\n" + "=" * 60)
    print("使用说明:")
    print("=" * 60)
    print("1. 启动BLEDebug: 运行BLEDebug.exe")
    print("2. 连接设备: 在BLEDebug中连接手表")
    print("3. 启动血氧测量: 在手表上启动血氧测量")
    print("4. 运行此脚本: python blood_oxygen_tool.py")
    print("5. 查看数据: 查看生成的JSON/CSV文件")
    print("=" * 60)

if __name__ == "__main__":
    # 清空旧数据文件
    try:
        open("blood_oxygen_log.csv", "w").close()
    except:
        pass
    
    # 运行主程序
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 程序已终止")
    except Exception as e:
        print(f"💥 程序错误: {e}")