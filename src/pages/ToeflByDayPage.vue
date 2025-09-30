<template>
  <q-page class="q-pa-md">
    <!-- 頁面標題 -->
    <div class="text-center q-mb-lg">
      <h1 class="text-h4 text-dark-text q-mb-sm font-weight-bold">
        每日閱讀 (托福)
      </h1>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-dark-text-secondary q-mt-md">載入中...</div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="text-center q-py-xl">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-dark-text q-mt-md">{{ error }}</div>
      <q-btn
        color="primary"
        label="重新載入"
        @click="loadVocabularyData"
        class="q-mt-md"
      />
    </div>

    <!-- 篩選與天數卡片列表 -->
    <div v-else>
      <!-- 篩選列 -->
      <div class="row justify-center q-mb-md q-px-md">
        <div class="pagination-controls">
          <div class="row items-center q-gutter-sm">
            <span class="text-dark-text-secondary">現在顯示：</span>
            <q-select
              v-model="selectedYearMonth"
              :options="yearMonthOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              dense
              outlined
              class="items-per-page-select"
              input-class="text-white"
              popup-content-class="bg-dark-card text-white"
              options-selected-class="text-white"
              options-dense
              use-input
              fill-input
              hide-selected
              behavior="menu"
              input-debounce="150"
              v-model:input-value="yearMonthInput"
              new-value-mode="add-unique"
              @new-value="onNewYearMonth"
              @filter="filterYearMonth"
            />
          </div>
        </div>
      </div>
      <div class="vocab-grid">
        <div
          v-for="dayData in filteredDays"
          :key="dayData.date"
          class="vocab-card-wrapper"
        >
          <q-card
            class="vocab-card cursor-pointer h-full"
            @click="goToDay(dayData.date)"
          >
            <q-card-section class="q-pa-lg">
              <div class="text-center q-mb-md">
                <q-icon
                  name="calendar_today"
                  size="48px"
                  color="primary"
                  class="q-mb-md"
                />
              </div>

              <div class="text-center q-mb-sm">
                <div class="text-body1 text-dark-text-secondary">
                  {{ dayData.date }}
                </div>
              </div>

              <div v-if="dayData.article" class="text-center q-mb-md">
                <div class="text-h6 text-dark-text font-weight-bold line-height-sm">
                  {{ dayData.article.title }}
                </div>
              </div>

              <div class="text-center q-mb-md">
                <div class="text-body1 text-dark-text-secondary">
                  {{ dayData.words.length }} 個單字
                </div>
              </div>

              <div class="text-center">
                <q-btn
                  color="primary"
                  label="開始學習"
                  outline
                  rounded
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-if="filteredDays.length === 0" class="text-center q-py-xl">
        <q-icon name="book" size="80px" color="grey-6" />
        <div class="text-h6 text-dark-text-secondary q-mt-md">
          暫無托福單字資料
        </div>
        <div class="text-body1 text-dark-text-secondary q-mt-sm">
          請確認已正確載入單字資料
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DayContent } from '../types/vocabulary'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const toeflData = ref<DayContent[]>([])
const selectedYearMonth = ref<string>('all')

type YearMonthOption = { label: string; value: string }
const yearMonthAllOptions = computed<YearMonthOption[]>(() => {
  const ymSet = new Set<string>()
  toeflData.value.forEach(d => ymSet.add(d.date.slice(0, 7)))
  const sorted = Array.from(ymSet).sort((a, b) => {
    const aT = new Date(a.replace(/\//g, '-') + '-01').getTime()
    const bT = new Date(b.replace(/\//g, '-') + '-01').getTime()
    return bT - aT
  })
  return [{ label: 'All', value: 'all' }, ...sorted.map(v => ({ label: v, value: v }))]
})
const yearMonthOptions = ref<YearMonthOption[]>([])
const yearMonthInput = ref('')

watch(yearMonthAllOptions, (opts) => {
  yearMonthOptions.value = opts
}, { immediate: true })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterYearMonth(val: string, update: any) {
  update(() => {
    if (!val) {
      yearMonthOptions.value = yearMonthAllOptions.value
      return
    }
    const needle = val.toLowerCase()
    yearMonthOptions.value = yearMonthAllOptions.value.filter(o => o.label.toLowerCase().includes(needle))
  })
}

// 使用 Enter/Tab 時套用第一個匹配或 All，不新增自由文字
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onNewYearMonth(val: string, done: any) {
  // 標記參數為已使用以通過 linter
  void done
  const needle = (val || '').toLowerCase()
  const first = yearMonthOptions.value.find(o => o.label.toLowerCase().includes(needle))
  if (first) {
    selectedYearMonth.value = first.value
    done(first, 'add-unique')
  } else if (needle === 'all') {
    const all = { label: 'All', value: 'all' }
    selectedYearMonth.value = 'all'
    done(all, 'add-unique')
  } else {
    done()
  }
  yearMonthInput.value = ''
}

const filteredDays = computed(() => {
  if (selectedYearMonth.value === 'all') return toeflData.value
  return toeflData.value.filter(d => d.date.startsWith(selectedYearMonth.value + '/'))
})

// 載入單字資料
async function loadVocabularyData() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/toefl.json')
    if (!response.ok) {
      throw new Error('載入托福單字資料失敗')
    }
    toeflData.value = (await response.json()).sort((a: DayContent, b: DayContent) => {
      // 日期格式為 yyyy/MM/dd，轉為可比較的時間戳
      const aTime = new Date(a.date.replace(/\//g, '-')).getTime()
      const bTime = new Date(b.date.replace(/\//g, '-')).getTime()
      return bTime - aTime // 新到舊
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入資料時發生錯誤'
  } finally {
    loading.value = false
  }
}

// 前往指定日期的單字頁面
function goToDay(date: string) {
  // 將日期格式從 2025/09/21 轉換為 2025-09-21 以避免 URL 衝突
  const encodedDate = date.replace(/\//g, '-')
  void router.push(`/toefl/day/${encodedDate}`)
}

onMounted(() => {
  void loadVocabularyData()
})
</script>

<style scoped>
.vocab-card {
  transition: all 0.3s ease-in-out
}

.vocab-card:hover {
  transform: translateY(-4px)
}
</style>
