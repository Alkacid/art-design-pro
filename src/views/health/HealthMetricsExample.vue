<template>
  <div class="health-metrics-example">
    <el-card header="健康数据录入（基于配置自动生成）">
      <el-form :model="formData" :rules="rules" label-width="120px">
        <!-- 动态生成表单项 -->
        <el-form-item
          v-for="metric in metrics"
          :key="metric.key"
          :label="`${metric.label}（${metric.unit}）`"
          :prop="metric.key"
        >
          <el-input-number
            v-if="metric.type === 'number'"
            v-model="(formData as any)[metric.key]"
            :min="metric.min"
            :max="metric.max"
            :precision="metric.precision"
            :placeholder="metric.placeholder"
            style="width: 200px"
          />
          <el-input
            v-else-if="metric.type === 'string'"
            v-model="(formData as any)[metric.key]"
            :placeholder="metric.placeholder"
          />

          <!-- 显示正常范围提示 -->
          <span v-if="metric.normalRange" class="range-hint">
            正常范围: {{ metric.normalRange.min }} - {{ metric.normalRange.max }}
          </span>

          <!-- 显示健康状态 -->
          <el-tag
            v-if="typeof formData[metric.key] === 'number' && metric.normalRange"
            :type="getStatusTagType(metric.key, formData[metric.key] as number) as any"
            size="small"
            style="margin-left: 10px"
          >
            {{ getStatusText(metric.key, formData[metric.key] as number) }}
          </el-tag>
        </el-form-item>

        <el-form-item label="备注" prop="note">
          <el-input
            v-model="formData.note"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit"> 保存健康数据 </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card header="健康数据统计（自动适配配置）" style="margin-top: 20px">
      <el-row :gutter="20">
        <el-col
          v-for="stat in displayStatistics"
          :key="stat.key"
          :span="8"
          style="margin-bottom: 20px"
        >
          <el-statistic :title="stat.label" :value="stat.value" :suffix="stat.unit">
            <template #prefix>
              <el-icon :style="{ color: stat.color }">
                <component :is="stat.icon" />
              </el-icon>
            </template>
          </el-statistic>
        </el-col>
      </el-row>
    </el-card>

    <el-card header="配置管理" style="margin-top: 20px">
      <el-alert title="提示" type="info" :closable="false" style="margin-bottom: 15px">
        当前系统已配置 <strong>{{ metrics.length }}</strong> 个健康指标， 其中
        <strong>{{ chartMetrics.length }}</strong> 个显示在图表中，
        <strong>{{ statsMetrics.length }}</strong> 个参与统计计算。
      </el-alert>

      <el-table :data="metricsTableData" border style="width: 100%">
        <el-table-column prop="label" label="指标名称" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="normalRange" label="正常范围" width="150">
          <template #default="{ row }">
            <span v-if="row.normalRange">
              {{ row.normalRange.min }} - {{ row.normalRange.max }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="显示在图表" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.showInChart ? 'success' : 'info'" size="small">
              {{ row.showInChart ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参与统计" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.showInStatistics ? 'success' : 'info'" size="small">
              {{ row.showInStatistics ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
      </el-table>

      <el-divider />

      <el-alert title="如何添加新的健康指标？" type="success" :closable="false">
        <p>只需要 3 步:</p>
        <ol style="padding-left: 20px; margin: 10px 0">
          <li>打开 <code>src/config/health-metrics.ts</code> 文件</li>
          <li>在 <code>HEALTH_METRICS</code> 数组中添加新的配置对象</li>
          <li>保存文件，页面会自动刷新并显示新指标！</li>
        </ol>
        <p style="margin-top: 10px"> 详细文档请查看: <code>健康指标配置使用指南.md</code> </p>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import {
    getSortedMetrics,
    getChartMetrics,
    getStatisticsMetrics,
    getMetricStatus
    // type HealthMetricConfig
  } from '@/config/health-metrics'
  import { useHealthForm } from '@/composables/useHealthMetrics'

  // 使用配置化的表单
  const { metrics, formData, rules } = useHealthForm()

  // 获取不同类型的指标列表
  const chartMetrics = getChartMetrics()
  const statsMetrics = getStatisticsMetrics()

  // 表格数据
  const metricsTableData = computed(() => {
    return getSortedMetrics()
  })

  // 模拟统计数据
  const displayStatistics = computed(() => {
    return statsMetrics.map((metric) => ({
      key: metric.key,
      label: `平均${metric.label}`,
      value: Math.random() * (metric.max || 100),
      unit: metric.unit,
      color: metric.chartColor,
      icon: 'TrendCharts' // 可以根据实际图标映射
    }))
  })

  // 获取状态标签类型
  const getStatusTagType = (key: string, value: number) => {
    const status = getMetricStatus(key, value)
    const typeMap = {
      normal: 'success',
      warning: 'warning',
      danger: 'danger'
    }
    return typeMap[status]
  }

  // 获取状态文本
  const getStatusText = (key: string, value: number) => {
    const status = getMetricStatus(key, value)
    const textMap = {
      normal: '正常',
      warning: '偏离',
      danger: '异常'
    }
    return textMap[status]
  }

  // 提交表单
  const handleSubmit = () => {
    // 这里可以调用实际的保存逻辑
    ElMessage.success('保存成功！所有数据基于配置自动处理')
    console.log('提交的数据:', formData)
  }

  // 重置表单
  const handleReset = () => {
    Object.keys(formData).forEach((key) => {
      if (key !== 'id' && key !== 'date') {
        delete formData[key]
      }
    })
    ElMessage.info('表单已重置')
  }
</script>

<style scoped lang="scss">
  .health-metrics-example {
    padding: 20px;

    .range-hint {
      margin-left: 10px;
      font-size: 12px;
      color: #909399;
    }

    code {
      padding: 2px 6px;
      font-family: 'Courier New', monospace;
      color: #e83e8c;
      background: #f5f7fa;
      border-radius: 3px;
    }

    ol {
      line-height: 1.8;
    }
  }
</style>
