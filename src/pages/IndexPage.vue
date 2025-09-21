<template>
  <q-page class="q-pa-md" style="min-height: 100vh;">

    <!-- 隨機單字輪播區塊 -->
    <div class="q-mb-lg">
      <div class="text-center q-mb-md">
        <h2 class="text-h5 text-dark-text q-mb-sm font-weight-bold">每日推薦單字</h2>
        <q-btn-toggle
          v-model="selectedVocabularyType"
          :options="vocabularyTypeOptions"
          color="primary"
          text-color="white"
          toggle-color="white"
          toggle-text-color="primary"
          class="q-mb-md"
          rounded
        />
      </div>

      <div class="row justify-center q-px-md">
        <div class="col-12 col-md-8 col-lg-6">
          <q-card class="vocab-card q-pa-lg bg-dark-card">
            <q-carousel
              v-model="currentWordIndex"
              animated
              infinite
              autoplay
              :autoplay-interval="3000"
              height="250px"
              class="rounded-borders"
              dark
            >
              <q-carousel-slide
                v-for="(word, index) in randomWords"
                :key="index"
                :name="index"
                class="column no-wrap flex-center"
              >
                <div class="text-center full-width">
                  <div class="text-h4 text-primary q-mb-md font-weight-bold">
                    {{ word.word }}
                  </div>
                  <div class="text-subtitle1 text-dark-text-secondary q-mb-md">
                    {{ word.partOfSpeech }}
                  </div>
                  <div class="text-h6 text-dark-text q-mb-md">
                    {{ word.definition }}
                  </div>
                  <div class="text-body1 text-dark-text-secondary">
                    {{ word.example }}
                  </div>
                </div>
              </q-carousel-slide>
            </q-carousel>
          </q-card>
        </div>
      </div>
    </div>

    <!-- 功能卡片區塊 -->
    <div class="vocab-grid">
      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/toefl/by-day')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="calendar_today" size="48px" color="secondary" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">每日閱讀 (托福)</div>
            <div class="text-body1 text-dark-text-secondary">
              每日托福閱讀文章，循序漸進學習
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/daily/by-day')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="event" size="48px" color="info" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">每日閱讀 (一般)</div>
            <div class="text-body1 text-dark-text-secondary">
              每日一般閱讀文章，持續累積單字
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/toefl')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="school" size="48px" color="primary" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">全部托福單字</div>
            <div class="text-body1 text-dark-text-secondary">
              瀏覽所有托福單字，系統化學習
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/daily')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="book" size="48px" color="accent" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">全部一般單字</div>
            <div class="text-body1 text-dark-text-secondary">
              瀏覽所有一般單字，擴充詞彙量
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/quiz-toefl')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="quiz" size="48px" color="positive" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">托福單字測驗</div>
            <div class="text-body1 text-dark-text-secondary">
              測試托福單字掌握程度
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="vocab-card-wrapper">
        <q-card
          class="vocab-card cursor-pointer"
          @click="$router.push('/quiz-daily')"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="assignment" size="48px" color="warning" class="q-mb-md" />
            <div class="text-h6 text-dark-text q-mb-sm font-weight-bold">一般單字測驗</div>
            <div class="text-body1 text-dark-text-secondary">
              測試一般單字掌握程度
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Word, DayVocabulary } from '../types/vocabulary'

const selectedVocabularyType = ref<'toefl' | 'daily'>('toefl')
const currentWordIndex = ref(0)
const toeflData = ref<DayVocabulary[]>([])
const dailyData = ref<DayVocabulary[]>([])

const vocabularyTypeOptions = [
  { label: '托福單字', value: 'toefl' },
  { label: '一般單字', value: 'daily' }
]

// 計算隨機單字
const randomWords = computed(() => {
  const data = selectedVocabularyType.value === 'toefl' ? toeflData.value : dailyData.value
  const allWords: Word[] = []

  data.forEach(day => {
    allWords.push(...day.words)
  })

  // 隨機選取 5 個單字
  const shuffled = allWords.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 5)
})

// 載入單字資料
async function loadVocabularyData() {
  try {
    const [toeflResponse, dailyResponse] = await Promise.all([
      fetch('/toefl.json'),
      fetch('/daily.json')
    ])

    if (toeflResponse.ok) {
      toeflData.value = await toeflResponse.json()
    }

    if (dailyResponse.ok) {
      dailyData.value = await dailyResponse.json()
    }
  } catch {
    // 載入單字資料失敗
  }
}

onMounted(() => {
  void loadVocabularyData()
})
</script>
