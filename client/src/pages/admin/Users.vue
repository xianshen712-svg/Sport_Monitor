<template>
  <div class="admin-users">
    <el-card shadow="hover" class="page-header">
      <h2>用户管理</h2>
      <p>管理系统内所有用户信息</p>
    </el-card>
    
    <!-- 搜索和筛选 -->
    <el-card shadow="hover" class="search-card">
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户（用户名、姓名、学号/工号）"
          style="width: 300px; margin-right: 10px;"
          prefix-icon="el-icon-search"
        ></el-input>
        
        <el-select
          v-model="userTypeFilter"
          placeholder="用户类型"
          style="width: 120px; margin-right: 10px;"
        >
          <el-option label="全部" value=""></el-option>
          <el-option label="学生" value="student"></el-option>
          <el-option label="教师" value="teacher"></el-option>
          <el-option label="管理员" value="admin"></el-option>
        </el-select>
        
        <el-select
          v-model="statusFilter"
          placeholder="状态"
          style="width: 120px; margin-right: 10px;"
        >
          <el-option label="全部" value=""></el-option>
          <el-option label="启用" value="active"></el-option>
          <el-option label="禁用" value="inactive"></el-option>
        </el-select>
        
        <el-button type="primary" @click="searchUsers">
          <i class="el-icon-search"></i> 搜索
        </el-button>
        
        <el-button @click="resetFilters">
          <i class="el-icon-refresh"></i> 重置
        </el-button>
        
        <div class="search-actions">
          <el-button type="primary" @click="showAddUserDialog">
            <i class="el-icon-plus"></i> 新增用户
          </el-button>
          <el-button @click="importUsers">
            <i class="el-icon-upload2"></i> 导入用户
          </el-button>
          <el-button @click="exportUsers">
            <i class="el-icon-download"></i> 导出用户
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 用户列表 -->
    <el-card shadow="hover" class="table-card">
      <el-table
        :data="filteredUsers"
        border
        stripe
        style="width: 100%"
        height="600"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column prop="userId" label="用户ID" width="120" align="center"></el-table-column>
        <el-table-column prop="username" label="用户名" width="150" align="center"></el-table-column>
        <el-table-column prop="name" label="姓名" width="120" align="center"></el-table-column>
        <el-table-column prop="userType" label="用户类型" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="getUserTypeColor(scope.row.userType)">
              {{ getUserTypeText(scope.row.userType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template v-slot="scope">
            <el-tag type="info">{{ scope.row.gender }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="classInfo" label="班级/部门" width="150" align="center"></el-table-column>
        <el-table-column prop="phone" label="手机号码" width="150" align="center"></el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template v-slot="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
            <span style="margin-left: 10px;">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'warning'">
                {{ scope.row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center"></el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template v-slot="scope">
            <el-button type="primary" size="small" @click="viewUserDetail(scope.row.userId)">
              <i class="el-icon-view"></i> 查看
            </el-button>
            <el-button type="info" size="small" @click="editUser(scope.row.userId)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteUser(scope.row.userId)">
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredUsers.length"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 批量操作 -->
    <div class="batch-operations" v-if="selectedUsers.length > 0">
      <el-button type="primary" @click="batchExport">批量导出</el-button>
      <el-button type="warning" @click="batchActivate">批量启用</el-button>
      <el-button type="danger" @click="batchDeactivate">批量禁用</el-button>
      <el-button type="danger" @click="batchDelete">批量删除</el-button>
    </div>
    
    <!-- 新增用户对话框 -->
    <el-dialog
      title="新增用户"
      :visible.sync="addUserDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="newUserForm" :rules="newUserRules" ref="newUserForm" label-width="100px">
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="newUserForm.userType" placeholder="请选择用户类型" @change="handleUserTypeChange">
            <el-option label="学生" value="student"></el-option>
            <el-option label="教师" value="teacher"></el-option>
            <el-option label="管理员" value="admin"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="newUserForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="newUserForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="newUserForm.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="newUserForm.gender">
            <el-radio label="男"></el-radio>
            <el-radio label="女"></el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="newUserForm.phone" placeholder="请输入手机号码"></el-input>
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="newUserForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        
        <!-- 学生特有字段 -->
        <el-form-item v-if="newUserForm.userType === 'student'" label="学号" prop="studentId">
          <el-input v-model="newUserForm.studentId" placeholder="请输入学号"></el-input>
        </el-form-item>
        
        <el-form-item v-if="newUserForm.userType === 'student'" label="班级" prop="classInfo">
          <el-input v-model="newUserForm.classInfo" placeholder="请输入班级"></el-input>
        </el-form-item>
        
        <el-form-item v-if="newUserForm.userType === 'student'" label="年级" prop="grade">
          <el-input v-model="newUserForm.grade" placeholder="请输入年级"></el-input>
        </el-form-item>
        
        <!-- 教师特有字段 -->
        <el-form-item v-if="newUserForm.userType === 'teacher'" label="工号" prop="teacherId">
          <el-input v-model="newUserForm.teacherId" placeholder="请输入工号"></el-input>
        </el-form-item>
        
        <el-form-item v-if="newUserForm.userType === 'teacher'" label="部门" prop="department">
          <el-input v-model="newUserForm.department" placeholder="请输入部门"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="addUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitNewUser">创建用户</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'AdminUsers',
  data() {
    return {
      // 用户数据
      users: [
        {
          userId: 'User001',
          username: 'student001',
          name: '曹睿焜',
          userType: 'student',
          gender: '男',
          studentId: '2023423320102',
          classInfo: '高一1班',
          grade: '高一',
          phone: '13800138001',
          email: 'student001@example.com',
          status: 'active',
          createdAt: '2023-09-01 08:00:00'
        },
        {
          userId: 'User002',
          username: 'student002',
          name: '张小明',
          userType: 'student',
          gender: '男',
          studentId: '2023423320103',
          classInfo: '高一1班',
          grade: '高一',
          phone: '13800138002',
          email: 'student002@example.com',
          status: 'active',
          createdAt: '2023-09-01 08:00:00'
        },
        {
          userId: 'User003',
          username: 'teacher001',
          name: '李老师',
          userType: 'teacher',
          gender: '女',
          teacherId: 'Teacher101',
          department: '体育组',
          classInfo: '高一1班',
          phone: '13800138003',
          email: 'teacher001@example.com',
          status: 'active',
          createdAt: '2023-09-01 08:00:00'
        },
        {
          userId: 'User004',
          username: 'admin001',
          name: '管理员',
          userType: 'admin',
          gender: '男',
          adminId: 'Admin001',
          phone: '13800138004',
          email: 'admin001@example.com',
          status: 'active',
          createdAt: '2023-09-01 08:00:00'
        }
      ],
      // 搜索和筛选
      searchQuery: '',
      userTypeFilter: '',
      statusFilter: '',
      // 分页
      pageSize: 10,
      currentPage: 1,
      // 选择的用户
      selectedUsers: [],
      // 对话框
      addUserDialogVisible: false,
      // 表单数据
      newUserForm: {
        userType: 'student',
        username: '',
        password: '',
        name: '',
        gender: '男',
        phone: '',
        email: '',
        studentId: '',
        classInfo: '',
        grade: '',
        teacherId: '',
        department: '',
        status: 'active'
      },
      newUserRules: {
        userType: [
          { required: true, message: '请选择用户类型', trigger: 'change' }
        ],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 5, max: 20, message: '用户名长度在 5 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        gender: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        studentId: [
          { required: true, message: '请输入学号', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.newUserForm.userType === 'student' && !value) {
              callback(new Error('请输入学号'));
            } else {
              callback();
            }
          }}
        ],
        classInfo: [
          { required: true, message: '请输入班级', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.newUserForm.userType === 'student' && !value) {
              callback(new Error('请输入班级'));
            } else {
              callback();
            }
          }}
        ],
        grade: [
          { required: true, message: '请输入年级', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.newUserForm.userType === 'student' && !value) {
              callback(new Error('请输入年级'));
            } else {
              callback();
            }
          }}
        ],
        teacherId: [
          { required: true, message: '请输入工号', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.newUserForm.userType === 'teacher' && !value) {
              callback(new Error('请输入工号'));
            } else {
              callback();
            }
          }}
        ],
        department: [
          { required: true, message: '请输入部门', trigger: 'blur', validator: (rule, value, callback) => {
            if (this.newUserForm.userType === 'teacher' && !value) {
              callback(new Error('请输入部门'));
            } else {
              callback();
            }
          }}
        ]
      }
    };
  },
  computed: {
    filteredUsers() {
      let result = [...this.users];
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.name.toLowerCase().includes(query) ||
          (user.studentId && user.studentId.toLowerCase().includes(query)) ||
          (user.teacherId && user.teacherId.toLowerCase().includes(query)) ||
          (user.adminId && user.adminId.toLowerCase().includes(query))
        );
      }
      
      // 用户类型过滤
      if (this.userTypeFilter) {
        result = result.filter(user => user.userType === this.userTypeFilter);
      }
      
      // 状态过滤
      if (this.statusFilter) {
        result = result.filter(user => user.status === this.statusFilter);
      }
      
      return result;
    }
  },
  methods: {
    // 获取用户类型颜色
    getUserTypeColor(type) {
      switch (type) {
        case 'student': return 'primary';
        case 'teacher': return 'success';
        case 'admin': return 'warning';
        default: return 'default';
      }
    },
    
    // 获取用户类型文本
    getUserTypeText(type) {
      switch (type) {
        case 'student': return '学生';
        case 'teacher': return '教师';
        case 'admin': return '管理员';
        default: return '未知';
      }
    },
    
    // 搜索用户
    searchUsers() {
      this.$message.info('搜索功能开发中');
    },
    
    // 重置筛选条件
    resetFilters() {
      this.searchQuery = '';
      this.userTypeFilter = '';
      this.statusFilter = '';
      this.$message.success('筛选条件已重置');
    },
    
    // 分页相关
    handleSizeChange(val) {
      this.pageSize = val;
    },
    
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    
    // 选择用户
    handleSelectionChange(selection) {
      this.selectedUsers = selection;
    },
    
    // 状态变更
    handleStatusChange(user) {
      this.$message.success(`用户 ${user.name} 状态已更新为 ${user.status === 'active' ? '启用' : '禁用'}`);
    },
    
    // 用户类型变更
    handleUserTypeChange() {
      // 重置特定于用户类型的字段
      this.newUserForm.studentId = '';
      this.newUserForm.classInfo = '';
      this.newUserForm.grade = '';
      this.newUserForm.teacherId = '';
      this.newUserForm.department = '';
    },
    
    // 用户管理操作
    showAddUserDialog() {
      this.newUserForm = {
        userType: 'student',
        username: '',
        password: '',
        name: '',
        gender: '男',
        phone: '',
        email: '',
        studentId: '',
        classInfo: '',
        grade: '',
        teacherId: '',
        department: '',
        status: 'active'
      };
      this.addUserDialogVisible = true;
    },
    
    submitNewUser() {
      this.$refs.newUserForm.validate((valid) => {
        if (valid) {
          // 创建新用户
          const newUser = {
            userId: `User${String(this.users.length + 1).padStart(3, '0')}`,
            ...this.newUserForm
          };
          
          this.users.push(newUser);
          this.addUserDialogVisible = false;
          this.$message.success('用户创建成功');
        }
      });
    },
    
    viewUserDetail(userId) {
      this.$message.info('查看用户详情功能开发中');
    },
    
    editUser(userId) {
      this.$message.info('编辑用户功能开发中');
    },
    
    deleteUser(userId) {
      this.$confirm(`确定要删除该用户吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.users.findIndex(user => user.userId === userId);
        if (index !== -1) {
          this.users.splice(index, 1);
          this.$message.success('用户删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 批量操作
    batchExport() {
      this.$message.info('批量导出功能开发中');
    },
    
    batchActivate() {
      if (this.selectedUsers.length === 0) {
        this.$message.warning('请选择要操作的用户');
        return;
      }
      
      this.$confirm(`确定要启用选中的 ${this.selectedUsers.length} 个用户吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.selectedUsers.forEach(user => {
          user.status = 'active';
        });
        this.$message.success('用户批量启用成功');
        this.selectedUsers = [];
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },
    
    batchDeactivate() {
      if (this.selectedUsers.length === 0) {
        this.$message.warning('请选择要操作的用户');
        return;
      }
      
      this.$confirm(`确定要禁用选中的 ${this.selectedUsers.length} 个用户吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.selectedUsers.forEach(user => {
          user.status = 'inactive';
        });
        this.$message.success('用户批量禁用成功');
        this.selectedUsers = [];
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },
    
    batchDelete() {
      if (this.selectedUsers.length === 0) {
        this.$message.warning('请选择要操作的用户');
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedUsers.length} 个用户吗？此操作不可恢复！`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        this.selectedUsers.forEach(user => {
          const index = this.users.findIndex(u => u.userId === user.userId);
          if (index !== -1) {
            this.users.splice(index, 1);
          }
        });
        this.$message.success('用户批量删除成功');
        this.selectedUsers = [];
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },
    
    // 导入导出
    importUsers() {
      this.$message.info('导入用户功能开发中');
    },
    
    exportUsers() {
      this.$message.info('导出用户功能开发中');
    }
  }
};
</script>

<style scoped>
.admin-users {
  padding: 20px;
  background-color: #f5f7fa;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.search-card {
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.search-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.batch-operations {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  text-align: center;
}
</style>