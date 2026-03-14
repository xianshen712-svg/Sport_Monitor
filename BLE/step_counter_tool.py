#!/usr/bin/env python3
"""
KCT手表步数数据获取工具
基于SDK文档：计步数据上报 (SEND,10)
协议版本 1.10 加入
事件类型: 0x00000017

功能说明：如果步数有变化，设备主动发该事件给APP。
数据格式：
- objects[0] map HashMap<String,Object> 计步数据
  或
- objects[0] String ""：无数据

计步数据说明：
- date String 时间
- step String 步数
- distance String 距离（m / 10）
- calorie String 消耗（KCal / 10）
- time String 运动时间 2.00+
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
step_data = []

def parse_kct_step_data(data):
    """
    解析KCT步数数据
    基于SDK文档：
    - 事件类型: 0x00000017
    - objects[0] map HashMap<String,Object> 计步数据
      或
    - objects[0] String ""：无数据
    
    计步数据字段：
    - date String 时间
    - step String 步数
    - distance String 距离（m / 10）
    - calorie String 消耗（KCal / 10）
    - time String 运动时间 2.00+
    """
    if not data:
        return None
    
    print(f"步数原始数据 ({len(data)}字节): {data.hex()}")
    
    try:
        # 方法1: 尝试解析为JSON格式 (HashMap<String,Object> 可能序列化为JSON)
        try:
            data_str = data.decode('utf-8', errors='ignore')
            print(f"解码为字符串: {data_str}")
            
            # 检查是否为空数据
            if data_str == "":
                print("⚠️  空数据: 无步数变化")
                return None
            
            # 尝试解析为JSON
            if data_str.startswith('{') and data_str.endswith('}'):
                try:
                    step_dict = json.loads(data_str)
                    print(f"✅ JSON解析成功: {step_dict}")
                    
                    # 验证必要字段
                    required_fields = ['date', 'step', 'distance', 'calorie', 'time']
                    if all(field in step_dict for field in required_fields):
                        return step_dict
                    else:
                        print(f"⚠️  JSON缺少必要字段: {step_dict}")
                except json.JSONDecodeError as e:
                    print(f"JSON解析失败: {e}")
        except:
            pass
        
        # 方法2: 尝试解析为键值对格式 (可能不是标准JSON)
        try:
            data_str = data.decode('utf-8', errors='ignore')
            
            # 尝试解析为键值对格式，如 "date=2024-01-01,step=1000,distance=5000,calorie=50,time=3600"
            if '=' in data_str or ':' in data_str:
                step_dict = {}
                
                # 尝试多种分隔符
                pairs = []
                if ',' in data_str:
                    pairs = data_str.split(',')
                elif ';' in data_str:
                    pairs = data_str.split(';')
                elif '&' in data_str:
                    pairs = data_str.split('&')
                else:
                    # 尝试按等号分割
                    if '=' in data_str:
                        parts = data_str.split('=')
                        if len(parts) >= 2:
                            # 简单键值对
                            key = parts[0].strip()
                            value = '='.join(parts[1:]).strip()
                            step_dict[key] = value
                
                # 解析键值对
                for pair in pairs:
                    if '=' in pair:
                        key, value = pair.split('=', 1)
                        step_dict[key.strip()] = value.strip()
                    elif ':' in pair:
                        key, value = pair.split(':', 1)
                        step_dict[key.strip()] = value.strip()
                
                if step_dict:
                    print(f"✅ 键值对解析成功: {step_dict}")
                    
                    # 检查是否有步数相关字段
                    step_fields = ['step', 'steps', 'count', 'distance', 'calorie', 'time', 'date']
                    if any(field in step_dict for field in step_fields):
                        return step_dict
        except:
            pass
        
        # 方法3: 尝试解析为结构化二进制数据
        # 步数数据可能包含：时间戳、步数、距离、卡路里、运动时间
        
        # 尝试查找步数值 (通常为整数)
        # 步数范围: 0-50000 (合理范围)
        for i in range(len(data) - 3):
            # 尝试解析为4字节整数 (可能为步数)
            if i + 3 < len(data):
                step_count = struct.unpack('<I', data[i:i+4])[0]
                if 0 <= step_count <= 50000:
                    print(f"✅ 找到步数值(4字节): {step_count} 步 (字节[{i}:{i+4}])")
                    
                    # 尝试构建完整数据
                    step_dict = {
                        'step': str(step_count),
                        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'distance': '0',
                        'calorie': '0',
                        'time': '0'
                    }
                    
                    # 尝试查找距离值 (可能为整数，单位: m/10)
                    for j in range(i+4, len(data) - 3):
                        distance_val = struct.unpack('<I', data[j:j+4])[0]
                        if 0 <= distance_val <= 1000000:  # 0-100km
                            step_dict['distance'] = str(distance_val)
                            print(f"   距离: {distance_val} (m/10)")
                            break
                    
                    # 尝试查找卡路里值 (可能为整数，单位: KCal/10)
                    for j in range(i+8, len(data) - 3):
                        calorie_val = struct.unpack('<I', data[j:j+4])[0]
                        if 0 <= calorie_val <= 10000:  # 0-1000 KCal
                            step_dict['calorie'] = str(calorie_val)
                            print(f"   卡路里: {calorie_val} (KCal/10)")
                            break
                    
                    # 尝试查找运动时间 (可能为整数，单位: 秒)
                    for j in range(i+12, len(data) - 3):
                        time_val = struct.unpack('<I', data[j:j+4])[0]
                        if 0 <= time_val <= 86400:  # 0-24小时
                            step_dict['time'] = str(time_val)
                            print(f"   运动时间: {time_val} 秒")
                            break
                    
                    return step_dict
        
        # 方法4: 尝试解析为2字节整数 (步数)
        for i in range(len(data) - 1):
            if i + 1 < len(data):
                step_count = struct.unpack('<H', data[i:i+2])[0]
                if 0 <= step_count <= 50000:
                    print(f"✅ 找到步数值(2字节): {step_count} 步 (字节[{i}:{i+2}])")
                    
                    step_dict = {
                        'step': str(step_count),
                        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'distance': '0',
                        'calorie': '0',
                        'time': '0'
                    }
                    return step_dict
        
        # 方法5: 在字符串中搜索数字
        try:
            data_str = data.decode('utf-8', errors='ignore')
            
            # 查找所有数字
            import re
            numbers = re.findall(r'\d+', data_str)
            
            if numbers:
                # 尝试识别步数 (通常为较大的数字)
                for num in numbers:
                    step_count = int(num)
                    if 100 <= step_count <= 50000:  # 合理步数范围
                        print(f"✅ 在字符串中找到步数: {step_count} 步")
                        
                        step_dict = {
                            'step': str(step_count),
                            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'distance': '0',
                            'calorie': '0',
                            'time': '0'
                        }
                        
                        # 尝试查找其他数字作为距离、卡路里等
                        other_nums = [n for n in numbers if n != num]
                        if len(other_nums) >= 1:
                            step_dict['distance'] = other_nums[0]
                        if len(other_nums) >= 2:
                            step_dict['calorie'] = other_nums[1]
                        if len(other_nums) >= 3:
                            step_dict['time'] = other_nums[2]
                        
                        return step_dict
        except:
            pass
        
        # 方法6: 在字节中搜索可能的步数值
        for i, byte in enumerate(data):
            # 单字节步数 (0-255)
            if 0 <= byte <= 255:
                # 检查周围字节是否也构成数字
                if i + 3 < len(data):
                    # 尝试解析为多字节数字
                    multi_byte = data[i:i+4]
                    # 检查是否看起来像数字 (大部分字节在可打印范围内)
                    printable_count = sum(1 for b in multi_byte if 32 <= b <= 126)
                    if printable_count >= 2:
                        # 可能是ASCII数字
                        try:
                            num_str = multi_byte.decode('ascii', errors='ignore')
                            if num_str.isdigit():
                                step_count = int(num_str)
                                if 0 <= step_count <= 50000:
                                    print(f"✅ 找到ASCII步数: {step_count} 步")
                                    
                                    step_dict = {
                                        'step': str(step_count),
                                        'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                        'distance': '0',
                                        'calorie': '0',
                                        'time': '0'
                                    }
                                    return step_dict
                        except:
                            pass
        
    except Exception as e:
        print(f"解析步数数据时出错: {e}")
        import traceback
        traceback.print_exc()
    
    print("❌ 未找到有效步数数据")
    return None

def save_step_data(step_dict):
    """保存步数数据"""
    if step_dict is None:
        return
    
    timestamp = datetime.now().isoformat()
    
    # 创建完整的数据点
    data_point = {
        "timestamp": timestamp,
        "unix_time": time.time(),
        "type": "step_counter"
    }
    
    # 添加步数数据
    if isinstance(step_dict, dict):
        data_point.update(step_dict)
        
        # 确保所有字段都有值
        for field in ['step', 'distance', 'calorie', 'time', 'date']:
            if field not in data_point:
                data_point[field] = "0"
        
        # 转换数值
        try:
            steps = int(data_point['step'])
            distance_m = int(data_point['distance']) / 10.0  # 距离单位: m/10
            calorie_kcal = int(data_point['calorie']) / 10.0  # 卡路里单位: KCal/10
            exercise_time = data_point['time']
            
            print(f"🚶 步数: {steps} 步 ({timestamp})")
            print(f"   距离: {distance_m:.1f} 米")
            print(f"   消耗: {calorie_kcal:.1f} 千卡")
            print(f"   运动时间: {exercise_time}")
            if 'date' in data_point and data_point['date'] != "0":
                print(f"   数据时间: {data_point['date']}")
        except:
            print(f"🚶 步数数据: {step_dict}")
    else:
        # 如果是单个值
        data_point['step'] = str(step_dict)
        data_point['distance'] = "0"
        data_point['calorie'] = "0"
        data_point['time'] = "0"
        data_point['date'] = timestamp
        print(f"🚶 步数: {step_dict} 步 ({timestamp})")
    
    step_data.append(data_point)
    
    # 保存到JSON
    with open("step_log.json", "w", encoding="utf-8") as f:
        json.dump(step_data, f, indent=2, ensure_ascii=False)
    
    # 保存到CSV
    with open("step_log.csv", "a", encoding="utf-8") as f:
        if f.tell() == 0:
            f.write("timestamp,step,distance,calorie,time,date,unix_time\n")
        
        step = data_point.get('step', '0')
        distance = data_point.get('distance', '0')
        calorie = data_point.get('calorie', '0')
        exercise_time = data_point.get('time', '0')
        data_date = data_point.get('date', timestamp)
        
        f.write(f"{timestamp},{step},{distance},{calorie},{exercise_time},{data_date},{time.time()}\n")

def notification_handler(sender, data):
    """处理BLE通知"""
    print(f"\n📨 收到通知 from {sender}")
    step_dict = parse_kct_step_data(data)
    if step_dict:
        save_step_data(step_dict)

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
    """探索服务并订阅步数数据"""
    print("\n🔧 探索设备服务...")
    
    try:
        services = client.services
        print(f"发现 {len(services.services)} 个服务")
        
        subscribed = False
        
        for service in services:
            service_uuid = service.uuid.lower()
            print(f"\n服务: {service_uuid}")
            print(f"描述: {service.description}")
            
            # 检查是否是步数相关服务
            is_step_service = (
                "180d" in service_uuid or  # 标准心率服务 (可能复用)
                "180f" in service_uuid or  # 电池服务 (可能包含活动数据)
                "1814" in service_uuid or  # 标准步数服务
                "ffe0" in service_uuid or  # KCT可能使用的服务
                "ffb0" in service_uuid or  # 其他可能服务
                "ae02" in service_uuid or  # 从实际数据中看到的服务
                "180a" in service_uuid     # 设备信息服务
            )
            
            if is_step_service:
                print("🎯 可能是步数服务!")
            
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
                        
                        # 尝试解析步数
                        step_dict = parse_kct_step_data(value)
                        if step_dict:
                            save_step_data(step_dict)
                    except Exception as e:
                        print(f"    ❌ 读取失败: {e}")
        
        return subscribed
        
    except Exception as e:
        print(f"探索服务失败: {e}")
        return False

async def main():
    """主函数"""
    print("=" * 60)
    print("KCT手表步数数据获取工具")
    print("=" * 60)
    
    print(f"\n目标设备:")
    print(f"  MAC地址: {TARGET_MAC}")
    print(f"  设备名称: {TARGET_NAME}")
    
    print("\n数据解析说明:")
    print("✅ 基于KCT SDK文档计步数据上报 (SEND,10)")
    print("✅ 事件类型: 0x00000017 (协议版本 1.10)")
    print("✅ 数据格式: HashMap<String,Object> 计步数据")
    print("✅ 包含字段: date, step, distance, calorie, time")
    print("✅ 距离单位: 米/10, 卡路里单位: 千卡/10")
    
    print("\n重要提示:")
    print("1. 请先运行BLEDebug.exe并连接手表")
    print("2. 确保手表已连接并显示在BLEDebug中")
    print("3. 然后在手表上走动或进行活动")
    print("4. 最后运行此脚本获取步数数据")
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
                print("🎧 正在监听步数数据...")
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
                            if step_data:
                                latest = step_data[-1]
                                steps = latest.get('step', '0')
                                print(f"📊 最新步数: {steps} 步 | 总数据点: {len(step_data)}")
                            else:
                                print("⏳ 等待步数数据...")
                                
                except KeyboardInterrupt:
                    print("\n🛑 停止监听...")
            else:
                print("\n⚠️  未找到可订阅的步数特征")
                print("可能的原因:")
                print("1. 设备不支持步数监测")
                print("2. 需要手动启动步数监测")
                print("3. 设备使用不同的服务UUID")
                
                print("\n建议:")
                print("1. 在手表上走动或进行活动")
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
    
    if step_data:
        print(f"✅ 成功获取 {len(step_data)} 个步数数据点")
        
        # 计算统计信息
        steps_list = []
        distances = []
        calories = []
        
        for data in step_data:
            try:
                step_val = int(data.get('step', '0'))
                steps_list.append(step_val)
                
                distance_val = int(data.get('distance', '0'))
                if distance_val > 0:
                    distances.append(distance_val / 10.0)  # 转换为米
                
                calorie_val = int(data.get('calorie', '0'))
                if calorie_val > 0:
                    calories.append(calorie_val / 10.0)  # 转换为千卡
            except:
                pass
        
        if steps_list:
            print(f"\n📈 步数统计:")
            print(f"   数据点: {len(steps_list)}")
            print(f"   平均步数: {sum(steps_list)/len(steps_list):.0f} 步")
            print(f"   最少步数: {min(steps_list)} 步")
            print(f"   最多步数: {max(steps_list)} 步")
            print(f"   总步数: {sum(steps_list)} 步")
        
        if distances:
            print(f"\n📈 距离统计:")
            print(f"   数据点: {len(distances)}")
            print(f"   平均距离: {sum(distances)/len(distances):.1f} 米")
            print(f"   最短距离: {min(distances):.1f} 米")
            print(f"   最长距离: {max(distances):.1f} 米")
            print(f"   总距离: {sum(distances):.1f} 米 ({sum(distances)/1000:.2f} 公里)")
        
        if calories:
            print(f"\n📈 卡路里统计:")
            print(f"   数据点: {len(calories)}")
            print(f"   平均消耗: {sum(calories)/len(calories):.1f} 千卡")
            print(f"   最少消耗: {min(calories):.1f} 千卡")
            print(f"   最多消耗: {max(calories):.1f} 千卡")
            print(f"   总消耗: {sum(calories):.1f} 千卡")
        
        # 时间范围
        if len(step_data) > 1:
            first_time = step_data[0]["timestamp"]
            last_time = step_data[-1]["timestamp"]
            duration = step_data[-1]["unix_time"] - step_data[0]["unix_time"]
            print(f"\n⏰ 时间范围:")
            print(f"   开始时间: {first_time}")
            print(f"   结束时间: {last_time}")
            print(f"   持续时间: {duration:.1f} 秒 ({duration/60:.1f} 分钟)")
        
        print(f"\n💾 数据已保存到:")
        print(f"   - step_log.json (JSON格式)")
        print(f"   - step_log.csv (CSV格式)")
        
        print(f"\n📊 数据示例:")
        for i, data in enumerate(step_data[:3], 1):
            step = data.get('step', '0')
            distance = data.get('distance', '0')
            calorie = data.get('calorie', '0')
            exercise_time = data.get('time', '0')
            data_date = data.get('date', data['timestamp'])
            
            print(f"   {i}. {data['timestamp']}:")
            print(f"      步数: {step} 步")
            if distance != '0':
                print(f"      距离: {int(distance)/10:.1f} 米")
            if calorie != '0':
                print(f"      消耗: {int(calorie)/10:.1f} 千卡")
            if exercise_time != '0':
                print(f"      运动时间: {exercise_time}")
            if 'date' in data and data['date'] != data['timestamp']:
                print(f"      数据时间: {data['date']}")
        
        if len(step_data) > 3:
            print(f"   ... 还有 {len(step_data) - 3} 个数据点")
    else:
        print("❌ 未获取到步数数据")
        
        print("\n可能的原因和解决方案:")
        print("1. 设备未记录步数变化")
        print("   → 在手表上走动或进行活动")
        print("2. 需要发送命令启动步数监测")
        print("   → 在BLEDebug中发送启动命令")
        print("3. 设备使用自定义数据格式")
        print("   → 在BLEDebug中查看原始数据格式")
        print("4. 步数数据解析算法需要调整")
        print("   → 查看BLEDebug中的原始数据并调整解析算法")
    
    print("\n" + "=" * 60)
    print("使用说明:")
    print("=" * 60)
    print("1. 启动BLEDebug: 运行BLEDebug.exe")
    print("2. 连接设备: 在BLEDebug中连接手表")
    print("3. 进行活动: 在手表上走动或运动")
    print("4. 运行此脚本: python step_counter_tool.py")
    print("5. 查看数据: 查看生成的JSON/CSV文件")
    print("=" * 60)

if __name__ == "__main__":
    # 清空旧数据文件
    try:
        open("step_log.csv", "w").close()
    except:
        pass
    
    # 运行主程序
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 程序已终止")
    except Exception as e:
        print(f"💥 程序错误: {e}")
