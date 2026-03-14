<template>
  <div class="teacher-student-management">
    <el-card shadow="hover" class="page-header">
      <div class="card-header">
        <el-button type="text" class="back-btn" @click="$router.back()">
          <i class="el-icon-arrow-left"></i> 返回
        </el-button>
        <div>
          <h2>学生管理</h2>
          <p>班级：{{ userInfo.className }}</p>
        </div>
      </div>
    </el-card>
    
    <!-- 操作工具栏 -->
    <el-card shadow="hover" class="toolbar-card">
      <div class="toolbar-content">
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="请输入学号/姓名"
            clearable
            style="width: 200px; margin-right: 10px;"
          >
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
          
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 120px; margin-right: 10px;"
          >
            <el-option label="全部" value=""></el-option>
            <el-option label="正常" value="normal"></el-option>
            <el-option label="警告" value="warning"></el-option>
            <el-option label="异常" value="danger"></el-option>
          </el-select>
          
          <el-button type="primary" @click="searchStudents">
            <i class="el-icon-search"></i> 搜索
          </el-button>
          <el-button @click="resetFilters">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
        </div>
        
        <div class="batch-operations">
          <el-button type="primary" @click="openImportDialog">
            <i class="el-icon-upload2"></i> 批量导入
          </el-button>
          <el-button @click="exportStudents">
            <i class="el-icon-download"></i> 导出
          </el-button>
          <el-button type="warning" @click="batchResetPassword">
            <i class="el-icon-lock"></i> 批量重置密码
          </el-button>
          <el-button type="danger" @click="batchDeleteStudents" :disabled="selectedStudents.length === 0">
            <i class="el-icon-delete"></i> 批量删除
          </el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 学生列表 -->
    <el-card shadow="hover" class="students-card">
      <div class="card-header">
        <h3>学生列表</h3>
        <el-badge :value="filteredStudents.length" type="primary" class="students-badge"></el-badge>
      </div>
      
      <el-table
        :data="filteredStudents"
        border
        stripe
        style="width: 100%"
        height="600"
        class="student-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column prop="studentId" label="学号" width="150" align="center"></el-table-column>
        <el-table-column prop="name" label="姓名" width="100" align="center"></el-table-column>
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template v-slot="scope">
            <span>{{ scope.row.gender === 'male' ? '男' : '女' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center"></el-table-column>
        <el-table-column prop="braceletId" label="手环ID" width="120" align="center">
          <template v-slot="scope">
            <span :class="scope.row.braceletId ? '' : 'text-muted'">
              {{ scope.row.braceletId || '未绑定' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template v-slot="scope">
            <el-tag :type="scope.row.status === 'normal' ? 'success' : (scope.row.status === 'warning' ? 'warning' : 'danger')">
              {{ scope.row.status === 'normal' ? '正常' : (scope.row.status === 'warning' ? '警告' : '异常') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录" width="160" align="center">
          <template v-slot="scope">
            <span class="text-muted">{{ scope.row.lastLogin || '未登录' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template v-slot="scope">
            <el-button type="primary" size="small" @click="viewStudentDetail(scope.row.studentId)">
              <i class="el-icon-view"></i> 查看
            </el-button>
            <el-button type="info" size="small" @click="editStudent(scope.row.studentId)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button type="warning" size="small" @click="bindBracelet(scope.row.studentId)">
              <i class="el-icon-link"></i> {{ scope.row.braceletId ? '重新绑定' : '绑定手环' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteStudent(scope.row.studentId)">
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredStudents.length"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 批量导入对话框 -->
    <el-dialog
      title="批量导入学生"
      v-model="importDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-upload
        class="upload-excel"
        :auto-upload="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        accept=".xlsx, .xls"
        :show-file-list="true"
      >
        <el-button type="primary">选择Excel文件</el-button>
        <div class="el-upload__tip" slot="tip">
          请选择符合模板格式的Excel文件，仅支持.xlsx和.xls格式<br>
          <strong>模板格式：</strong>学号, 姓名, 性别(男/女), 年龄, 手环ID
        </div>
      </el-upload>
      
      <div class="import-template">
        <el-button type="text" @click="downloadTemplate">
          <i class="el-icon-download"></i> 下载导入模板
        </el-button>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确定导入</el-button>
      </div>
    </el-dialog>
    
    <!-- 导入确认对话框 -->
    <el-dialog
      title="确认导入"
      v-model="importConfirmDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <div>
        <p>即将导入 <strong>{{ importData.length }}</strong> 名学生数据</p>
        <el-checkbox v-model="importOverwrite" style="margin-top: 10px;">
          覆盖已存在的学生数据
        </el-checkbox>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="importConfirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitImport">确认导入</el-button>
      </div>
    </el-dialog>
    
    <!-- 编辑学生对话框 -->
    <el-dialog
      :title="isEditMode ? '编辑学生' : '添加学生'"
      v-model="editDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="editRules" ref="editForm" label-width="80px">
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="editForm.studentId" :disabled="isEditMode" placeholder="请输入学号"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender" placeholder="请选择性别">
            <el-option label="男" value="male"></el-option>
            <el-option label="女" value="female"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="editForm.age" :min="13" :max="18" placeholder="请输入年龄"></el-input-number>
        </el-form-item>
        <el-form-item label="手环ID" prop="braceletId">
          <el-input v-model="editForm.braceletId" placeholder="请输入手环ID"></el-input>
        </el-form-item>
        <el-form-item label="初始密码" prop="password" v-if="!isEditMode">
          <el-input v-model="editForm.password" type="password" placeholder="请输入初始密码"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">保存</el-button>
      </div>
    </el-dialog>
    
    <!-- 绑定手环对话框 -->
    <el-dialog
      title="绑定手环"
      :visible.sync="bindDialogVisible"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="bindForm" :rules="bindRules" ref="bindForm" label-width="80px">
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="bindForm.studentId" disabled></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="bindForm.name" disabled></el-input>
        </el-form-item>
        <el-form-item label="手环ID" prop="braceletId">
          <el-input v-model="bindForm.braceletId" placeholder="请输入手环ID"></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBindForm">绑定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 动态导入xlsx库
let XLSX = null;

export default {
  name: 'TeacherStudentManagement',
  data() {
    return {
      userInfo: {
        name: '李老师',
        className: '高一1班',
        teacherId: 'Teacher101'
      },
      xlsxLoaded: false,
      xlsxLoading: false,
      students: [
        { studentId: '2023423320102', name: '曹睿焜', gender: 'male', age: 16, braceletId: 'B001', status: 'normal', lastLogin: '2023-11-15 08:30:00' },
        { studentId: '2023423320103', name: '张小明', gender: 'male', age: 15, braceletId: 'B002', status: 'normal', lastLogin: '2023-11-15 08:25:00' },
        { studentId: '2023423320104', name: '王小红', gender: 'female', age: 16, braceletId: 'B003', status: 'warning', lastLogin: '2023-11-15 08:35:00' },
        { studentId: '2023423320105', name: '赵小刚', gender: 'male', age: 15, braceletId: 'B004', status: 'normal', lastLogin: '2023-11-14 16:45:00' },
        { studentId: '2023423320106', name: '李小丽', gender: 'female', age: 16, braceletId: 'B005', status: 'danger', lastLogin: '2023-11-15 08:40:00' },
        { studentId: '2023423320107', name: '陈小强', gender: 'male', age: 16, braceletId: 'B006', status: 'normal', lastLogin: '2023-11-15 08:28:00' },
        { studentId: '2023423320108', name: '林小花', gender: 'female', age: 15, braceletId: '', status: 'normal', lastLogin: '2023-11-13 14:30:00' },
        { studentId: '2023423320109', name: '吴小明', gender: 'male', age: 16, braceletId: 'B007', status: 'danger', lastLogin: '2023-11-15 08:32:00' },
        { studentId: '2023423320110', name: '郑小红', gender: 'female', age: 15, braceletId: 'B008', status: 'normal', lastLogin: '2023-11-15 08:22:00' },
        { studentId: '2023423320111', name: '周小强', gender: 'male', age: 16, braceletId: 'B009', status: 'normal', lastLogin: '2023-11-14 17:20:00' }
      ],
      searchQuery: '',
      statusFilter: '',
      currentPage: 1,
      pageSize: 10,
      selectedStudents: [],
      importDialogVisible: false,
      editDialogVisible: false,
      isEditMode: false,
      editForm: {
        studentId: '',
        name: '',
        gender: 'male',
        age: 16,
        braceletId: '',
        password: ''
      },
      editRules: {
        studentId: [
          { required: true, message: '请输入学号', trigger: 'blur' },
          { pattern: /^\d+$/, message: '学号只能是数字', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        gender: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        age: [
          { required: true, message: '请输入年龄', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
        ]
      },
      bindDialogVisible: false,
      bindForm: {
        studentId: '',
        name: '',
        braceletId: ''
      },
      bindRules: {
        braceletId: [
          { required: true, message: '请输入手环ID', trigger: 'blur' }
        ]
      },
      importData: null,
      // 导入文件对象
      importFile: null,
      // 导入覆盖选项
      importOverwrite: false,
      // 导入确认对话框
      importConfirmDialogVisible: false
    };
  },
  created() {
    this.loadXlsxLibrary();
  },
  computed: {
    filteredStudents() {
      let result = [...this.students];
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(student => 
          student.studentId.includes(query) || 
          student.name.toLowerCase().includes(query)
        );
      }
      
      // 状态过滤
      if (this.statusFilter) {
        result = result.filter(student => student.status === this.statusFilter);
      }
      
      return result;
    },
    paginatedStudents() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredStudents.slice(start, end);
    }
  },
  methods: {
    // 加载XLSX库
    loadXlsxLibrary() {
      if (typeof window === 'undefined' || XLSX) {
        this.xlsxLoaded = true;
        return;
      }
      
      this.xlsxLoading = true;
      
      // 使用CDN引入xlsx库
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => {
        XLSX = window.XLSX;
        this.xlsxLoaded = true;
        this.xlsxLoading = false;
      };
      script.onerror = () => {
        this.xlsxLoading = false;
        this.$message.error('Excel处理库加载失败，请刷新页面重试');
      };
      
      document.head.appendChild(script);
    },
    
    // 搜索学生
    searchStudents() {
      this.currentPage = 1;
    },
    
    // 重置筛选条件
    resetFilters() {
      this.searchQuery = '';
      this.statusFilter = '';
      this.currentPage = 1;
    },
    
    // 分页相关方法
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    
    // 选择学生
    handleSelectionChange(selection) {
      this.selectedStudents = selection;
    },
    
    // 查看学生详情
    viewStudentDetail(studentId) {
      this.$router.push(`/teacher/student/${studentId}`);
    },
    
    // 打开编辑对话框
    editStudent(studentId) {
      this.isEditMode = true;
      const student = this.students.find(s => s.studentId === studentId);
      if (student) {
        this.editForm = { ...student };
        this.editDialogVisible = true;
      }
    },
    
    // 打开添加对话框
    addStudent() {
      this.isEditMode = false;
      this.editForm = {
        studentId: '',
        name: '',
        gender: 'male',
        age: 16,
        braceletId: '',
        password: ''
      };
      this.editDialogVisible = true;
    },
    
    // 提交编辑表单
    submitEditForm() {
      this.$refs.editForm.validate((valid) => {
        if (valid) {
          if (this.isEditMode) {
            // 更新学生
            const index = this.students.findIndex(s => s.studentId === this.editForm.studentId);
            if (index !== -1) {
              this.students.splice(index, 1, { ...this.editForm });
            }
          } else {
            // 添加新学生
            this.students.push({
              ...this.editForm,
              status: 'normal',
              lastLogin: null
            });
          }
          this.editDialogVisible = false;
          this.$message.success(this.isEditMode ? '学生信息更新成功' : '学生添加成功');
        }
      });
    },
    
    // 打开绑定手环对话框
    bindBracelet(studentId) {
      const student = this.students.find(s => s.studentId === studentId);
      if (student) {
        this.bindForm = {
          studentId: student.studentId,
          name: student.name,
          braceletId: student.braceletId || ''
        };
        this.bindDialogVisible = true;
      }
    },
    
    // 提交手环绑定表单
    submitBindForm() {
      this.$refs.bindForm.validate((valid) => {
        if (valid) {
          const index = this.students.findIndex(s => s.studentId === this.bindForm.studentId);
          if (index !== -1) {
            this.students[index].braceletId = this.bindForm.braceletId;
            this.bindDialogVisible = false;
            this.$message.success('手环绑定成功');
          }
        }
      });
    },
    
    // 删除学生
    deleteStudent(studentId) {
      this.$confirm(`确定要删除学号为 ${studentId} 的学生吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.students.findIndex(s => s.studentId === studentId);
        if (index !== -1) {
          this.students.splice(index, 1);
          this.$message.success('学生删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 批量删除学生
    batchDeleteStudents() {
      if (this.selectedStudents.length === 0) {
        this.$message.warning('请选择要删除的学生');
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedStudents.length} 名学生吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const studentIds = this.selectedStudents.map(s => s.studentId);
        this.students = this.students.filter(s => !studentIds.includes(s.studentId));
        this.selectedStudents = [];
        this.$message.success('学生批量删除成功');
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 打开导入对话框
      openImportDialog() {
        this.importDialogVisible = true;
      },
    
    // 下载导入模板
    downloadTemplate() {
      // 创建模板数据
      const templateData = [
        ['学号', '姓名', '性别', '年龄', '手环ID'],
        ['2023423320102', '张三', '男', 16, 'B001'],
        ['2023423320103', '李四', '女', 15, 'B002'],
        ['2023423320104', '王五', '男', 16, 'B003']
      ];
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 12 }, // 学号
        { wch: 10 }, // 姓名
        { wch: 8 },  // 性别
        { wch: 8 },  // 年龄
        { wch: 10 }  // 手环ID
      ];
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '学生信息模板');
      
      // 导出文件
      XLSX.writeFile(wb, '学生导入模板.xlsx');
      this.$message.success('模板下载成功');
    },
    
    // 文件选择变化
    handleFileChange(file) {
      this.importFile = file.raw;
      return false; // 阻止自动上传
    },
    
    // 文件上传前验证
    beforeUpload(file) {
      const isExcel = file.type === 'application/vnd.ms-excel' || 
                     file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const isLt2M = file.size / 1024 / 1024 < 2;
      
      if (!isExcel) {
        this.$message.error('上传文件只能是 Excel 文件！');
      }
      if (!isLt2M) {
        this.$message.error('上传文件大小不能超过 2MB！');
      }
      
      return isExcel && isLt2M;
    },
    
    // 解析Excel文件
    parseExcelFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将Excel数据转换为JSON格式
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: ['studentId', 'name', 'gender', 'age', 'braceletId'],
              range: 1, // 从第二行开始读取数据
              defval: '' // 空单元格默认值
            });
            
            // 处理数据格式
            const processedData = jsonData.map(item => {
              // 转换性别为male/female
              let gender = 'male';
              if (item.gender === '女' || item.gender === 'female') {
                gender = 'female';
              }
              
              // 转换年龄为数字
              const age = parseInt(item.age) || 16;
              
              return {
                studentId: item.studentId.toString().trim(),
                name: item.name.toString().trim(),
                gender: gender,
                age: age,
                braceletId: item.braceletId.toString().trim(),
                status: 'normal',
                lastLogin: null
              };
            });
            
            resolve(processedData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    },
    
    // 确认导入
    confirmImport() {
      if (!this.importFile) {
        this.$message.error('请先选择要导入的Excel文件');
        return;
      }
      
      // 检查xlsx库是否加载完成
      if (this.xlsxLoading) {
        this.$message.error('Excel处理库正在加载，请稍后重试');
        return;
      }
      
      if (!this.xlsxLoaded) {
        this.$message.error('Excel处理库未加载成功，请刷新页面重试');
        return;
      }
      
      this.$message.info('正在解析Excel文件...');
      
      // 解析Excel文件
      this.parseExcelFile(this.importFile)
        .then(students => {
          if (students.length === 0) {
            this.$message.warning('Excel文件中没有有效数据');
            return;
          }
          
          // 验证数据格式
          const invalidData = students.filter(student => {
            return !student.studentId || !student.name;
          });
          
          if (invalidData.length > 0) {
            this.$message.error(`发现${invalidData.length}条无效数据，请检查学号和姓名是否完整`);
            return;
          }
          
          // 保存解析后的数据
          this.importData = students;
          // 打开确认对话框
          this.importConfirmDialogVisible = true;
        })
        .catch(error => {
          console.error('解析Excel文件失败:', error);
          this.$message.error('解析Excel文件失败，请检查文件格式是否正确');
        });
    },
    
    // 提交导入请求
    submitImport() {
      // 准备导入数据
      const importData = this.importData.map(student => ({
        name: student.name,
        username: student.studentId, // 使用学号作为用户名
        password: student.studentId.slice(-6), // 默认密码为学号后6位
        role: 'student', // 导入的都是学生
        class_name: this.userInfo.className, // 当前班级
        device_id: student.braceletId || null
      }));
      
      // 发送请求到后端API
      this.$message.info('正在导入学生数据...');
      
      // 使用axios发送POST请求
      this.$axios.post('/users/import', { users: importData, overwrite: this.importOverwrite })
        .then(response => {
          // 关闭对话框
          this.importConfirmDialogVisible = false;
          this.importDialogVisible = false;
          this.importFile = null;
          this.importOverwrite = false; // 重置覆盖选项
          
          // 更新本地学生列表
          this.students = this.importData;
          
          // 显示导入结果
          if (response.data.errors && response.data.errors.length > 0) {
            this.$message.warning(`${response.data.message}\n失败详情：${JSON.stringify(response.data.errors)}`);
          } else {
            const { importedUsers, updatedUsers } = response.data;
            let message = '';
            if (importedUsers && importedUsers.length > 0) {
              message += `成功导入${importedUsers.length}名学生`;
            }
            if (updatedUsers && updatedUsers.length > 0) {
              message += `${message ? '，' : ''}成功更新${updatedUsers.length}名学生`;
            }
            this.$message.success(message);
          }
        })
        .catch(error => {
          console.error('导入学生数据失败:', error.response || error);
          this.$message.error(`导入学生数据失败: ${error.response?.data?.message || error.message}`);
        });
    },
      
      // 导出学生数据
      exportStudents() {
        this.$message.info('正在导出学生数据...');
        setTimeout(() => {
          this.$message.success('导出成功！');
        }, 1500);
      },
    
    // 批量重置密码
    batchResetPassword() {
      if (this.selectedStudents.length === 0) {
        this.$message.warning('请选择要重置密码的学生');
        return;
      }
      
      this.$confirm(`确定要重置选中的 ${this.selectedStudents.length} 名学生的密码吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('密码重置成功，新密码默认为学号后6位');
        this.selectedStudents = [];
      }).catch(() => {
        this.$message.info('已取消重置');
      });
    }
  }
};
</script>

<style scoped>
.teacher-student-management {
  padding: 24px;
  min-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
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

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.search-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.batch-operations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.students-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.students-badge {
  margin-left: 10px;
}

.student-table {
  background-color: #fff;
}

.text-muted {
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.import-template {
  margin-top: 20px;
  text-align: center;
}

.dialog-footer {
  text-align: center;
}
.back-btn {
  margin-bottom: 10px;
  color: #1890ff;
}

.back-btn:hover {
  color: #40a9ff;
  background-color: rgba(24, 144, 255, 0.1);
}
</style>