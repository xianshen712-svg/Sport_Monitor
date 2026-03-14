<template>
  <div class="data-management-page">
    <div class="page-header">
      <el-button type="text" @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回
      </el-button>
      <h2 class="page-title">运动数据管理详情</h2>
      <div class="page-actions">
        <el-button type="primary" size="small">导入数据</el-button>
        <el-button type="primary" size="small">导出数据</el-button>
      </div>
    </div>

    <div class="page-content">
      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="学号">
            <el-input v-model="studentId" placeholder="请输入学号" size="small"></el-input>
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="studentName" placeholder="请输入姓名" size="small"></el-input>
          </el-form-item>
          <el-form-item label="运动类型">
            <el-select v-model="exerciseType" placeholder="请选择运动类型" size="small">
              <el-option label="跑步" value="running"></el-option>
              <el-option label="篮球" value="basketball"></el-option>
              <el-option label="足球" value="football"></el-option>
              <el-option label="跳绳" value="ropeSkipping"></el-option>
              <el-option label="其他" value="other"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small">查询</el-button>
            <el-button size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <div class="table-section">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">运动数据列表</span>
            <div class="card-actions">
              <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
            </div>
          </div>
          <div class="card-content">
            <el-table
              :data="tableData"
              stripe
              style="width: 100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55"></el-table-column>
              <el-table-column prop="id" label="ID" width="80"></el-table-column>
              <el-table-column prop="studentId" label="学号" width="120"></el-table-column>
              <el-table-column prop="studentName" label="姓名" width="100"></el-table-column>
              <el-table-column prop="exerciseType" label="运动类型" width="100">
                <template slot-scope="scope">
                  <el-tag size="small">{{ scope.row.exerciseTypeText }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="运动时长(分钟)"></el-table-column>
              <el-table-column prop="distance" label="运动距离(km)"></el-table-column>
              <el-table-column prop="calories" label="卡路里消耗"></el-table-column>
              <el-table-column prop="averageHeartRate" label="平均心率"></el-table-column>
              <el-table-column prop="maxHeartRate" label="最大心率"></el-table-column>
              <el-table-column prop="exerciseDate" label="运动日期" width="120"></el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.status === '正常' ? 'success' : 'danger'" size="small">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="handleView(scope.row)">查看</el-button>
                  <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="currentPage"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total"
              ></el-pagination>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看数据对话框 -->
    <el-dialog title="查看运动数据" :visible.sync="viewDialogVisible" width="50%">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="学号">
          {{ formData.studentId }}
        </el-form-item>
        <el-form-item label="姓名">
          {{ formData.studentName }}
        </el-form-item>
        <el-form-item label="运动类型">
          <el-tag>{{ formData.exerciseTypeText }}</el-tag>
        </el-form-item>
        <el-form-item label="运动时长">
          {{ formData.duration }} 分钟
        </el-form-item>
        <el-form-item label="运动距离">
          {{ formData.distance }} km
        </el-form-item>
        <el-form-item label="卡路里消耗">
          {{ formData.calories }} kcal
        </el-form-item>
        <el-form-item label="平均心率">
          {{ formData.averageHeartRate }} bpm
        </el-form-item>
        <el-form-item label="最大心率">
          {{ formData.maxHeartRate }} bpm
        </el-form-item>
        <el-form-item label="运动日期">
          {{ formData.exerciseDate }}
        </el-form-item>
        <el-form-item label="状态">
          <el-tag :type="formData.status === '正常' ? 'success' : 'danger'">{{ formData.status }}</el-tag>
        </el-form-item>
        <el-form-item label="备注">
          {{ formData.remark || '无' }}
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 编辑数据对话框 -->
    <el-dialog title="编辑运动数据" :visible.sync="editDialogVisible" width="50%">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="学号">
          <el-input v-model="formData.studentId" disabled></el-input>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="formData.studentName" disabled></el-input>
        </el-form-item>
        <el-form-item label="运动类型">
          <el-select v-model="formData.exerciseType" placeholder="请选择运动类型">
            <el-option label="跑步" value="running"></el-option>
            <el-option label="篮球" value="basketball"></el-option>
            <el-option label="足球" value="football"></el-option>
            <el-option label="跳绳" value="ropeSkipping"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="运动时长">
          <el-input-number v-model="formData.duration" :min="1" :max="300" :step="1"></el-input-number> 分钟
        </el-form-item>
        <el-form-item label="运动距离">
          <el-input-number v-model="formData.distance" :min="0.1" :max="100" :step="0.1" :precision="1"></el-input-number> km
        </el-form-item>
        <el-form-item label="卡路里消耗">
          <el-input-number v-model="formData.calories" :min="1" :max="5000" :step="1"></el-input-number> kcal
        </el-form-item>
        <el-form-item label="平均心率">
          <el-input-number v-model="formData.averageHeartRate" :min="60" :max="220" :step="1"></el-input-number> bpm
        </el-form-item>
        <el-form-item label="最大心率">
          <el-input-number v-model="formData.maxHeartRate" :min="60" :max="220" :step="1"></el-input-number> bpm
        </el-form-item>
        <el-form-item label="运动日期">
          <el-date-picker v-model="formData.exerciseDate" type="datetime" placeholder="选择运动日期"></el-date-picker>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="正常" value="正常"></el-option>
            <el-option label="异常" value="异常"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="formData.remark" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DataManagement',
  data() {
    return {
      studentId: '',
      studentName: '',
      exerciseType: '',
      dateRange: [],
      tableData: [
        {
          id: 1,
          studentId: '2023423320101',
          studentName: '张三',
          exerciseType: 'running',
          exerciseTypeText: '跑步',
          duration: 45,
          distance: 5.2,
          calories: 350,
          averageHeartRate: 135,
          maxHeartRate: 165,
          exerciseDate: '2023-06-10 15:30:00',
          status: '正常',
          remark: '无'
        },
        {
          id: 2,
          studentId: '2023423320102',
          studentName: '李四',
          exerciseType: 'basketball',
          exerciseTypeText: '篮球',
          duration: 60,
          distance: 3.8,
          calories: 480,
          averageHeartRate: 142,
          maxHeartRate: 175,
          exerciseDate: '2023-06-10 16:00:00',
          status: '正常',
          remark: '无'
        },
        {
          id: 3,
          studentId: '2023423320103',
          studentName: '王五',
          exerciseType: 'running',
          exerciseTypeText: '跑步',
          duration: 30,
          distance: 3.0,
          calories: 220,
          averageHeartRate: 128,
          maxHeartRate: 155,
          exerciseDate: '2023-06-09 15:00:00',
          status: '正常',
          remark: '无'
        },
        {
          id: 4,
          studentId: '2023423320104',
          studentName: '赵六',
          exerciseType: 'football',
          exerciseTypeText: '足球',
          duration: 70,
          distance: 6.5,
          calories: 520,
          averageHeartRate: 145,
          maxHeartRate: 180,
          exerciseDate: '2023-06-09 16:30:00',
          status: '正常',
          remark: '无'
        },
        {
          id: 5,
          studentId: '2023423320105',
          studentName: '孙七',
          exerciseType: 'ropeSkipping',
          exerciseTypeText: '跳绳',
          duration: 20,
          distance: 0.5,
          calories: 150,
          averageHeartRate: 120,
          maxHeartRate: 145,
          exerciseDate: '2023-06-08 15:30:00',
          status: '正常',
          remark: '无'
        }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 50,
      multipleSelection: [],
      viewDialogVisible: false,
      editDialogVisible: false,
      formData: {
        id: '',
        studentId: '',
        studentName: '',
        exerciseType: '',
        exerciseTypeText: '',
        duration: 0,
        distance: 0,
        calories: 0,
        averageHeartRate: 0,
        maxHeartRate: 0,
        exerciseDate: '',
        status: '正常',
        remark: ''
      }
    }
  },
  methods: {
    handleSizeChange(val) {
      this.pageSize = val
    },
    handleCurrentChange(val) {
      this.currentPage = val
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    },
    handleView(row) {
      this.formData = { ...row }
      this.viewDialogVisible = true
    },
    handleEdit(row) {
      this.formData = { ...row }
      this.editDialogVisible = true
    },
    handleSave() {
      // 保存编辑后的数据
      this.$message.success('数据保存成功')
      this.editDialogVisible = false
      // 实际应用中需要调用API更新数据
    },
    handleDelete(row) {
      this.$confirm('确定要删除这条数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 删除数据
        this.$message.success('删除成功')
        // 实际应用中需要调用API删除数据
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    handleBatchDelete() {
      if (this.multipleSelection.length === 0) {
        this.$message.warning('请选择要删除的数据')
        return
      }
      this.$confirm('确定要批量删除选中的数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 批量删除数据
        this.$message.success('批量删除成功')
        this.multipleSelection = []
        // 实际应用中需要调用API批量删除数据
      }).catch(() => {
        this.$message.info('已取消批量删除')
      })
    }
  }
}
</script>

<style scoped>
.data-management-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 10px 0;
}

.back-btn {
  font-size: 14px;
  color: #606266;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  background-color: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.filter-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.table-section {
  margin-bottom: 24px;
}

.chart-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-card .card-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-card .card-content {
  padding: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-footer {
  text-align: right;
}
</style>