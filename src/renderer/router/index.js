import Vue from 'vue'
import Router from 'vue-router'

/* Layout */
import Tabbar from '@/components/tabbar'

Vue.use(Router)

export const constantRoutes = [
  {
    path: '/',
    component: Tabbar,
    // alwaysShow: true,
    children: [{
      path: '',
      name: '首页',
      component: () => import('@/pages/index')
    }]
  },
  {
    path: '/shuttering',
    component: Tabbar,
    // alwaysShow: true,
    children: [{
      path: '',
      name: '模板',
      component: () => import('@/pages/shuttering')
    }]
  },
  // 404 page must be placed at the end !!!
  {
    path: '*',
    redirect: '/404',
    hidden: true
  }
]

const createRouter = () => new Router({
  mode: 'hash', // require service support
  scrollBehavior: () => ({
    y: 0
  }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter () {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
