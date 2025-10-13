import { AppRouteRecord } from '@/types/router'

export const healthRoutes: AppRouteRecord = {
  name: 'Health',
  path: '/health',
  component: '/index/index',
  meta: {
    title: 'menus.health.title',
    icon: '&#xe721;',
    // roles: ['R_SUPER', 'R_ADMIN', 'R_USER']
    roles: ['R_USER']
  },
  children: [
    {
      path: 'status',
      name: 'Status',
      component: '/health/status',
      meta: {
        title: 'menus.health.status',
        keepAlive: false,
        fixedTab: true
      }
    },
    {
      path: 'update',
      name: 'Update',
      component: '/health/update',
      meta: {
        title: 'menus.health.update',
        keepAlive: false,
        fixedTab: true
      }
    }
  ]
}
