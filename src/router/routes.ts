import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'toefl', component: () => import('pages/ToeflPage.vue') },
      { path: 'toefl/by-day', component: () => import('pages/ToeflByDayPage.vue') },
      { path: 'toefl/day/:date', component: () => import('pages/ToeflDayPage.vue') },
      { path: 'daily', component: () => import('pages/DailyPage.vue') },
      { path: 'daily/by-day', component: () => import('pages/DailyByDayPage.vue') },
      { path: 'daily/day/:date', component: () => import('pages/DailyDayPage.vue') },
      {
        path: 'listening-practice',
        name: 'listening-practice',
        component: () => import('pages/ListeningPracticePage.vue')
      },
      { path: 'quiz-toefl', component: () => import('pages/QuizToeflPage.vue') },
      { path: 'quiz-daily', component: () => import('pages/QuizDailyPage.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
