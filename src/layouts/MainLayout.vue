<template>
  <q-layout view="hHh Lpr lFf" class="bg-dark">
    <q-header elevated class="bg-dark-card">
      <q-toolbar class="q-px-md">
        <!-- Logo 和網站名稱 (可點擊回到首頁) -->
        <div class="row items-center q-gutter-sm cursor-pointer" @click="$router.push('/')">
          <q-avatar size="32px">
            <img src="/logo.png" alt="English Forge Logo" />
          </q-avatar>
          <div class="text-h6 text-dark-text font-weight-medium">
            English Forge
          </div>
        </div>

        <q-space />

        <!-- 手機版 hamburger 選單 -->
        <q-btn
          flat
          round
          icon="menu"
          class="text-white lt-md"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <!-- 桌面版導航選單 -->
        <div class="gt-sm">
          <q-tabs
            v-model="activeTab"
            class="text-white"
            indicator-color="white"
            active-color="white"
            align="left"
            no-caps
          >
            <q-route-tab
              name="home"
              label="主頁"
              to="/"
              exact
            />

            <q-tab name="reading" label="英文閱讓">
              <q-menu
                class="bg-dark-card"
                anchor="bottom left"
                self="top left"
                :offset="[0, 10]"
              >
                <q-list class="bg-dark-card">

                  <q-item
                    clickable
                    v-close-popup
                    to="/toefl/by-day"
                    class="text-dark"
                  >
                    <q-item-section>
                      <q-item-label>每日閱讀 (托福)</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    to="/daily/by-day"
                    class="text-dark"
                  >
                    <q-item-section>
                      <q-item-label>每日閱讀 (一般)</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    to="/toefl"
                    class="text-dark"
                  >
                    <q-item-section>
                      <q-item-label>托福單字</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    to="/daily"
                    class="text-dark"
                  >
                    <q-item-section>
                      <q-item-label>一般單字</q-item-label>
                    </q-item-section>
                  </q-item>

                </q-list>
              </q-menu>
            </q-tab>

            <q-tab name="quiz" label="測驗">
              <q-menu
                class="bg-dark-card"
                anchor="bottom left"
                self="top left"
                :offset="[0, 10]"
              >
                <q-list class="bg-dark-card">
                  <q-item
                    clickable
                    v-close-popup
                    to="/quiz-toefl"
                    class="text-dark"
                  >
                    <q-item-section>
                      <q-item-label>托福單字</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    to="/quiz-daily"
                    class="text-dark"
                  >
                    <q-item-section>
                      <q-item-label>一般單字</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-tab>
          </q-tabs>
        </div>

        <!-- 外部連結 -->
        <q-btn
          flat
          round
          icon="open_in_new"
          class="text-white"
          @click="openExternalLink"
        >
          <q-tooltip class="bg-dark-card text-dark">
            前往 jeremyho.tw
          </q-tooltip>
        </q-btn>

      </q-toolbar>
    </q-header>

    <!-- 左側抽屜選單 (手機版) -->
    <q-drawer
      v-model="leftDrawerOpen"
      :show-if-above="false"
      bordered
      class="bg-dark-card"
      :width="280"
    >
      <q-list class="q-pa-md">
        <q-item
          clickable
          to="/"
          exact
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>
            <q-item-label>首頁</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" color="grey-7" />

        <q-item-label header class="text-grey-4 q-mb-sm">英文閱讀</q-item-label>

        <q-item
          clickable
          to="/toefl/by-day"
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="calendar_today" />
          </q-item-section>
          <q-item-section>
            <q-item-label>每日閱讀 (托福)</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          to="/daily/by-day"
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="calendar_today" />
          </q-item-section>
          <q-item-section>
            <q-item-label>每日閱讀 (一般)</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          to="/toefl"
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="school" />
          </q-item-section>
          <q-item-section>
            <q-item-label>托福單字</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          to="/daily"
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="book" />
          </q-item-section>
          <q-item-section>
            <q-item-label>一般單字</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" color="grey-7" />

        <q-item-label header class="text-grey-4 q-mb-sm">測驗</q-item-label>

        <q-item
          clickable
          to="/quiz-toefl"
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="quiz" />
          </q-item-section>
          <q-item-section>
            <q-item-label>托福測驗</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          to="/quiz-daily"
          class="text-white q-mb-sm"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon name="quiz" />
          </q-item-section>
          <q-item-section>
            <q-item-label>一般測驗</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" color="grey-7" />

        <q-item
          clickable
          @click="openExternalLink"
          class="text-white"
        >
          <q-item-section avatar>
            <q-icon name="open_in_new" />
          </q-item-section>
          <q-item-section>
            <q-item-label>前往 jeremyho.tw</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-dark">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const leftDrawerOpen = ref(false)

// 根據當前路由設定 active tab
const activeTab = computed(() => {
  const path = route.path
  if (path === '/') return 'home'
  if (path.startsWith('/toefl') || path.startsWith('/daily')) return 'vocabulary'
  if (path.startsWith('/quiz')) return 'quiz'
  return 'home'
})

function openExternalLink() {
  window.open('https://jeremyho.tw/', '_blank')
}
</script>
