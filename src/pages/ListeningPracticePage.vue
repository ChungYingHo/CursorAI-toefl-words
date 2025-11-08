<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <h1 class="text-h4 text-dark-text q-mb-sm font-weight-bold">
        英聽練習
      </h1>
      <div class="text-dark-text-secondary">
        依照每日更新的主題練習聽力，點擊卡片即可觀看影片。
      </div>
    </div>

    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-dark-text-secondary q-mt-md">載入中...</div>
    </div>

    <div v-else-if="error" class="text-center q-pa-xl">
      <q-icon name="error_outline" size="48px" color="negative" />
      <div class="text-subtitle1 text-dark-text q-mt-md">{{ error }}</div>
    </div>

    <div v-else-if="!listeningItems.length" class="text-center q-pa-xl text-dark-text-secondary">
      目前尚未加入英聽資料，請稍後再試。
    </div>

    <div v-else>
      <div class="vocab-grid">
        <div
          v-for="item in listeningItems"
          :key="`${item.date}-${item.topic}`"
          class="vocab-card-wrapper"
        >
          <q-card
            class="vocab-card listening-card"
            clickable
            @click="openDialog(item)"
          >
            <q-card-section class="q-pa-md">
              <div class="text-caption text-dark-text-secondary q-mb-xs">
                {{ item.date }}
              </div>
              <div class="text-h6 text-dark-text font-weight-bold q-mb-sm">
                {{ item.topic }}
              </div>
              <div class="text-dark-text-secondary">
                點擊播放影片
                <q-icon name="play_circle_outline" size="20px" class="q-ml-xs" />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <q-dialog
      v-model="dialogOpen"
      transition-show="scale"
      transition-hide="scale"
      @hide="onDialogHide"
    >
      <q-card class="bg-grey-9 text-white listening-dialog">
        <q-btn
          flat
          dense
          round
          icon="close"
          color="white"
          class="dialog-close-btn"
          @click="closeDialog"
        />

        <q-card-section class="q-pa-md dialog-header">
          <div class="text-h6 text-white q-mb-xs">{{ dialogTopic }}</div>
          <div class="text-caption text-grey-4">
            {{ dialogDate }}
          </div>
        </q-card-section>

        <q-separator dark inset />

        <q-card-section class="q-pa-none">
          <div class="video-wrapper">
            <iframe
              v-if="embedUrl"
              :key="embedUrl"
              :src="embedUrl"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            />
            <div v-else class="video-fallback text-grey-5">
              無法載入影片連結，請改用 YouTube 開啟。
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            color="primary"
            icon="open_in_new"
            label="在 YouTube 開啟"
            :href="dialogLink"
            target="_blank"
            rel="noopener"
            :disable="!dialogLink"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface ListeningItem {
  date: string
  topic: string
  link: string
  embedUrl: string
}

const loading = ref(true)
const listeningItems = ref<ListeningItem[]>([])
const error = ref('')

function parseListeningMarkdown(markdown: string): ListeningItem[] {
  const lines = markdown
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && !line.startsWith('| Date'))

  // 移除分隔線
  const dataLines = lines.filter(line => !line.startsWith('|----------'))

  const items: ListeningItem[] = []

  dataLines.forEach(line => {
    const columns = line
      .split('|')
      .map(col => col.trim())
      .filter(Boolean)

    if (columns.length < 3) {
      return
    }

    const date = columns[0]
    const topic = columns[1]
    const link = columns[2]

    if (!date || !topic || !link) {
      return
    }

    const embedUrl = toEmbedUrl(link)

    items.push({
      date,
      topic,
      link,
      embedUrl
    })
  })

  return items.sort((a, b) => {
    const aDate = new Date(a.date.replace(/\//g, '-')).getTime()
    const bDate = new Date(b.date.replace(/\//g, '-')).getTime()
    return bDate - aDate
  })
}

function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '')
      const embed = new URL(`https://www.youtube.com/embed/${videoId}`)
      const start = extractStartSeconds(parsed.searchParams)
      if (start) {
        embed.searchParams.set('start', start.toString())
      }
      embed.searchParams.set('rel', '0')
      return embed.toString()
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v')
        if (videoId) {
          const embed = new URL(`https://www.youtube.com/embed/${videoId}`)
          const start = extractStartSeconds(parsed.searchParams)
          if (start) {
            embed.searchParams.set('start', start.toString())
          }
          embed.searchParams.set('rel', '0')
          return embed.toString()
        }
      } else if (parsed.pathname.startsWith('/embed/')) {
        const embed = new URL(url)
        embed.searchParams.set('rel', '0')
        return embed.toString()
      }
    }

    return url
  } catch {
    return url
  }
}

function extractStartSeconds(params: URLSearchParams): number | null {
  const start = params.get('start') || params.get('t')
  if (!start) {
    return null
  }

  if (/^\d+$/.test(start)) {
    return Number(start)
  }

  const match = start.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
  if (!match) {
    return null
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)

  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  return totalSeconds > 0 ? totalSeconds : null
}

const dialogOpen = ref(false)
const selectedItem = ref<ListeningItem | null>(null)

const embedUrl = computed(() => {
  if (!selectedItem.value) {
    return ''
  }
  return selectedItem.value.embedUrl
})

const dialogTopic = computed(() => selectedItem.value?.topic ?? '')
const dialogDate = computed(() => selectedItem.value?.date ?? '')
const dialogLink = computed(() => selectedItem.value?.link ?? '')

function openDialog(item: ListeningItem) {
  selectedItem.value = item
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
}

function onDialogHide() {
  selectedItem.value = null
}

onMounted(async () => {
  try {
    const listeningMarkdownUrl = new URL('../../listening/listening.md', import.meta.url)
    const response = await fetch(listeningMarkdownUrl.toString())
    if (!response.ok) {
      throw new Error('載入英聽資料失敗')
    }
    const markdown = await response.text()
    listeningItems.value = parseListeningMarkdown(markdown)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入英聽資料時發生錯誤'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.listening-card {
  cursor: pointer;
}

.listening-card .text-h6 {
  line-height: 1.4;
}

.listening-dialog {
  width: 90vw;
  max-width: 720px;
  position: relative;
}

.dialog-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.dialog-header {
  padding-right: 52px;
}

.video-wrapper {
  position: relative;
  padding-top: 56.25%;
  background: #000;
}

.video-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.video-fallback {
  padding: 24px;
  text-align: center;
}

@media (max-width: 599px) {
  .listening-dialog {
    width: 95vw;
    max-width: none;
  }

  .dialog-close-btn {
    top: 8px;
    right: 8px;
  }
}
</style>

