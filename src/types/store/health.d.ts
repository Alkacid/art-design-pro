/**
 * 健康数据类型定义
 */

/**
 * 单次健康记录
 */
export interface HealthRecord {
  /** 记录ID */
  id: string
  /** 记录日期时间 */
  date: string
  /** 体重（kg） */
  weight?: number
  /** 收缩压（mmHg） */
  systolicPressure?: number
  /** 舒张压（mmHg） */
  diastolicPressure?: number
  /** 血糖（mmol/L） */
  bloodSugar?: number
  /** 体脂率（%） */
  bodyFat?: number
  /** 备注 */
  note?: string
}

/**
 * 健康数据统计
 */
export interface HealthStatistics {
  /** 平均体重 */
  avgWeight?: number
  /** 平均收缩压 */
  avgSystolicPressure?: number
  /** 平均舒张压 */
  avgDiastolicPressure?: number
  /** 平均血糖 */
  avgBloodSugar?: number
  /** 体重变化趋势（正数表示增加，负数表示减少） */
  weightTrend?: number
}

/**
 * 图表数据项
 */
export interface ChartDataItem {
  /** 日期 */
  date: string
  /** 数值 */
  value: number
}

/**
 * 时间范围类型
 */
export type TimeRangeType = '7d' | '30d' | '90d' | 'all'
