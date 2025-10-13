import { defineStore } from 'pinia'
import type { HealthRecord, HealthStatistics, TimeRangeType } from '@/types/store/health'

/**
 * 健康数据 Store
 */
export const useHealthStore = defineStore(
  'healthStore',
  () => {
    // 健康记录列表
    const records = ref<HealthRecord[]>([])

    /**
     * 添加健康记录
     */
    const addRecord = (record: Omit<HealthRecord, 'id'>) => {
      const newRecord: HealthRecord = {
        ...record,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
      }
      records.value.unshift(newRecord)
    }

    /**
     * 更新健康记录
     */
    const updateRecord = (id: string, record: Partial<HealthRecord>) => {
      const index = records.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        records.value[index] = { ...records.value[index], ...record }
      }
    }

    /**
     * 删除健康记录
     */
    const deleteRecord = (id: string) => {
      const index = records.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        records.value.splice(index, 1)
      }
    }

    /**
     * 根据时间范围获取记录
     */
    const getRecordsByTimeRange = (timeRange: TimeRangeType): HealthRecord[] => {
      if (timeRange === 'all') {
        return records.value
      }

      const now = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      return records.value.filter((record) => {
        const recordDate = new Date(record.date)
        return recordDate >= startDate
      })
    }

    /**
     * 获取统计数据
     */
    const getStatistics = (timeRange: TimeRangeType = 'all'): HealthStatistics => {
      const filteredRecords = getRecordsByTimeRange(timeRange)

      if (filteredRecords.length === 0) {
        return {}
      }

      // 计算平均值
      let totalWeight = 0
      let weightCount = 0
      let totalSystolic = 0
      let systolicCount = 0
      let totalDiastolic = 0
      let diastolicCount = 0
      let totalBloodSugar = 0
      let bloodSugarCount = 0

      filteredRecords.forEach((record) => {
        if (record.weight !== undefined) {
          totalWeight += record.weight
          weightCount++
        }
        if (record.systolicPressure !== undefined) {
          totalSystolic += record.systolicPressure
          systolicCount++
        }
        if (record.diastolicPressure !== undefined) {
          totalDiastolic += record.diastolicPressure
          diastolicCount++
        }
        if (record.bloodSugar !== undefined) {
          totalBloodSugar += record.bloodSugar
          bloodSugarCount++
        }
      })

      // 计算体重趋势
      let weightTrend = 0
      const weightRecords = filteredRecords.filter((r) => r.weight !== undefined)
      if (weightRecords.length >= 2) {
        const firstWeight = weightRecords[weightRecords.length - 1].weight!
        const lastWeight = weightRecords[0].weight!
        weightTrend = lastWeight - firstWeight
      }

      return {
        avgWeight: weightCount > 0 ? totalWeight / weightCount : undefined,
        avgSystolicPressure: systolicCount > 0 ? totalSystolic / systolicCount : undefined,
        avgDiastolicPressure: diastolicCount > 0 ? totalDiastolic / diastolicCount : undefined,
        avgBloodSugar: bloodSugarCount > 0 ? totalBloodSugar / bloodSugarCount : undefined,
        weightTrend
      }
    }

    /**
     * 获取最新记录
     */
    const getLatestRecord = computed(() => {
      return records.value.length > 0 ? records.value[0] : null
    })

    /**
     * 清空所有记录
     */
    const clearRecords = () => {
      records.value = []
    }

    /**
     * 初始化示例数据（用于开发测试）
     */
    const initSampleData = () => {
      if (records.value.length > 0) return

      const sampleData: Omit<HealthRecord, 'id'>[] = []
      const now = new Date()

      // 生成过去30天的示例数据
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)

        sampleData.push({
          date: date.toISOString(),
          weight: 70 + Math.random() * 5 - 2.5,
          systolicPressure: 120 + Math.random() * 20 - 10,
          diastolicPressure: 80 + Math.random() * 10 - 5,
          bloodSugar: 5.5 + Math.random() * 1 - 0.5,
          bodyFat: 20 + Math.random() * 3 - 1.5
        })
      }

      sampleData.forEach((data) => addRecord(data))
    }

    return {
      records,
      addRecord,
      updateRecord,
      deleteRecord,
      getRecordsByTimeRange,
      getStatistics,
      getLatestRecord,
      clearRecords,
      initSampleData
    }
  },
  {
    persist: true
  }
)
