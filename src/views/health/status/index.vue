<template>
  <div class="health-status">
    <h1 class="page-title">健康状态趋势</h1>

    <!-- 时间范围选择器和统计信息 -->
    <div class="control-panel">
      <ElCard class="stats-card">
        <div class="stats-header">
          <h3>统计摘要</h3>
          <ElRadioGroup v-model="timeRange" size="small" @change="handleTimeRangeChange">
            <ElRadioButton label="7d">近7天</ElRadioButton>
            <ElRadioButton label="30d">近30天</ElRadioButton>
            <ElRadioButton label="90d">近90天</ElRadioButton>
            <ElRadioButton label="all">全部</ElRadioButton>
          </ElRadioGroup>
        </div>

        <!-- 动态统计信息（基于配置） -->
        <ElRow :gutter="20" class="stats-content">
          <ElCol v-for="metric in statisticsMetrics" :key="metric.key" :xs="12" :sm="6">
            <div class="stat-item">
              <div class="stat-label">平均{{ metric.label }}</div>
              <div class="stat-value">
                {{ getStatValue(metric.key) }}
                <span class="unit">{{ metric.unit }}</span>
              </div>
              <!-- 显示趋势（如果有） -->
              <div
                v-if="getTrendValue(metric.key) !== null"
                class="stat-trend"
                :class="{
                  positive: getTrendValue(metric.key)! > 0,
                  negative: getTrendValue(metric.key)! < 0
                }"
              >
                {{ getTrendValue(metric.key)! > 0 ? '+' : '' }}{{ getTrendValue(metric.key)
                }}{{ metric.unit }}
              </div>
            </div>
          </ElCol>
        </ElRow>
      </ElCard>
    </div>

    <!-- 图表展示区域（基于配置动态生成） -->
    <ElRow :gutter="20" class="charts-section">
      <!-- 动态生成图表 -->
      <ElCol v-for="metric in chartMetrics" :key="metric.key" :xs="24" :lg="12">
        <div class="card art-custom-card">
          <div class="card-header">
            <span>{{ metric.label }}变化趋势</span>
            <span class="unit-label">单位: {{ metric.unit }}</span>
          </div>
          <ArtLineChart
            v-if="getChartData(metric.key).length > 0"
            :data="getChartData(metric.key)"
            :xAxisData="dateLabels"
            :showAreaColor="!isMultiSeries(metric.key)"
            :colors="[metric.chartColor || '#409eff']"
            :showLegend="isMultiSeries(metric.key)"
            symbol="circle"
            :symbolSize="6"
            height="300px"
          />
          <ElEmpty v-else description="暂无数据" />
        </div>
      </ElCol>

      <!-- 记录列表 -->
      <ElCol :xs="24" :lg="12">
        <div class="card art-custom-card">
          <div class="card-header">
            <span>最近记录</span>
            <ElButton type="primary" size="small" @click="goToUpdate">添加记录</ElButton>
          </div>
          <div class="records-list">
            <div v-if="displayRecords.length === 0" class="empty-records">
              <ElEmpty description="暂无记录" />
            </div>
            <div v-else class="record-items">
              <div v-for="record in displayRecords" :key="record.id" class="record-item">
                <div class="record-date">{{ formatDate(record.date) }}</div>
                <div class="record-details">
                  <!-- 动态显示所有有值的指标 -->
                  <span
                    v-for="metric in allMetrics"
                    :key="metric.key"
                    v-show="record[metric.key as keyof typeof record] !== undefined"
                  >
                    {{ metric.label }}:
                    {{ formatMetricValue(record[metric.key as keyof typeof record], metric) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { useHealthStore } from '@/store/modules/health'
  import type { TimeRangeType, HealthRecord } from '@/types/store/health'
  import type { LineDataItem } from '@/types/component/chart'
  import { useRouter } from 'vue-router'
  import {
    getSortedMetrics,
    getChartMetrics,
    getStatisticsMetrics,
    type HealthMetricConfig
  } from '@/config/health-metrics'

  defineOptions({ name: 'HealthStatus' })

  const router = useRouter()
  const healthStore = useHealthStore()

  // 获取配置
  const allMetrics = getSortedMetrics()
  const chartMetrics = getChartMetrics()
  const statisticsMetrics = getStatisticsMetrics()

  // 时间范围
  const timeRange = ref<TimeRangeType>('30d')

  // 初始化示例数据（如果没有数据）
  onMounted(() => {
    if (healthStore.records.length === 0) {
      healthStore.initSampleData()
    }
  })

  // 获取过滤后的记录
  const filteredRecords = computed<HealthRecord[]>(() => {
    return healthStore.getRecordsByTimeRange(timeRange.value).slice().reverse()
  })

  // 统计数据
  const statistics = computed(() => {
    return healthStore.getStatistics(timeRange.value)
  })

  // 日期标签
  const dateLabels = computed(() => {
    return filteredRecords.value.map((record) => {
      const date = new Date(record.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })
  })

  // 获取统计值（基于配置）
  const getStatValue = (key: string) => {
    const avgKey = `avg${key.charAt(0).toUpperCase() + key.slice(1)}`
    const value = (statistics.value as any)[avgKey]
    const metric = allMetrics.find((m) => m.key === key)

    if (value === undefined || value === null) {
      return '--'
    }

    return metric?.precision !== undefined ? value.toFixed(metric.precision) : value
  }

  // 获取趋势值
  const getTrendValue = (key: string) => {
    const trendKey = `${key}Trend`
    const value = (statistics.value as any)[trendKey]
    const metric = allMetrics.find((m) => m.key === key)

    if (value === undefined || value === null) {
      return null
    }

    return metric?.precision !== undefined ? value.toFixed(metric.precision) : value
  }

  // 判断是否为多系列图表（如血压）
  const isMultiSeries = (key: string) => {
    return key === 'bloodPressure' // 特殊处理血压
  }

  // 获取图表数据（基于配置）
  const getChartData = (key: string) => {
    // 特殊处理血压（显示收缩压和舒张压）
    if (key === 'systolicPressure' || key === 'diastolicPressure') {
      // 如果是收缩压，返回血压的多系列数据
      if (key === 'systolicPressure') {
        const systolicData = filteredRecords.value.map((record) => record.systolicPressure ?? null)
        const diastolicData = filteredRecords.value.map(
          (record) => record.diastolicPressure ?? null
        )

        const hasData =
          systolicData.some((v) => v !== null) || diastolicData.some((v) => v !== null)

        if (!hasData) return []

        return [
          {
            name: '收缩压',
            data: systolicData.map((v) => v ?? 0)
          },
          {
            name: '舒张压',
            data: diastolicData.map((v) => v ?? 0)
          }
        ] as LineDataItem[]
      }
      // 舒张压不单独显示图表（已在收缩压图表中）
      return []
    }

    // 其他指标的单系列数据
    const values = filteredRecords.value
      .filter((record) => record[key as keyof HealthRecord] !== undefined)
      .map((record) => record[key as keyof HealthRecord] as number)

    return values.length > 0 ? values : []
  }

  // 显示的最近记录（最多10条）
  const displayRecords = computed<HealthRecord[]>(() => {
    return healthStore.records.slice(0, 10)
  })

  // 格式化指标值
  const formatMetricValue = (value: any, metric: HealthMetricConfig) => {
    if (value === undefined || value === null) return ''

    if (metric.type === 'number' && typeof value === 'number') {
      const formatted =
        metric.precision !== undefined ? value.toFixed(metric.precision) : value.toString()
      return `${formatted}${metric.unit}`
    }

    return `${value}${metric.unit}`
  }

  // 时间范围改变处理
  const handleTimeRangeChange = () => {
    // 数据会自动更新
  }

  // 跳转到更新页面
  const goToUpdate = () => {
    router.push('/health/update')
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
</script>

<style lang="scss" scoped>
  .health-status {
    padding: 20px;

    .page-title {
      margin: 0 0 20px;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .control-panel {
      margin-bottom: 20px;

      .stats-card {
        .stats-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
          }
        }

        .stats-content {
          .stat-item {
            padding: 10px;
            text-align: center;

            .stat-label {
              margin-bottom: 8px;
              font-size: 13px;
              color: var(--el-text-color-secondary);
            }

            .stat-value {
              font-size: 24px;
              font-weight: 600;
              color: var(--el-text-color-primary);

              .unit {
                margin-left: 4px;
                font-size: 14px;
                font-weight: normal;
                color: var(--el-text-color-secondary);
              }
            }

            .stat-trend {
              margin-top: 4px;
              font-size: 13px;

              &.positive {
                color: #f56c6c;
              }

              &.negative {
                color: #67c23a;
              }
            }
          }
        }
      }
    }

    .charts-section {
      .card {
        padding: 20px;
        margin-bottom: 20px;
        background-color: var(--art-main-bg-color);
        border-radius: var(--custom-radius);

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 15px;

          span {
            font-size: 16px;
            font-weight: 500;
          }

          .unit-label {
            font-size: 13px;
            font-weight: normal;
            color: var(--el-text-color-secondary);
          }
        }

        .records-list {
          max-height: 350px;
          overflow-y: auto;

          .empty-records {
            padding: 40px 0;
          }

          .record-items {
            .record-item {
              padding: 12px;
              border-bottom: 1px solid var(--el-border-color-lighter);
              transition: background-color 0.2s;

              &:hover {
                background-color: var(--el-fill-color-light);
              }

              &:last-child {
                border-bottom: none;
              }

              .record-date {
                margin-bottom: 6px;
                font-size: 13px;
                color: var(--el-text-color-secondary);
              }

              .record-details {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                font-size: 14px;
                color: var(--el-text-color-primary);

                span {
                  padding: 2px 8px;
                  background-color: var(--el-fill-color);
                  border-radius: 4px;
                }
              }
            }
          }
        }
      }
    }
  }

  @media (width <= 768px) {
    .health-status {
      padding: 10px;

      .stats-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start !important;
      }
    }
  }
</style>
