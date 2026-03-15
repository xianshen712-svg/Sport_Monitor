<template>
  <div class="admin-users-page">
    <!-- 头部 -->
    <div class="page-header-card">
      <h2>用户管理</h2>
      <p>管理系统内所有用户信息</p>
    </div>

    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-panel">
      <div class="search-row">
        <el-input
          v-model="searchKey"
          placeholder="搜索：手机号/姓名/用户ID/设备MAC"
          style="width: 320px"
          prefix-icon="el-icon-search"
          clearable
        />

        <el-select v-model="filter.type" placeholder="用户类型" style="width:130px">
          <el-option label="全部" value="" />
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="管理员" value="admin" />
        </el-select>

        <el-select v-model="filter.status" placeholder="账号状态" style="width:130px">
          <el-option label="全部" value="" />
          <el-option label="正常" value="active" />
          <el-option label="封禁" value="inactive" />
        </el-select>

        <el-button type="primary" @click="doSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>

        <div class="right-actions">
          <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">新增用户</el-button>
          <el-button type="success" icon="el-icon-download" @click="exportAllUsers">导出Excel</el-button>
          <el-button type="warning" icon="el-icon-message" @click="openPushDialog">批量推送</el-button>
        </div>
      </div>
    </el-card>

    <!-- 批量操作栏 -->
    <div class="batch-bar" v-if="selected.length > 0">
      <span>已选 {{ selected.length }} 项</span>
      <el-button type="success" size="small" @click="batchEnable">批量启用</el-button>
      <el-button type="warning" size="small" @click="batchDisable">批量禁用</el-button>
      <el-button type="danger" size="small" @click="batchDelete">批量删除</el-button>
      <el-button type="primary" size="small" @click="exportSelected">导出所选</el-button>
    </div>

    <!-- 用户列表 -->
    <el-card shadow="never" class="table-panel">
      <el-table
        :data="userList"
        border
        stripe
        height="620"
        v-loading="loading"
        @selection-change="handleSelect"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="头像" width="70" align="center">
          <template #default="{row}">
            <el-avatar :src="row.avatar" size="small" />
          </template>
        </el-table-column>

        <el-table-column prop="userId" label="用户ID" width="110" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="userType" label="类型" width="90" align="center">
          <template #default="{row}">
            <el-tag :type="row.userType === 'student' ? 'primary' : row.userType === 'teacher' ? 'success' : 'warning'">
              {{ row.userType === 'student' ? '学生' : row.userType === 'teacher' ? '教师' : '管理员' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="绑定设备" width="100" align="center">
          <template #default="{row}">
            {{ row.deviceCount }} 台
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" width="180" />

        <el-table-column label="状态" width="100" align="center">
          <template #default="{row}">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="updateStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center">
          <template #default="{row}">
            <el-button type="text" @click="openDetail(row)">详情</el-button>
            <el-button type="text" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" @click="unbindDevice(row)">解绑</el-button>
            <el-button type="text" @click="deleteUser(row)" style="color: #f56c6c;">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- ====================== 弹窗 ====================== -->
    <!-- 用户详情 -->
    <el-dialog title="用户详情" :visible.sync="detailVisible" width="860px">
      <div v-if="currentUser" class="detail-layout">
        <div class="detail-left">
          <el-avatar :src="currentUser.avatar" size="100" />
          <h3>{{ currentUser.name }}</h3>
          <p>{{ currentUser.userId }}</p>
          <el-tag type="success" v-if="currentUser.status === 'active'">正常</el-tag>
          <el-tag type="danger" v-else>封禁</el-tag>
        </div>

        <div class="detail-right">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ currentUser.email }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ currentUser.userType === 'student' ? '学生' : '教师' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentUser.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="绑定设备">{{ currentUser.deviceCount }} 台</el-descriptions-item>
            <el-descriptions-item label="班级/部门">{{ currentUser.classInfo || currentUser.department }}</el-descriptions-item>
          </el-descriptions>

          <div class="device-section">
            <h4>绑定设备</h4>
            <el-table :data="currentUser.devices" size="small" border height="180">
              <el-table-column prop="mac" label="MAC地址" />
              <el-table-column prop="status" label="状态" />
              <el-table-column prop="lastTime" label="最后心跳" />
            </el-table>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 新增用户 -->
    <el-dialog title="新增用户" :visible.sync="addVisible" width="600px">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="addForm.userType" @change="onTypeChange">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name"><el-input v-model="addForm.name" /></el-form-item>
        <el-form-item label="手机号" prop="phone"><el-input v-model="addForm.phone" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="addForm.password" type="password" /></el-form-item>
        <el-form-item label="班级" prop="classInfo" v-if="addForm.userType === 'student'"><el-input v-model="addForm.classInfo" /></el-form-item>
        <el-form-item label="部门" prop="department" v-if="addForm.userType === 'teacher'"><el-input v-model="addForm.department" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="addUser">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 批量推送 -->
    <el-dialog title="批量推送消息" :visible.sync="pushVisible" width="500px">
      <el-form :model="pushForm" label-width="100px">
        <el-form-item label="推送内容">
          <el-input v-model="pushForm.content" type="textarea" rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pushVisible = false">取消</el-button>
        <el-button type="primary" @click="doPush">确认推送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'
export default {
  name: 'AdminUsers',
  data() {
    return {
      loading: false,
      searchKey: '',
      filter: { type: '', status: '' },
      pageSize: 10,
      currentPage: 1,
      selected: [],
      // 详情
      detailVisible: false,
      currentUser: null,
      // 新增
      addVisible: false,
      addForm: { userType: 'student', name: '', phone: '', password: '', classInfo: '', department: '' },
      addRules: {
        name: [{ required: true, message: '请输入姓名' }],
        phone: [{ required: true, message: '请输入手机号' }],
        password: [{ required: true, message: '请输入密码' }],
      },
      // 推送
      pushVisible: false,
      pushForm: { content: '' },
      // 模拟用户
      userList: [
        { userId: 'U001', name: '曹睿焜', phone: '13800138001', userType: 'student', status: 'active', deviceCount: 2, createdAt: '2025-01-01 12:00:00', avatar: 'https://cube.elemecdn.com/0/5/2/c1dd1df902796a5e1f4a862b5jpeg.jpeg', classInfo: '高一1班', devices: [{ mac: '00:1A:2B:3C:4D:01', status: '在线', lastTime: '2025-12-20 15:00' },{ mac: '00:1A:2B:3C:4D:02', status: '离线', lastTime: '2025-12-19 10:00' }]},
        { userId: 'U002', name: '张小明', phone: '13800138002', userType: 'student', status: 'active', deviceCount: 1, createdAt: '2025-01-02 12:00:00', avatar: 'https://cube.elemecdn.com/0/5/2/c1dd1df902796a5e1f4a862b5jpeg.jpeg', classInfo: '高一2班', devices: [{ mac: '00:1A:2B:3C:4D:03', status: '在线', lastTime: '2025-12-20 14:00' }]},
        { userId: 'U003', name: '李老师', phone: '13800138003', userType: 'teacher', status: 'active', deviceCount: 0, createdAt: '2025-01-03 12:00:00', avatar: 'https://cube.elemecdn.com/0/5/2/c1dd1df902796a5e1f4a862b5jpeg.jpeg', department: '体育组', devices: []},
      ],
    }
  },
  computed: {
    total() { return this.userList.length }
  },
  methods: {
    doSearch() {
      this.$message.success('搜索完成')
    },
    resetSearch() {
      this.searchKey = ''
      this.filter = { type: '', status: '' }
    },
    handleSelect(val) {
      this.selected = val
    },
    handleSizeChange(val) { this.pageSize = val },
    handlePageChange(val) { this.currentPage = val },
    openDetail(row) {
      this.currentUser = row
      this.detailVisible = true
    },
    openEdit(row) {
      this.$message.info('编辑功能')
    },
    unbindDevice(row) {
      this.$message.success('已解绑该用户所有设备')
    },
    deleteUser(row) {
      this.$confirm('确定删除？').then(() => {
        this.userList = this.userList.filter(u => u.userId !== row.userId)
        this.$message.success('删除成功')
      })
    },
    updateStatus(row) {
      this.$message.success(`已${row.status === 'active' ? '启用' : '禁用'}`)
    },
    // 新增
    openAddDialog() {
      this.addVisible = true
      this.addForm = { userType: 'student', name: '', phone: '', password: '', classInfo: '', department: '' }
    },
    onTypeChange() {},
    addUser() {
      this.$refs.addFormRef.validate(valid => {
        if (!valid) return
        const newUser = {
          userId: 'U' + Date.now().toString().slice(-4),
          name: this.addForm.name,
          phone: this.addForm.phone,
          userType: this.addForm.userType,
          status: 'active',
          deviceCount: 0,
          createdAt: new Date().toLocaleString(),
          avatar: 'https://cube.elemecdn.com/0/5/2/c1dd1df902796a5e1f4a862b5jpeg.jpeg',
          classInfo: this.addForm.classInfo,
          department: this.addForm.department,
          devices: []
        }
        this.userList.unshift(newUser)
        this.addVisible = false
        this.$message.success('创建成功')
      })
    },
    // 批量
    batchEnable() { this.selected.forEach(u => u.status = 'active'); this.$message.success('批量启用') },
    batchDisable() { this.selected.forEach(u => u.status = 'inactive'); this.$message.success('批量禁用') },
    batchDelete() { this.userList = this.userList.filter(u => !this.selected.some(s => s.userId === u.userId)); this.selected = []; this.$message.success('删除成功') },
    // 推送
    openPushDialog() { this.pushVisible = true },
    doPush() { this.pushVisible = false; this.$message.success('推送成功') },
    // 导出
    exportAllUsers() {
      const data = this.userList.map(u => ({
        用户ID: u.userId, 姓名: u.name, 手机号: u.phone, 类型: u.userType === 'student' ? '学生' : '教师', 状态: u.status === 'active' ? '正常' : '禁用', 绑定设备: u.deviceCount + '台', 注册时间: u.createdAt
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '用户列表')
      XLSX.writeFile(wb, '用户管理列表.xlsx')
      this.$message.success('导出成功')
    },
    exportSelected() {
      const data = this.selected.map(u => ({
        用户ID: u.userId, 姓名: u.name, 手机号: u.phone, 类型: u.userType === 'student' ? '学生' : '教师', 状态: u.status === 'active' ? '正常' : '禁用', 绑定设备: u.deviceCount + '台', 注册时间: u.createdAt
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '所选用户')
      XLSX.writeFile(wb, '所选用户列表.xlsx')
      this.$message.success('导出成功')
    }
  }
}
</script>

<style scoped>
.admin-users-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}
.page-header-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.page-header-card h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #1f2329;
}
.page-header-card p {
  margin: 0;
  color: #909399;
}
.search-panel {
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.right-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}
.batch-bar {
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  gap: 12px;
  align-items: center;
}
.table-panel {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
}
.detail-layout {
  display: flex;
  gap: 24px;
}
.detail-left {
  width: 180px;
  text-align: center;
  padding-top: 20px;
}
.detail-right {
  flex: 1;
}
.device-section {
  margin-top: 16px;
}
.device-section h4 {
  margin-bottom: 8px;
  font-size: 14px;
}
</style>