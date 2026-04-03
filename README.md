# CoreWebVitals-checker

Playwright + web-vitals を使った、本番サイト向けの Core Web Vitals 定点観測ツール。

サイト定義JSONを切り替えることで、どのサイトでも計測できる汎用ツールです。

## 計測指標

| 指標 | 計測方法 | Good基準 |
|---|---|---|
| CLS (Cumulative Layout Shift) | web-vitals + 全ページスクロール | < 0.1 |
| LCP (Largest Contentful Paint) | PerformanceObserver | < 2500ms |

## 計測デバイス

Mobile / Tablet / Desktop の3デバイスで計測します。

| デバイス | ビューポート | UA |
|---|---|---|
| Mobile | 390 × 844 | iPhone (iOS 17) |
| Tablet | 768 × 1024 | iPad (iOS 17) |
| Desktop | 1280 × 720 | デスクトップ |

すべて Chromium で実行されます。

## セットアップ

```bash
npm install
npx playwright install chromium
```

### サイト設定の初期化

対話形式で `sites/default.json` を作成できます。各項目で Enter を押すとデフォルト値が使われます。

```bash
make init
```

作成後、ページの追加や変更は `sites/default.json` を直接編集してください。

## 使い方

### 計測を実行

```bash
npm run monitor
```

実行すると以下が出力されます:

- ターミナルにサマリーテーブル
- `reports/{サイト名}_{日時}.json` - データ蓄積用
- `reports/{サイト名}_{日時}.html` - ブラウザで見るレポート

### レポートを確認

```bash
# 最新のJSONからターミナル表示 + HTML再生成
npm run report

# HTMLをブラウザで開く
npm run report:open
```

## サイト設定

`sites/` ディレクトリにJSONファイルを作成します。

```json
{
  "name": "example-site",
  "baseUrl": "https://example.com",
  "pages": [
    { "name": "トップ", "path": "/" },
    { "name": "一覧", "path": "/articles" },
    { "name": "詳細", "path": "/articles/123" }
  ],
  "thresholds": {
    "CLS": 0.1,
    "LCP": 2500
  }
}
```

### 別サイトを計測する

```bash
SITE_CONFIG=sites/other-site.json npm run monitor
```

環境変数 `SITE_CONFIG` を指定しない場合、デフォルトで `sites/default.json` を読み込みます。`.env` ファイルでも設定できます（`.env.example` を参照）。

## 出力例

### ターミナル

```
━━━ CWV Monitor: example-site ━━━
URL: https://example.com
Date: 2026/4/3 13:32:11
Thresholds: CLS < 0.1 | LCP < 2500ms

▶ Mobile
Page                 | CLS          | LCP          | Status
────────────────────────────────────────────────────────────
トップ                  | 0.0012       | 432ms        | ✅
記事詳細                 | 0.1399       | 1180ms       | ⚠️

▶ Tablet
Page                 | CLS          | LCP          | Status
────────────────────────────────────────────────────────────
トップ                  | 0.0008       | 510ms        | ✅
記事詳細                 | 0.0921       | 980ms        | ✅

▶ Desktop
Page                 | CLS          | LCP          | Status
────────────────────────────────────────────────────────────
トップ                  | 0.0003       | 320ms        | ✅
記事詳細                 | 0.0450       | 850ms        | ✅

Result: 5/6 pages passed all thresholds
```

### HTML

ブラウザで確認できる色分け付きのレポートが `reports/` に出力されます。
