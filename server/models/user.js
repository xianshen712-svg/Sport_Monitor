// 使用模拟数据替代数据库连接

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    name: '管理员',
    username: 'admin001',
    password: '$2a$10$jXWnQ3Q4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0z',
    role: 'admin',
    class_name: null,
    device_id: 'device_001',
    avatar: null,
    created_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: '学生1',
    username: 'student001',
    password: '$2a$10$jXWnQ3Q4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0z',
    role: 'student',
    class_name: '初一1班',
    device_id: 'device_002',
    avatar: null,
    created_at: new Date('2024-01-02')
  }
];

class User {
  // 获取所有用户
  static async getAllUsers() {
    return mockUsers;
  }

  // 根据ID获取用户
  static async getUserById(id) {
    return mockUsers.find(user => user.id === parseInt(id)) || null;
  }

  // 根据用户名获取用户
  static async getUserByUsername(username) {
    return mockUsers.find(user => user.username === username) || null;
  }

  // 根据手环ID获取用户
  static async getUserByDeviceId(deviceId) {
    return mockUsers.find(user => user.device_id === deviceId) || null;
  }

  // 创建用户
  static async createUser(userData) {
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      avatar: userData.avatar || null,
      created_at: new Date()
    };
    mockUsers.push(newUser);
    return newUser;
  }

  // 更新用户
  static async updateUser(id, userData) {
    const index = mockUsers.findIndex(user => user.id === parseInt(id));
    if (index === -1) return false;
    mockUsers[index] = { ...mockUsers[index], ...userData };
    return true;
  }

  // 删除用户
  static async deleteUser(id) {
    const index = mockUsers.findIndex(user => user.id === parseInt(id));
    if (index === -1) return false;
    mockUsers.splice(index, 1);
    return true;
  }

  // 根据班级获取用户
  static async getUsersByClass(className) {
    return mockUsers.filter(user => user.class_name === className && user.role === 'student');
  }
}

module.exports = User;