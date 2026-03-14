#!/usr/bin/env python3
"""
KCT手表体温数据获取工具
基于SDK文档：体温数据上报
事件类型: 0x01120300
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
temperature_data = []

def parse_kct_temperature(data):
    """
    解析KCT体温数据
    基于SDK文档：
    - 事件类型: 0x01120300
    - objects[0] temperature Double 体温（摄氏度，保留2位小数）
    - objects[1] timestamp Long 测量时间（UNIX时间戳）
    - objects[2] mode Integer 测量模式
    - objects[3] surfaceTemperature Double 体表温度
    - objects[4] ambientTemperature Double 环境温度
    """
    if not data:
        return None
    
    print(f"体温原始数据 ({len(data)}字节): {data.hex()}")
    
    try:
        # 体温数据可能采用特定格式
        # 尝试解析为结构化的体温数据
        
        # 方法1: 尝试解析为包含多个字段的结构
        # 体温数据可能包含：体温、时间戳、模式、体表温度、环境温度
        
        # 体温正常范围: 35.0-42.0°C
        # 体表温度正常范围: 30.0-40.0°C
        # 环境温度正常范围: 10.0-40.0°C
        
        # 尝试查找体温值 (35.0-42.0°C)
        # 体温可能是浮点数，需要解析
        
        # 方法2: 在数据中搜索可能的体温值
        # 体温值可能是浮点数 (8字节 double)
        if len(data) >= 8:
            # 尝试解析为double
            for i in range(len(data) - 7):
                try:
                    # 尝试解析8字节double
                    temp_bytes = data[i:i+8]
                    temperature = struct.unpack('<d', temp_bytes)[0]
                    
                    # 检查是否在合理体温范围内
                    if 35.0 <= temperature <= 42.0:
                        print(f"✅ 找到体温值: {temperature:.2f}°C (字节[{i}:{i+8}])")
                        
                        # 尝试解析其他字段
                        result = {
                            "temperature": round(temperature, 2),
                            "timestamp": time.time(),
                            "mode": 0,  # 默认手动测量
                            "surface_temperature": None,
                            "ambient_temperature": None
                        }
                        
                        # 尝试查找体表温度 (30.0-40.0°C)
                        for j in range(i+8, len(data) - 7):
                            try:
                                surface_temp_bytes = data[j:j+8]
                                surface_temp = struct.unpack('<d', surface_temp_bytes)[0]
                                if 30.0 <= surface_temp <= 40.0:
                                    result["surface_temperature"] = round(surface_temp, 2)
                                    print(f"   体表温度: {surface_temp:.2f}°C")
                                    break
                            except:
                                continue
                        
                        # 尝试查找环境温度 (10.0-40.0°C)
                        for j in range(i+16, len(data) - 7):
                            try:
                                ambient_temp_bytes = data[j:j+8]
                                ambient_temp = struct.unpack('<d', ambient_temp_bytes)[0]
                                if 10.0 <= ambient_temp <= 40.0:
                                    result["ambient_temperature"] = round(ambient_temp, 2)
                                    print(f"   环境温度: {ambient_temp:.2f}°C")
                                    break
                            except:
                                continue
                        
                        return result
                except:
                    continue
        
        # 方法3: 尝试解析为整数温度值 (可能以整数形式存储，如 365 表示 36.5°C)
        for i in range(len(data) - 1):
            # 尝试解析为2字节整数
            if i + 1 < len(data):
                temp_int = struct.unpack('<H', data[i:i+2])[0]
                if 3500 <= temp_int <= 4200:  # 35.00-42.00°C
                    temperature = temp_int / 100.0
                    print(f"✅ 找到体温值(整数格式): {temperature:.2f}°C (字节[{i}:{i+2}])")
                    
                    result = {
                        "temperature": temperature,
                        "timestamp": time.time(),
                        "mode": 0,
                        "surface_temperature": None,
                        "ambient_temperature": None
                    }
                    return result
        
        # 方法4: 尝试解析为单字节温度值 (可能简化)
        for i, byte in enumerate(data):
            value = byte
            if 35 <= value <= 42:  # 整数体温值
                print(f"✅ 找到体温值(单字节): {value}°C (字节[{i}])")
                
                result = {
                    "temperature": float(value),
                    "timestamp": time.time(),
                    "mode": 0,
                    "surface_temperature": None,
                    "ambient_temperature": None
                }
                return value
        
        # 方法5: 尝试解析为字符串
        try:
            data_str = data.decode('utf-8', errors='ignore')
            print(f"解码为字符串: {data_str}")
            
            # 在字符串中查找温度值
            import re
            
            # 查找浮点数
            float_pattern = r'\d+\.\d+'
            floats = re.findall(float_pattern, data_str)
            for f in floats:
                temp = float(f)
                if 35.0 <= temp <= 42.0:
                    print(f"✅ 在字符串中找到体温值: {temp:.2f}°C")
                    
                    result = {
                        "temperature": temp,
                        "timestamp": time.time(),
                        "mode": 0,
                        "surface_temperature": None,
                        "ambient_temperature": None
                    }
                    return result
            
            # 查找整数
            int_pattern = r'\d+'
            ints = re.findall(int_pattern, data_str)
            for num in ints:
                temp_int = int(num)
                if 35 <= temp_int <= 42:
                    print(f"✅ 在字符串中找到体温值(整数): {temp_int}°C")
                    
                    result = {
                        "temperature": float(temp_int),
                        "timestamp": time.time(),
                        "mode": 0,
                        "surface_temperature": None,
                        "ambient_temperature": None
                    }
                    return result
        except:
            pass
    
    except Exception as e:
        print(f"解析体温数据时出错: {e}")
    
    print("❌ 未找到有效体温值")
    return None

def save_temperature(temperature_data_point):
    """保存体温数据"""
    if temperature_data_point is None:
        return
    
    timestamp = datetime.now().isoformat()
    
    # 创建完整的数据点
    data_point = {
        "timestamp": timestamp,
        "unix_time": time.time(),
        "type": "temperature"
    }
    
    # 添加体温数据
    if isinstance(temperature_data_point, dict):
        # 如果是字典，包含多个字段
        data_point.update(temperature_data_point)
        temperature_value = temperature_data_point.get("temperature", 0)
    else:
        # 如果是单个值
        data_point["temperature"] = temperature_data_point
        data_point["mode"] = 0
        data_point["surface_temperature"] = None
        data_point["ambient_temperature"] = None
        temperature_value = temperature_data_point
    
    temperature_data.append(data_point)
    
    # 保存到JSON
    with open("temperature_log.json", "w", encoding="utf-8") as f:
        json.dump(temperature_data, f, indent=2, ensure_ascii=False)
    
    # 保存到CSV
    with open("temperature_log.csv", "a", encoding="utf-8") as f:
        if f.tell() == 0:
            f.write("timestamp,temperature,mode,surface_temperature,ambient_temperature,unix_time\n")
        
        temp = data_point.get("temperature", "")
        mode = data_point.get("mode", "")
        surface_temp = data_point.get("surface_temperature", "")
        ambient_temp = data_point.get("ambient_temperature", "")
        
        f.write(f"{timestamp},{temp},{mode},{surface_temp},{ambient_temp},{time.time()}\n")
    
    # 显示信息
    if isinstance(temperature_data_point, dict):
        print(f"🌡️  体温: {temperature_value:.2f}°C ({timestamp})")
        if data_point.get("surface_temperature"):
            print(f"   体表温度: {data_point['surface_temperature']:.2f}°C")
        if data_point.get("ambient_temperature"):
            print(f"   环境温度: {data_point['ambient_temperature']:.2f}°C")
        print(f"   测量模式: {data_point.get('mode', 0)}")
    else:
        print(f"🌡️  体温: {temperature_value}°C ({timestamp})")

def notification_handler(sender, data):
    """处理BLE通知"""
    print(f"\n📨 收到通知 from {sender}")
    temperature_data_point = parse_kct_temperature(data)
    if temperature_data_point:
        save_temperature(temperature_data_point)

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
    """探索服务并订阅体温数据"""
    print("\n🔧 探索设备服务...")
    
    try:
        services = client.services
        print(f"发现 {len(services.services)} 个服务")
        
        subscribed = False
        
        for service in services:
            service_uuid = service.uuid.lower()
            print(f"\n服务: {service_uuid}")
            print(f"描述: {service.description}")
            
            # 检查是否是体温相关服务
            is_temperature_service = (
                "1809" in service_uuid or  # 标准体温服务 (实际上是血氧，但可能复用)
                "ffe0" in service_uuid or  # KCT可能使用的服务
                "ffb0" in service_uuid or  # 其他可能服务
                "ae02" in service_uuid or  # 从实际数据中看到的服务
                "180a" in service_uuid     # 设备信息服务，可能包含体温
            )
            
            if is_temperature_service:
                print("🎯 可能是体温服务!")
            
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
                        
                        # 尝试解析体温
                        temperature_data_point = parse_kct_temperature(value)
                        if temperature_data_point:
                            save_temperature(temperature_data_point)
                    except Exception as e:
                        print(f"    ❌ 读取失败: {e}")
        
        return subscribed
        
    except Exception as e:
        print(f"探索服务失败: {e}")
        return False

async def main():
    """主函数"""
    print("=" * 60)
    print("KCT手表体温数据获取工具")
    print("=" * 60)
    
    print(f"\n目标设备:")
    print(f"  MAC地址: {TARGET_MAC}")
    print(f"  设备名称: {TARGET_NAME}")
    
    print("\n数据解析说明:")
    print("✅ 基于KCT SDK文档体温数据上报")
    print("✅ 事件类型: 0x01120300")
    print("✅ 体温范围: 35.0-42.0°C (正常: 36.0-37.5°C)")
    print("✅ 体表温度范围: 30.0-40.0°C")
    print("✅ 环境温度范围: 10.0-40.0°C")
    
    print("\n测量模式说明:")
    print("0: 手动启动的测量结果（最终结果）")
    print("1: 自动监测启动的测量结果（最终结果）")
    print("2: 手动启动的测量过程值")
    print("3: 自动监测启动的测量过程值")
    
    print("\n重要提示:")
    print("1. 请先运行BLEDebug.exe并连接手表")
    print("2. 确保手表已连接并显示在BLEDebug中")
    print("3. 然后在手表上启动体温测量")
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
                print("🎧 正在监听体温数据...")
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
                            if temperature_data:
                                latest = temperature_data[-1]
                                temp = latest.get("temperature", 0)
                                if isinstance(temp, float):
                                    print(f"📊 最新体温: {temp:.2f}°C | 总数据点: {len(temperature_data)}")
                                else:
                                    print(f"📊 最新体温: {temp}°C | 总数据点: {len(temperature_data)}")
                            else:
                                print("⏳ 等待体温数据...")
                                
                except KeyboardInterrupt:
                    print("\n🛑 停止监听...")
            else:
                print("\n⚠️  未找到可订阅的体温特征")
                print("可能的原因:")
                print("1. 设备不支持体温监测")
                print("2. 需要手动启动体温测量")
                print("3. 设备使用不同的服务UUID")
                
                print("\n建议:")
                print("1. 在手表上手动启动体温测量")
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
    
    if temperature_data:
        print(f"✅ 成功获取 {len(temperature_data)} 个体温数据点")
        
        # 计算统计信息
        temperatures = []
        surface_temps = []
        ambient_temps = []
        
        for data in temperature_data:
            temp = data.get("temperature")
            if temp is not None:
                temperatures.append(float(temp))
            
            surface_temp = data.get("surface_temperature")
            if surface_temp is not None:
                surface_temps.append(float(surface_temp))
            
            ambient_temp = data.get("ambient_temperature")
            if ambient_temp is not None:
                ambient_temps.append(float(ambient_temp))
        
        if temperatures:
            print(f"\n📈 体温统计:")
            print(f"   数据点: {len(temperatures)}")
            print(f"   平均体温: {sum(temperatures)/len(temperatures):.2f}°C")
            print(f"   最低体温: {min(temperatures):.2f}°C")
            print(f"   最高体温: {max(temperatures):.2f}°C")
        
        if surface_temps:
            print(f"\n📈 体表温度统计:")
            print(f"   数据点: {len(surface_temps)}")
            print(f"   平均体表温度: {sum(surface_temps)/len(surface_temps):.2f}°C")
            print(f"   最低体表温度: {min(surface_temps):.2f}°C")
            print(f"   最高体表温度: {max(surface_temps):.2f}°C")
        
        if ambient_temps:
            print(f"\n📈 环境温度统计:")
            print(f"   数据点: {len(ambient_temps)}")
            print(f"   平均环境温度: {sum(ambient_temps)/len(ambient_temps):.2f}°C")
            print(f"   最低环境温度: {min(ambient_temps):.2f}°C")
            print(f"   最高环境温度: {max(ambient_temps):.2f}°C")
        
        # 时间范围
        if len(temperature_data) > 1:
            first_time = temperature_data[0]["timestamp"]
            last_time = temperature_data[-1]["timestamp"]
            duration = temperature_data[-1]["unix_time"] - temperature_data[0]["unix_time"]
            print(f"\n⏰ 时间范围:")
            print(f"   开始时间: {first_time}")
            print(f"   结束时间: {last_time}")
            print(f"   持续时间: {duration:.1f} 秒")
        
        print(f"\n💾 数据已保存到:")
        print(f"   - temperature_log.json (JSON格式)")
        print(f"   - temperature_log.csv (CSV格式)")
        
        print(f"\n📊 数据示例:")
        for i, data in enumerate(temperature_data[:3], 1):
            temp = data.get("temperature", "N/A")
            if isinstance(temp, float):
                temp_str = f"{temp:.2f}°C"
            else:
                temp_str = f"{temp}°C"
            
            surface_temp = data.get("surface_temperature")
            ambient_temp = data.get("ambient_temperature")
            mode = data.get("mode", 0)
            
            print(f"   {i}. {data['timestamp']}:")
            print(f"      体温: {temp_str}")
            if surface_temp:
                print(f"      体表温度: {surface_temp:.2f}°C")
            if ambient_temp:
                print(f"      环境温度: {ambient_temp:.2f}°C")
            print(f"      测量模式: {mode}")
        
        if len(temperature_data) > 3:
            print(f"   ... 还有 {len(temperature_data) - 3} 个数据点")
    else:
        print("❌ 未获取到体温数据")
        
        print("\n可能的原因和解决方案:")
        print("1. 设备未开启体温监测")
        print("   → 在手表上手动启动体温测量")
        print("2. 需要发送命令启动体温监测")
        print("   → 在BLEDebug中发送启动命令")
        print("3. 设备使用自定义数据格式")
        print("   → 在BLEDebug中查看原始数据格式")
        print("4. 体温数据解析算法需要调整")
        print("   → 查看BLEDebug中的原始数据并调整解析算法")
    
    print("\n" + "=" * 60)
    print("使用说明:")
    print("=" * 60)
    print("1. 启动BLEDebug: 运行BLEDebug.exe")
    print("2. 连接设备: 在BLEDebug中连接手表")
    print("3. 启动体温测量: 在手表上启动体温测量")
    print("4. 运行此脚本: python temperature_tool.py")
    print("5. 查看数据: 查看生成的JSON/CSV文件")
    print("=" * 60)

if __name__ == "__main__":
    # 清空旧数据文件
    try:
        open("temperature_log.csv", "w").close()
    except:
        pass
    
    # 运行主程序
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 程序已终止")
    except Exception as e:
        print(f"💥 程序错误: {e}")
