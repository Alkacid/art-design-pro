<template>
  <div class="health-update">
    <h1 class="page-title">更新健康数据</h1>

    <ElCard class="update-card">
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="left"
      >
        <!-- 日期时间选择 -->
        <ElFormItem label="记录时间" prop="date">
          <ElDatePicker
            v-model="formData.date"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            :disabled-date="disabledDate"
          />
        </ElFormItem>

        <ElDivider content-position="left">
          <span class="divider-text">体重信息</span>
        </ElDivider>

        <!-- 体重 -->
        <ElFormItem label="体重" prop="weight">
          <ElInputNumber
            v-model="formData.weight"
            :min="20"
            :max="300"
            :precision="1"
            :step="0.1"
            placeholder="请输入体重"
            style="width: 100%"
          >
            <template #append>kg</template>
          </ElInputNumber>
        </ElFormItem>

        <!-- 体脂率 -->
        <ElFormItem label="体脂率" prop="bodyFat">
          <ElInputNumber
            v-model="formData.bodyFat"
            :min="1"
            :max="100"
            :precision="1"
            :step="0.1"
            placeholder="请输入体脂率"
            style="width: 100%"
          >
            <template #append>%</template>
          </ElInputNumber>
        </ElFormItem>

        <ElDivider content-position="left">
          <span class="divider-text">血压信息</span>
        </ElDivider>

        <!-- 血压 -->
        <ElFormItem label="收缩压" prop="systolicPressure">
          <ElInputNumber
            v-model="formData.systolicPressure"
            :min="60"
            :max="250"
            :precision="0"
            placeholder="请输入收缩压"
            style="width: 100%"
          >
            <template #append>mmHg</template>
          </ElInputNumber>
        </ElFormItem>

        <ElFormItem label="舒张压" prop="diastolicPressure">
          <ElInputNumber
            v-model="formData.diastolicPressure"
            :min="40"
            :max="150"
            :precision="0"
            placeholder="请输入舒张压"
            style="width: 100%"
          >
            <template #append>mmHg</template>
          </ElInputNumber>
        </ElFormItem>

        <ElDivider content-position="left">
          <span class="divider-text">血糖信息</span>
        </ElDivider>

        <!-- 血糖 -->
        <ElFormItem label="血糖" prop="bloodSugar">
          <ElInputNumber
            v-model="formData.bloodSugar"
            :min="1"
            :max="30"
            :precision="1"
            :step="0.1"
            placeholder="请输入血糖"
            style="width: 100%"
          >
            <template #append>mmol/L</template>
          </ElInputNumber>
        </ElFormItem>

        <ElDivider content-position="left">
          <span class="divider-text">备注</span>
        </ElDivider>

        <!-- 备注 -->
        <ElFormItem label="备注" prop="note">
          <ElInput
            v-model="formData.note"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（选填）"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>

        <!-- 按钮组 -->
        <ElFormItem>
          <div class="button-group">
            <ElButton type="primary" size="large" @click="handleSubmit">
              <ElIcon><DocumentAdd /></ElIcon>
              <span>保存记录</span>
            </ElButton>
            <ElButton size="large" @click="handleReset">
              <ElIcon><RefreshLeft /></ElIcon>
              <span>重置</span>
            </ElButton>
            <ElButton size="large" @click="handleBack">
              <ElIcon><Back /></ElIcon>
              <span>返回</span>
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <!-- 健康指标参考卡片 -->
    <ElCard class="reference-card">
      <template #header>
        <div class="card-header">
          <ElIcon><InfoFilled /></ElIcon>
          <span>健康指标参考值</span>
        </div>
      </template>

      <ElRow :gutter="20">
        <ElCol :xs="24" :sm="12" :md="8">
          <div class="reference-item">
            <h4>体重（BMI）</h4>
            <p>正常: 18.5-23.9</p>
            <p>偏瘦: &lt;18.5</p>
            <p>超重: 24-27.9</p>
            <p>肥胖: ≥28</p>
          </div>
        </ElCol>

        <ElCol :xs="24" :sm="12" :md="8">
          <div class="reference-item">
            <h4>血压</h4>
            <p>正常: 收缩压 &lt;120，舒张压 &lt;80</p>
            <p>正常高值: 收缩压 120-139，舒张压 80-89</p>
            <p>高血压: 收缩压 ≥140，舒张压 ≥90</p>
          </div>
        </ElCol>

        <ElCol :xs="24" :sm="12" :md="8">
          <div class="reference-item">
            <h4>血糖</h4>
            <p>空腹正常: 3.9-6.1 mmol/L</p>
            <p>餐后2h正常: &lt;7.8 mmol/L</p>
            <p>糖尿病: 空腹 ≥7.0 或餐后2h ≥11.1</p>
          </div>
        </ElCol>
      </ElRow>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useHealthStore } from '@/store/modules/health'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { DocumentAdd, RefreshLeft, Back, InfoFilled } from '@element-plus/icons-vue'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'HealthUpdate' })

  const router = useRouter()
  const healthStore = useHealthStore()
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    date: new Date().toISOString(),
    weight: undefined as number | undefined,
    bodyFat: undefined as number | undefined,
    systolicPressure: undefined as number | undefined,
    diastolicPressure: undefined as number | undefined,
    bloodSugar: undefined as number | undefined,
    note: ''
  })

  // 表单验证规则
  const rules: FormRules = {
    date: [{ required: true, message: '请选择记录时间', trigger: 'change' }],
    weight: [
      {
        validator: (rule, value, callback) => {
          if (value === undefined || value === null) {
            callback()
            return
          }
          if (value < 20 || value > 300) {
            callback(new Error('体重应在20-300kg之间'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    systolicPressure: [
      {
        validator: (rule, value, callback) => {
          if (value !== undefined && formData.diastolicPressure === undefined) {
            callback(new Error('请同时填写舒张压'))
          } else if (
            value !== undefined &&
            formData.diastolicPressure !== undefined &&
            value <= formData.diastolicPressure
          ) {
            callback(new Error('收缩压应大于舒张压'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    diastolicPressure: [
      {
        validator: (rule, value, callback) => {
          if (value !== undefined && formData.systolicPressure === undefined) {
            callback(new Error('请同时填写收缩压'))
          } else if (
            value !== undefined &&
            formData.systolicPressure !== undefined &&
            value >= formData.systolicPressure
          ) {
            callback(new Error('舒张压应小于收缩压'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  // 禁用未来日期
  const disabledDate = (time: Date) => {
    return time.getTime() > Date.now()
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        // 检查是否至少填写了一项健康数据
        const hasData =
          formData.weight !== undefined ||
          formData.bodyFat !== undefined ||
          formData.systolicPressure !== undefined ||
          formData.diastolicPressure !== undefined ||
          formData.bloodSugar !== undefined

        if (!hasData) {
          ElMessage.warning('请至少填写一项健康数据')
          return
        }

        // 保存数据
        healthStore.addRecord({
          date: formData.date,
          weight: formData.weight,
          bodyFat: formData.bodyFat,
          systolicPressure: formData.systolicPressure,
          diastolicPressure: formData.diastolicPressure,
          bloodSugar: formData.bloodSugar,
          note: formData.note || undefined
        })

        ElMessage.success('健康数据保存成功')

        // 重置表单
        handleReset()

        // 1秒后跳转到状态页面
        setTimeout(() => {
          router.push('/health/status')
        }, 1000)
      } else {
        ElMessage.error('请检查表单填写是否正确')
      }
    })
  }

  // 重置表单
  const handleReset = () => {
    formRef.value?.resetFields()
    formData.date = new Date().toISOString()
    formData.weight = undefined
    formData.bodyFat = undefined
    formData.systolicPressure = undefined
    formData.diastolicPressure = undefined
    formData.bloodSugar = undefined
    formData.note = ''
  }

  // 返回
  const handleBack = () => {
    router.back()
  }
</script>

<style lang="scss" scoped>
  .health-update {
    max-width: 900px;
    padding: 20px;
    margin: 0 auto;

    .page-title {
      margin: 0 0 20px;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .update-card {
      margin-bottom: 20px;

      .divider-text {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-regular);
      }

      :deep(.el-input-number) {
        width: 100%;

        .el-input__wrapper {
          width: 100%;
        }
      }

      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .el-button {
          flex: 1;
          min-width: 120px;
        }
      }
    }

    .reference-card {
      .card-header {
        display: flex;
        gap: 8px;
        align-items: center;
        font-weight: 500;
      }

      .reference-item {
        padding: 12px;
        margin-bottom: 12px;
        background-color: var(--el-fill-color-light);
        border-radius: 6px;

        h4 {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 500;
          color: var(--el-color-primary);
        }

        p {
          margin: 4px 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--el-text-color-regular);
        }
      }
    }
  }

  @media (width <= 768px) {
    .health-update {
      padding: 10px;

      .page-title {
        font-size: 20px;
      }

      :deep(.el-form) {
        .el-form-item__label {
          font-size: 14px;
        }
      }

      .button-group {
        .el-button {
          flex: 1 1 100%;
        }
      }
    }
  }
</style>
