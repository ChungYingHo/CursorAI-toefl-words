<template>
  <q-page class="q-pa-md">
    <!-- 頁面標題 -->
    <div class="text-center q-mb-lg">
      <h1 class="text-h4 text-dark-text q-mb-sm font-weight-bold">
        托福單字
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

    <!-- 單字列表 -->
    <div v-else>
      <!-- 分頁控制 -->
      <div class="row justify-center q-mb-md q-px-md">
        <div class="pagination-controls">
          <div class="pagination-info">
            <span class="text-dark-text-secondary">共 {{ totalWords }} 個單字</span>
          </div>
          <div class="pagination-selector">
            <span class="text-dark-text-secondary">每頁顯示</span>
            <q-select
              v-model="itemsPerPage"
              :options="itemsPerPageOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              dense
              outlined
              class="items-per-page-select text-dark"
              popup-content-class="bg-dark-card text-dark"
              options-selected-class="text-dark"
              options-dense
              @update:model-value="onItemsPerPageChange"
            />
          </div>
        </div>
      </div>

      <!-- 單字卡片網格 -->
      <div class="vocab-grid">
        <div
          v-for="word in paginatedWords"
          :key="word.word"
          class="vocab-card-wrapper"
        >
          <q-card class="vocab-card h-full" :class="getCardColorClass(word.count)">
            <q-card-section class="q-pa-md d-flex flex-column h-full">
              <div class="row items-start justify-between q-mb-sm">
                <div class="text-h5 font-weight-bold" :class="getWordColorClass(word.count)">
                  {{ word.word }}
                  <q-badge class="q-ml-sm" outline :class="getBadgeColorClass(word.count)">
                    x{{ word.count }}
                    <q-tooltip class="bg-dark-card text-dark-text">
                      出現於：{{ word.dates.join('、') }}
                    </q-tooltip>
                  </q-badge>
                  <q-btn
                    v-if="word.count > 1"
                    flat
                    dense
                    round
                    icon="add"
                    class="q-ml-xs"
                    :class="getPlusButtonClass(word.count)"
                    @click="openOccurrences(word.word)"
                  >
                    <q-tooltip class="bg-dark-card text-dark-text">查看出現明細</q-tooltip>
                  </q-btn>
                </div>
                <q-btn
                  flat
                  round
                  icon="volume_up"
                  size="sm"
                  color="primary"
                  @click="playPronunciation(word.word)"
                >
                  <q-tooltip class="bg-dark-card text-dark-text">
                    播放發音
                  </q-tooltip>
                </q-btn>
              </div>

              <div v-if="word.phonetic" class="text-caption text-dark-text-secondary q-mb-sm">
                {{ word.phonetic }}
              </div>

              <div class="text-body1 text-dark-text q-mb-sm">
                {{ word.definition }} {{ word.partOfSpeech }}
              </div>

              <div v-if="word.example" class="text-body1 text-dark-text-secondary">
                {{ word.example }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 分頁器 -->
      <div class="row justify-center q-mt-lg">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="5"
          direction-links
          boundary-links
          color="primary"
          text-color="white"
          @update:model-value="onPageChange"
        />
      </div>
    </div>

    <!-- 出現明細 Dialog -->
    <q-dialog v-model="occurrenceDialog">
      <q-card class="bg-grey-9 text-white dialog-card">
        <q-card-section>
          <div class="row items-center no-wrap">
            <div class="text-h6 text-white">單字出現明細 - {{ dialogWord }}</div>
            <q-btn
              flat
              round
              icon="volume_up"
              size="sm"
              color="white"
              class="q-ml-sm"
              @click="playPronunciation(dialogWord)"
            >
              <q-tooltip class="bg-grey-9 text-white">播放發音</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-for="(occurrence, index) in currentOccurrences" :key="`${occurrence.date}-${occurrence.title}`" class="q-mb-md">
            <div class="row items-center q-mb-xs">
              <q-badge color="primary" class="q-mr-sm">{{ occurrence.date }}</q-badge>
              <span class="text-white font-weight-bold">{{ occurrence.title || '托福單字' }}</span>
            </div>
            <div class="text-grey-4 q-mb-xs">
              {{ occurrence.phonetic }} {{ occurrence.partOfSpeech }}
            </div>
            <div class="text-white q-mb-xs">{{ occurrence.definition }}</div>
            <div class="text-grey-4">{{ occurrence.example }}</div>
            <q-separator v-if="index < currentOccurrences.length - 1" class="q-mt-md" />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="關閉" color="white" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DayContent } from '../types/vocabulary'

const loading = ref(true)
const error = ref('')
const toeflData = ref<DayContent[]>([])
const currentPage = ref(1)
const itemsPerPage = ref(30)

const itemsPerPageOptions = [
  { label: '30', value: 30 },
  { label: 'all', value: 0 }
]

// 彙整（去重）單字，計數與日期，並依出現次數排序
interface AggregatedWord {
  word: string
  partOfSpeech: string
  definition: string
  example: string
  phonetic?: string
  count: number
  dates: string[]
}

interface WordOccurrenceItem {
  index: number
  date: string
  title?: string | null | undefined
  partOfSpeech: string
  definition: string
  example: string
  phonetic?: string | undefined
}

const occurrenceDialog = ref(false)
const dialogWord = ref('')
const dialogWordLower = computed(() => dialogWord.value.toLowerCase())

const occurrencesByWord = computed<Record<string, WordOccurrenceItem[]>>(() => {
  const map: Record<string, WordOccurrenceItem[]> = {}
  toeflData.value.forEach(day => {
    day.words.forEach((w, idx) => {
      const key = w.word.toLowerCase()
      if (!map[key]) map[key] = []
      map[key].push({
        index: idx,
        date: day.date,
        title: day.article?.title ?? null,
        partOfSpeech: w.partOfSpeech,
        definition: w.definition,
        example: w.example,
        phonetic: w.phonetic
      })
    })
  })
  Object.keys(map).forEach(k => {
    const list = map[k] ?? []
    map[k] = list.sort((a, b) => {
      const ta = new Date(a.date.replace(/\//g, '-')).getTime()
      const tb = new Date(b.date.replace(/\//g, '-')).getTime()
      if (tb !== ta) return tb - ta
      return a.index - b.index
    })
  })
  return map
})

const currentOccurrences = computed<WordOccurrenceItem[]>(() => {
  const dict = occurrencesByWord.value
  const key = dialogWordLower.value
  return (dict && key && dict[key]) ? dict[key] : []
})

function openOccurrences(word: string) {
  dialogWord.value = word
  occurrenceDialog.value = true
}

const aggregatedWords = computed<AggregatedWord[]>(() => {
  const map = new Map<string, AggregatedWord>()
  toeflData.value.forEach(day => {
    day.words.forEach(w => {
      const key = w.word.toLowerCase()
      const existing = map.get(key)
      if (!existing) {
        const aggregated: AggregatedWord = {
          word: w.word,
          partOfSpeech: w.partOfSpeech,
          definition: w.definition,
          example: w.example,
          count: 1,
          dates: [day.date]
        }
        if (w.phonetic) {
          aggregated.phonetic = w.phonetic
        }
        map.set(key, aggregated)
      } else {
        existing.count += 1
        if (!existing.dates.includes(day.date)) existing.dates.push(day.date)
      }
    })
  })

  return Array.from(map.values()).sort((a, b) => b.count - a.count)
})

// 計算總單字數（以去重後為準）
const totalWords = computed(() => aggregatedWords.value.length)

// 計算總頁數
const totalPages = computed(() => {
  const pageSize = itemsPerPage.value === 0 ? Math.max(1, totalWords.value) : itemsPerPage.value
  return Math.max(1, Math.ceil(totalWords.value / pageSize))
})

// 計算當前頁的單字（以去重後為準）
const paginatedWords = computed(() => {
  const pageSize = itemsPerPage.value === 0 ? totalWords.value : itemsPerPage.value
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return aggregatedWords.value.slice(start, end)
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
    toeflData.value = await response.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入資料時發生錯誤'
  } finally {
    loading.value = false
  }
}

// 播放發音
function playPronunciation(word: string) {
  if ('speechSynthesis' in window) {
    // 停止當前播放
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }
}

// 根據出現次數返回卡片顏色類別
function getCardColorClass(count: number): string {
  // 出現次數映射到 10 種顏色，次數越多顏色越深
  if (count === 1) return 'card-count-1'
  if (count === 2) return 'card-count-2'
  if (count === 3) return 'card-count-3'
  if (count === 4) return 'card-count-4'
  if (count === 5) return 'card-count-5'
  if (count === 6) return 'card-count-6'
  if (count === 7) return 'card-count-7'
  if (count === 8) return 'card-count-8'
  if (count === 9) return 'card-count-9'
  return 'card-count-10' // 10 次以上
}

// 根據出現次數返回加號按鈕顏色類別
function getPlusButtonClass(count: number): string {
  // 藍色→黃色→紅色漸進
  if (count === 2) return 'plus-btn-2'
  if (count === 3) return 'plus-btn-3'
  if (count === 4) return 'plus-btn-4'
  if (count === 5) return 'plus-btn-5'
  if (count === 6) return 'plus-btn-6'
  if (count === 7) return 'plus-btn-7'
  if (count === 8) return 'plus-btn-8'
  if (count === 9) return 'plus-btn-9'
  return 'plus-btn-10' // 10 次以上
}

// 根據出現次數返回 badge 顏色類別
function getBadgeColorClass(count: number): string {
  if (count === 1) return 'badge-count-1'
  if (count === 2) return 'badge-count-2'
  if (count === 3) return 'badge-count-3'
  if (count === 4) return 'badge-count-4'
  if (count === 5) return 'badge-count-5'
  if (count === 6) return 'badge-count-6'
  if (count === 7) return 'badge-count-7'
  if (count === 8) return 'badge-count-8'
  if (count === 9) return 'badge-count-9'
  return 'badge-count-10' // 10 次以上
}

// 根據出現次數返回單字顏色類別
function getWordColorClass(count: number): string {
  if (count === 1) return 'word-count-1'
  if (count === 2) return 'word-count-2'
  if (count === 3) return 'word-count-3'
  if (count === 4) return 'word-count-4'
  if (count === 5) return 'word-count-5'
  if (count === 6) return 'word-count-6'
  if (count === 7) return 'word-count-7'
  if (count === 8) return 'word-count-8'
  if (count === 9) return 'word-count-9'
  return 'word-count-10' // 10 次以上
}

// 分頁事件處理
function onPageChange(page: number) {
  currentPage.value = page
  // 滾動到頂部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onItemsPerPageChange() {
  currentPage.value = 1
}

onMounted(() => {
  void loadVocabularyData()
})
</script>

<style scoped>
.items-per-page-select {
  min-width: 80px
}

.vocab-card {
  transition: transform 0.2s ease-in-out, background-color 0.3s ease;
}

.vocab-card:hover {
  transform: translateY(-2px)
}

/* 出現次數對應的卡片背景顏色 - 深色藍色系漸進 */
.card-count-1 {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.card-count-2 {
  background: linear-gradient(135deg, #1e3a5f 0%, #2c4f7c 100%);
}

.card-count-3 {
  background: linear-gradient(135deg, #1a4d7a 0%, #1e5a8f 100%);
}

.card-count-4 {
  background: linear-gradient(135deg, #1565a0 0%, #1976d2 100%);
}

.card-count-5 {
  background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
}

.card-count-6 {
  background: linear-gradient(135deg, #1565c0 0%, #1e88e5 100%);
}

.card-count-7 {
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
}

.card-count-8 {
  background: linear-gradient(135deg, #0a3d91 0%, #0d47a1 100%);
}

.card-count-9 {
  background: linear-gradient(135deg, #073575 0%, #0a3d91 100%);
}

.card-count-10 {
  background: linear-gradient(135deg, #052a5c 0%, #073575 100%);
  box-shadow: 0 4px 12px rgba(5, 42, 92, 0.5);
}

/* 加號按鈕顏色 - 藍色→黃色→紅色漸進（3次開始黃） */
.plus-btn-2 {
  color: #42a5f5 !important;
}

.plus-btn-3 {
  color: #fdd835 !important;
}

.plus-btn-4 {
  color: #ffeb3b !important;
}

.plus-btn-5 {
  color: #ffca28 !important;
}

.plus-btn-6 {
  color: #ffb300 !important;
}

.plus-btn-7 {
  color: #ffa726 !important;
}

.plus-btn-8 {
  color: #ff7043 !important;
}

.plus-btn-9 {
  color: #f4511e !important;
}

.plus-btn-10 {
  color: #d32f2f !important;
}

/* Badge 顏色 - 與加號按鈕同色 */
.badge-count-1 {
  color: #90caf9 !important;
  border-color: #90caf9 !important;
}

.badge-count-2 {
  color: #42a5f5 !important;
  border-color: #42a5f5 !important;
}

.badge-count-3 {
  color: #fdd835 !important;
  border-color: #fdd835 !important;
}

.badge-count-4 {
  color: #ffeb3b !important;
  border-color: #ffeb3b !important;
}

.badge-count-5 {
  color: #ffca28 !important;
  border-color: #ffca28 !important;
}

.badge-count-6 {
  color: #ffb300 !important;
  border-color: #ffb300 !important;
}

.badge-count-7 {
  color: #ffa726 !important;
  border-color: #ffa726 !important;
}

.badge-count-8 {
  color: #ff7043 !important;
  border-color: #ff7043 !important;
}

.badge-count-9 {
  color: #f4511e !important;
  border-color: #f4511e !important;
}

.badge-count-10 {
  color: #d32f2f !important;
  border-color: #d32f2f !important;
}

/* 單字顏色 - 與 badge 和加號按鈕同色 */
.word-count-1 {
  color: #90caf9 !important;
}

.word-count-2 {
  color: #42a5f5 !important;
}

.word-count-3 {
  color: #fdd835 !important;
}

.word-count-4 {
  color: #ffeb3b !important;
}

.word-count-5 {
  color: #ffca28 !important;
}

.word-count-6 {
  color: #ffb300 !important;
}

.word-count-7 {
  color: #ffa726 !important;
}

.word-count-8 {
  color: #ff7043 !important;
}

.word-count-9 {
  color: #f4511e !important;
}

.word-count-10 {
  color: #d32f2f !important;
}

/* 出現明細 Dialog RWD 寬度 */
.dialog-card {
  width: 92vw;
  max-width: 900px;
}

@media (min-width: 900px) {
  .dialog-card {
    width: 700px;
  }
}
</style>
