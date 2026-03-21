# slaide 技術設計ドキュメント

このドキュメントは slaide の「どう作るか」を定義する。

---

## アーキテクチャ全体像

```
[自然言語]
    ↓  Claude Code（AGENTS.md に従って）
[main.astro] + [_slides/*.astro] + [コンポーネント群]
    ↓
[Astro Build]
    ↓
[dist/<deck>/main.html（中間成果物）]
    ↓                    ↓                          ↓
[build-png.mjs]      [build-pdf.mjs]            [build-html.mjs]
    ↓                    ↓                          ↓
[Playwright]         [Playwright]               [HTML後処理 + Presenter注入]
    ↓                    ↓                          ↓
[PNG（LLM確認用）]   [ベクター PDF]             [スタンドアロン HTML]
```

### 3つの出力形式

| コマンド | 出力 | 対象 | 用途 |
|---------|------|------|------|
| `build:png` | スライドごとの PNG（ラスター） | LLM | 品質チェック。Claude Code が画像を直接見て判断する |
| `build:pdf` | ベクター PDF | 人間 | 配布、印刷、メール添付。テキスト選択・リンク有効 |
| `build:html` | スタンドアロン HTML | 人間 | ブラウザでプレゼンテーション |

---

## プロジェクト構造

1 repo N decks。`src/pages/` 配下のディレクトリが1つのデッキに対応する。

```
my-slides/
├── package.json                ← astro / playwright
├── astro.config.mjs
├── tsconfig.json
├── AGENTS.md                   ← プロジェクトルートの指示書
│
├── scripts/
│   ├── build-png.mjs           ← Playwright → PNG（LLM 品質チェック用）
│   ├── build-pdf.mjs           ← Playwright page.pdf() → ベクター PDF
│   ├── build-html.mjs          ← main.html 後処理 + Presenter ランタイム注入
│   └── lib/
│       └── deck-utils.mjs      ← --deck 引数パース（省略時は全デッキ）
│
└── src/
    ├── layouts/
    │   └── SlideLayout.astro   ← 固定枠 + デザインシステム（全デッキ共通）
    ├── components/             ← LLM が作る共有コンポーネント
    ├── presenter/              ← Presenter ランタイム（build-html.mjs が注入）
    │   ├── presenter.js        ← キーボード制御、状態管理
    │   └── transitions.css     ← トランジション定義
    └── pages/
        ├── _AGENTS.md          ← スライドの書き方ガイド（sample/ は編集禁止）
        ├── sample/             ← 参照用サンプルデッキ（読み取り専用）
        │   ├── main.astro
        │   └── _slides/
        └── your-deck/          ← 実際のデッキはここに作る
            ├── main.astro
            └── _slides/
```

### `_` prefix について

Astro は `src/pages/` 内のファイルをすべてルーティング対象にする。`_` prefix のファイル/ディレクトリは除外される（Astro の公式仕様）。スライドコンポーネントは個別ページではなく main.astro から import される部品なので `_slides/` に置く。`_AGENTS.md` も同様に `_` prefix で除外している。

---

## SlideLayout.astro

### 2つの役割

**1. 固定枠の提供（構造的。壊してはいけない）**
- 固定サイズ + overflow: hidden
- ヘッダー/フッター/コンテンツの slot 構造
- アスペクト比の切替

**2. トンマナの定義（プロジェクトごとにカスタマイズする）**
- カラーパレット（CSS custom properties）
- フォント設定
- 余白・スペーシングの値

トンマナの上書きは main.astro の `<style is:global>` で CSS custom properties を再定義するだけ。

### Props

```ts
interface Props {
  title?: string;
  theme?: 'light' | 'dark';
  aspectRatio?: '16:9' | '4:3' | 'A4' | 'A4-landscape';
  showHeader?: boolean;
  showFooter?: boolean;
  pageNumber?: number;
  transition?: string;
  notes?: string;
  class?: string;
}
```

### アスペクト比とサイズ

| プリセット | 幅 | 高さ | 用途 |
|-----------|------|------|------|
| 16:9 | 1920px | 1080px | 標準プレゼン（デフォルト） |
| 4:3 | 1440px | 1080px | レガシー |
| A4 | 794px | 1123px | 印刷用ドキュメント |
| A4-landscape | 1123px | 794px | 印刷用横向き |

### CSS Custom Properties

**タイポグラフィ:** `--font-size-title` (64px), `--font-size-heading` (40px), `--font-size-body` (24px), `--font-size-caption` (16px), `--font-family-sans`, `--font-family-mono`

**カラー:** `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text`, `--color-muted`, `--color-border`, `--color-chart-1` 〜 `--color-chart-6`

**スペーシング:** `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (32px), `--space-xl` (64px)

**レイアウト:** `--slide-width`, `--slide-height`, `--content-padding`

---

## main.astro による順序管理

スライド順序の唯一の真実は `src/pages/<deck-name>/main.astro` に置く。

```astro
---
import Title from './_slides/Title.astro';
import Agenda from './_slides/Agenda.astro';
import Closing from './_slides/Closing.astro';
---

<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Presentation Title</title>
  <style is:global>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  </style>
</head>
<body>
  <Title />
  <Agenda />
  <Closing />
</body>
</html>
```

---

## Presenter ランタイム

### 設計思想

`build:html` が出力するスタンドアロン HTML は**プレゼンテーションソフト**である。ブラウザで開くだけで、キーボード操作でスライドを進め、トランジションアニメーション付きでプレゼンできる。

**PresenterLayout.astro は使わない。** `build-html.mjs` が Astro ビルド済み HTML を後処理し、Presenter の JS/CSS を注入する。これにより `build:pdf` / `build:png` は Presenter なしの素の HTML を使い、`build:html` だけが Presenter 付きの HTML を生成する。

### presenter.js

JS は最小限。**イベントハンドリングと状態管理だけ**:
- キーボード操作（←→、スペース、f でフルスクリーン、p でノート表示）
- クリックナビゲーション（左 20% = 前、右 80% = 次）
- タッチスワイプ
- プログレスバー更新
- スライドカウンター更新
- スピーカーノート表示

### transitions.css

- Fade: opacity トランジション（デフォルト）
- スライド表示/非表示: `[data-slide]` に `position: absolute; inset: 0; opacity: 0`、`.active` で `opacity: 1`
- プログレスバー: `position: fixed; bottom: 0`
- スピーカーノート: `position: fixed; bottom: 0` + `transform: translateY(100%)` で隠す、`p` キーで表示

---

## ビルドスクリプト

### 引数の仕様（共通）

`--deck <name>` で単一デッキ。省略時は `dist/` 内の `main.html` を持つ全ディレクトリを自動処理。

```bash
npm run build:pdf              # 全デッキ
npm run build:pdf -- --deck sample  # 特定デッキのみ
```

### build-png.mjs（LLM 品質チェック用）

```
1. Astro ビルド済み dist/<deck>/main.html を Playwright で開く
2. [data-slide] 要素を列挙
3. 各スライド要素を slide.screenshot() で PNG 生成（ラスター）
4. dist/<deck>/png/01.png, 02.png, ... に出力
```

PNG はラスターだが、LLM の視覚確認が目的なので 1920x1080 で十分。

### build-pdf.mjs（ベクター PDF）

```
1. Astro ビルド済み dist/<deck>/main.html を Playwright で開く
2. フォント読み込み完了を待機
3. print CSS を注入:
   - @page { size: slide-width slide-height; margin: 0; }
   - [data-slide] に break-after: page
4. page.pdf() で Chromium の印刷機能を使いベクター PDF を生成
5. dist/<deck>.pdf に出力
```

`page.pdf()` を使うことで:
- **テキストが選択可能**（ラスター化しない）
- **リンクが生きている**（`<a href>` → PDF アクション）
- pdf-lib 等の外部ライブラリ不要

### build-html.mjs（スタンドアロン HTML）

```
1. Astro ビルド済み dist/<deck>/main.html を読み込む
2. <body> 内容と <style> タグを抽出
3. <link rel="stylesheet"> の外部 CSS ファイルを読み込んでインライン化
   （Astro は CSS を dist/_astro/*.css に書き出すため）
4. presenter-viewport + slide-scaler で wrap
5. presenter.js と transitions.css を注入
6. scaleToFit(): translate + scale で正確なセンタリング
   （flexbox による centering は viewport より広い要素で右ズレが起きるため使わない）
7. ローカル画像を Base64 インライン化
8. dist/<deck>.html にスタンドアロン HTML として出力
```

#### viewport スケーリングの実装

```js
const scale = Math.min(vw / sw, vh / sh);
const offsetX = (vw - sw * scale) / 2;
const offsetY = (vh - sh * scale) / 2;
scaler.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
```

`.slide-scaler` は `position: absolute; top: 0; left: 0; transform-origin: top left` で配置。flexbox centering は使わない（overflow 時に右ズレが発生するため）。

---

## パフォーマンス考慮事項

### HTML ファイルサイズ

- フォント: woff2 サブセット化で Noto Sans JP は 1〜2MB
- 画像: 元画像のサイズに依存
- ランタイム JS: 5KB 以下を目標
- 目標: フォント込みで 5MB 以下

---

## 未解決の技術的課題

1. **フォント読み込みタイミング**: PDF 出力時にカスタムフォント（Google Fonts 等）が確実に読み込まれるか。`document.fonts.ready` で待機しているが、CDN からのフォントは networkidle 後も遅れることがある
2. **デッキメタデータの置き場**: 将来ビルド専用メタデータが必要になった場合、frontmatter と別ファイルのどちらを採用するか
