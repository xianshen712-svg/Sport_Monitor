-- 校园运动监测系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS sport_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sport_monitor;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE,
    device_id VARCHAR(50) UNIQUE,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建设备数据表
CREATE TABLE IF NOT EXISTS device_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(20),
    heart_rate INT,
    steps INT,
    blood_oxygen DECIMAL(4,1),
    body_temperature DECIMAL(3,1),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    blood_sugar DECIMAL(4,1),
    fatigue_level INT,
    exercise_load INT,
    aerobic_stress INT,
    anaerobic_stress INT,
    recovery_level INT,
    record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(student_id) ON DELETE SET NULL
);

-- 创建健康异常表
CREATE TABLE IF NOT EXISTS health_abnormalities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    device_id VARCHAR(50) NOT NULL,
    abnormalities JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建初始管理员账号
INSERT INTO users (username, password, name, gender, class_name, student_id, device_id, role)
VALUES ('admin001', '$2b$10$JQJ7kQ1u2X4u3Y5v6Z7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5m6n7o8p9q0r1s2t', '管理员', 'male', 'admin', NULL, NULL, 'admin')
ON DUPLICATE KEY UPDATE username='admin001';

-- 创建初始教师账号
INSERT INTO users (username, password, name, gender, class_name, student_id, device_id, role)
VALUES ('Teacher101', '$2b$10$JQJ7kQ1u2X4u3Y5v6Z7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5m6n7o8p9q0r1s2t', '李教师', 'female', '高一1班', NULL, NULL, 'teacher')
ON DUPLICATE KEY UPDATE username='Teacher101';

-- 创建初始学生账号
INSERT INTO users (username, password, name, gender, class_name, student_id, device_id, role)
VALUES ('2023423320102', '$2b$10$JQJ7kQ1u2X4u3Y5v6Z7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5m6n7o8p9q0r1s2t', '曹睿焜', 'male', '高一1班', '2023423320102', 'device001', 'student')
ON DUPLICATE KEY UPDATE username='2023423320102';

-- 为测试添加更多学生账号
INSERT INTO users (username, password, name, gender, class_name, student_id, device_id, role)
VALUES 
('user001', '$2b$10$JQJ7kQ1u2X4u3Y5v6Z7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5m6n7o8p9q0r1s2t', '测试用户1', 'male', '高一1班', '20230001', 'android-001', 'student'),
('user002', '$2b$10$JQJ7kQ1u2X4u3Y5v6Z7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5m6n7o8p9q0r1s2t', '测试用户2', 'female', '高一1班', '20230002', 'android-002', 'student'),
('user003', '$2b$10$JQJ7kQ1u2X4u3Y5v6Z7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5m6n7o8p9q0r1s2t', '测试用户3', 'male', '高一1班', '20230003', 'android-003', 'student')
ON DUPLICATE KEY UPDATE username=VALUES(username);
