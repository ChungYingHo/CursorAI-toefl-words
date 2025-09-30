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
          <q-card class="vocab-card h-full">
            <q-card-section class="q-pa-md d-flex flex-column h-full">
              <div class="row items-start justify-between q-mb-sm">
                <div class="text-h5 text-primary font-weight-bold">
                  {{ word.word }}
                  <q-badge color="primary" class="q-ml-sm" outline>
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
                    color="primary"
                    icon="add"
                    class="q-ml-xs"
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
          <div v-if="currentOccurrences.length">
            <div
              v-for="item in currentOccurrences"
              :key="item.date + '-' + item.index"
              class="q-py-sm q-mb-sm"
            >
              <div class="text-subtitle2 text-white">{{ item.date }} <span v-if="item.title" class="text-grey-4">- {{ item.title }}</span></div>
              <div v-if="item.phonetic" class="text-caption text-grey-4 q-mt-xs">{{ item.phonetic }}</div>
              <div class="text-body1 text-white q-mt-xs">{{ item.definition }} {{ item.partOfSpeech }}</div>
              <div v-if="item.example" class="text-body2 text-grey-4 q-mt-xs">{{ item.example }}</div>
              <q-separator class="q-mt-sm" />
            </div>
          </div>
          <div v-else class="text-body1 text-grey-4">無明細</div>
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
  transition: transform 0.2s ease-in-out
}

.vocab-card:hover {
  transform: translateY(-2px)
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
