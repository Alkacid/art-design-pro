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

        <!-- 动态生成健康指标分组 -->
        <template v-for="(group, groupIndex) in metricGroups" :key="groupIndex">
          <ElDivider content-position="left">
            <span class="divider-text">{{ group.title }}</span>
          </ElDivider>

          <!-- 动态生成表单项 -->
          <template v-for="metric in group.metrics" :key="metric.key">
            <ElFormItem :label="metric.label" :prop="metric.key">
              <ElInputNumber
                v-if="metric.type === 'number'"
                v-model="(formData as any)[metric.key]"
                :min="metric.min"
                :max="metric.max"
                :precision="metric.precision"
                :step="metric.precision ? 0.1 : 1"
                :placeholder="metric.placeholder"
                style="width: 100%"
              >
                <template #append>{{ metric.unit }}</template>
              </ElInputNumber>
              <ElInput
                v-else-if="metric.type === 'string'"
                v-model="(formData as any)[metric.key]"
                :placeholder="metric.placeholder"
              />
              <!-- 显示正常范围提示 -->
              <div v-if="metric.normalRange" class="range-hint">
                正常范围: {{ metric.normalRange.min }} - {{ metric.normalRange.max }}
                {{ metric.unit }}
              </div>
            </ElFormItem>
          </template>
        </template>

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

    <!-- 健康指标参考卡片（基于配置自动生成） -->
    <ElCard class="reference-card">
      <template #header>
        <div class="card-header">
          <ElIcon><InfoFilled /></ElIcon>
          <span>健康指标参考值</span>
        </div>
      </template>

      <ElRow :gutter="20">
        <ElCol v-for="metric in metricsWithNormalRange" :key="metric.key" :xs="24" :sm="12" :md="8">
          <div class="reference-item">
            <h4>{{ metric.label }}（{{ metric.unit }}）</h4>
            <p v-if="metric.normalRange">
              <strong>正常范围:</strong> {{ metric.normalRange.min }} -
              {{ metric.normalRange.max }}
            </p>
            <p v-if="metric.normalRange?.description" class="description">
              {{ metric.normalRange.description }}
            </p>
            <p v-if="metric.description" class="tip">
              <ElIcon><InfoFilled /></ElIcon>
              {{ metric.description }}
            </p>
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
  import {
    getSortedMetrics,
    validateMetricValue,
    type HealthMetricConfig
  } from '@/config/health-metrics'

  defineOptions({ name: 'HealthUpdate' })

  const router = useRouter()
  const healthStore = useHealthStore()
  const formRef = ref<FormInstance>()

  // 获取所有健康指标配置
  const allMetrics = getSortedMetrics()

  // 按类别分组指标（根据 sortOrder 自动分组）
  const metricGroups = computed(() => {
    const groups: Array<{ title: string; metrics: HealthMetricConfig[] }> = []

    // 根据 sortOrder 分组
    const weightMetrics = allMetrics.filter((m) => m.sortOrder === 1)
    const pressureMetrics = allMetrics.filter((m) => m.sortOrder === 2 || m.sortOrder === 3)
    const sugarMetrics = allMetrics.filter((m) => m.sortOrder === 4)
    const otherMetrics = allMetrics.filter((m) => m.sortOrder && m.sortOrder >= 5)

    if (weightMetrics.length > 0) {
      groups.push({ title: '体重信息', metrics: weightMetrics })
    }
    if (pressureMetrics.length > 0) {
      groups.push({ title: '血压信息', metrics: pressureMetrics })
    }
    if (sugarMetrics.length > 0) {
      groups.push({ title: '血糖信息', metrics: sugarMetrics })
    }
    if (otherMetrics.length > 0) {
      groups.push({ title: '其他指标', metrics: otherMetrics })
    }

    return groups
  })

  // 有正常范围的指标（用于参考卡片）
  const metricsWithNormalRange = computed(() => {
    return allMetrics.filter((m) => m.normalRange)
  })

  // 表单数据（动态初始化）
  const formData = reactive<Record<string, any>>({
    date: new Date().toISOString(),
    note: ''
  })

  // 动态生成表单验证规则
  const rules = computed<FormRules>(() => {
    const ruleMap: Record<string, any[]> = {
      date: [{ required: true, message: '请选择记录时间', trigger: 'change' }]
    }

    // 为每个指标生成验证规则
    allMetrics.forEach((metric) => {
      const metricRules: any[] = []

      // 必填验证
      if (metric.required) {
        metricRules.push({
          required: true,
          message: `请输入${metric.label}`,
          trigger: 'blur'
        })
      }

      // 范围验证
      if (metric.type === 'number') {
        metricRules.push({
          validator: (rule: any, value: any, callback: any) => {
            if (value === undefined || value === null) {
              callback()
              return
            }
            const result = validateMetricValue(metric.key, value)
            if (!result.valid) {
              callback(new Error(result.message))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        })
      }

      ruleMap[metric.key] = metricRules
    })

    // 添加血压特殊验证
    const systolicPressure = allMetrics.find((m) => m.key === 'systolicPressure')
    const diastolicPressure = allMetrics.find((m) => m.key === 'diastolicPressure')

    if (systolicPressure) {
      ruleMap.systolicPressure = [
        ...(ruleMap.systolicPressure || []),
        {
          validator: (rule: any, value: any, callback: any) => {
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
      ]
    }

    if (diastolicPressure) {
      ruleMap.diastolicPressure = [
        ...(ruleMap.diastolicPressure || []),
        {
          validator: (rule: any, value: any, callback: any) => {
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

    return ruleMap
  })

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
        const hasData = allMetrics.some((metric) => {
          const value = formData[metric.key]
          return value !== undefined && value !== null && value !== ''
        })

        if (!hasData) {
          ElMessage.warning('请至少填写一项健康数据')
          return
        }

        // 构建保存数据（只包含有值的字段）
        const recordData: Record<string, any> = {
          date: formData.date,
          note: formData.note || undefined
        }

        allMetrics.forEach((metric) => {
          if (formData[metric.key] !== undefined && formData[metric.key] !== null) {
            recordData[metric.key] = formData[metric.key]
          }
        })

        // 保存数据
        healthStore.addRecord(recordData)

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
    formData.note = ''

    // 清空所有健康指标字段
    allMetrics.forEach((metric) => {
      delete formData[metric.key]
    })
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
