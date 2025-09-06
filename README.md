# 英文單字書練習庫

一個基於 Quasar Framework 和 Vue 3 的英文單字學習網站，支援托福單字和一般單字的學習與測驗。

## 功能特色

- 🌙 **Dark Mode 設計** - 柔和的深色主題，保護眼睛
- 📱 **響應式設計** - 支援手機、平板、桌機
- 📚 **雙類別單字** - 托福單字和一般單字分類學習
- 📅 **按天數規劃** - 支援按天數瀏覽和學習
- 🎯 **互動測驗** - 選擇題測驗，即時評分
- 🔊 **發音功能** - 使用瀏覽器內建語音合成
- ⚡ **自動化建置** - 自動解析 Markdown 檔案生成 JSON

## 技術棧

- **前端框架**: Vue 3 + TypeScript
- **UI 框架**: Quasar Framework
- **樣式**: SCSS
- **建置工具**: Vite
- **程式碼規範**: ESLint

## 安裝與執行

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置生產版本
```bash
npm run build
```

### 程式碼檢查
```bash
npm run lint
```

## 專案結構

```
src/
├── components/          # 共用元件
├── css/                # 樣式檔案
│   ├── app.scss        # 全域樣式
│   └── theme.scss      # 主題樣式
├── layouts/            # 佈局元件
├── pages/              # 頁面元件
├── router/             # 路由配置
├── types/              # TypeScript 型別定義
└── App.vue             # 根元件

toefl/                  # 托福單字 Markdown 檔案
daily/                  # 一般單字 Markdown 檔案
scripts/                # 建置腳本
public/                 # 靜態資源 (JSON 檔案會自動生成)
```

## 單字檔案格式

在 `toefl/` 和 `daily/` 資料夾中放置 Markdown 檔案，格式如下：

```markdown
| 單字        | 詞性  | 中文解釋               | 英文例句                                               |
| ----------- | ----- | ---------------------- | ------------------------------------------------------ |
| abandon     | v.    | 放棄                   | The ship was abandoned by its crew.                    |
| abase       | v.    | 降低 地位、職位、威望等 | He abased himself by admitting his error.              |
```

檔案命名格式：`01-day_01.md`、`02-day_02.md` 等

## 建置流程

1. 執行 `npm run build` 時會自動：
   - 執行 `prebuild` 腳本解析 Markdown 檔案
   - 生成 `public/toefl.json` 和 `public/daily.json`
   - 建置 Vue 應用程式

## 部署

### Vercel 部署

1. 將專案推送到 GitHub
2. 在 Vercel 中連接 GitHub 倉庫
3. 設定 Build Command: `npm run build`
4. 部署完成

## 頁面路由

- `/` - 首頁（隨機單字輪播 + 功能卡片）
- `/toefl` - 全部托福單字
- `/toefl/by-day` - 按天數瀏覽托福單字
- `/toefl/day/:day` - 指定天數的托福單字
- `/daily` - 全部一般單字
- `/daily/by-day` - 按天數瀏覽一般單字
- `/daily/day/:day` - 指定天數的一般單字
- `/quiz-toefl` - 托福單字測驗
- `/quiz-daily` - 一般單字測驗

## 開發規範

- 使用 TypeScript 進行型別檢查
- 遵循 ESLint 規則
- 使用單引號、2 個空白縮排
- 不允許 console.log
- 結尾不使用分號
- 空白行不超過 1 行

## 授權

MIT License
