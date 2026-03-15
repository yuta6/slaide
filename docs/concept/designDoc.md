# slaide 技術設計ドキュメント

## 概要

このドキュメントは slaide の技術的な設計を記述する。instruction.md がプロジェクトの「何を作るか」を定義するのに対し、このドキュメントは「どう作るか」を定義する。

---

## アーキテクチャ全体像

```
[自然言語]
    ↓  Claude Code（AGENTS.md に従って）
[main.astro] + [slides/*.astro] + [コンポーネント群]
    ↓
[Astro Build]
    ↓
[静的 HTML（1デッキ = 1ページ、各スライドは同一HTML内）]
    ↓                    ↓                          ↓
[build-png.mjs]      [build-pdf.mjs]            [build-html.mjs]
    ↓                    ↓                          ↓
[Playwright]         [Playwright]               [HTML後処理 + Presenter注入]
    ↓                    ↓                          ↓
[PNG（LLM確認用）]   [PDF（配布・印刷用）]       [スタンドアロン HTML（プレゼン用）]
```

### 3つの出力形式

| コマンド | 出力 | 対象 | 用途 |
|---------|------|------|------|
| `build:png` | スライドごとの PNG | LLM | 品質チェック。Claude Code が画像を直接見て判断する |
| `build:pdf` | 1つの PDF | 人間 | 配布、印刷、メール添付 |
| `build:html` | スタンドアロン HTML | 人間 | ブラウザでプレゼンテーション |

---

## モジュール構成

```
slaide/
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
│
├── src/
│   ├── layouts/
│   │   └── SlideLayout.astro       # 固定枠 + デザインシステム
│   ├── components/                  # LLM が生成
│   ├── pages/                       # LLM が生成（デッキ本体）
│   └── presenter/                   # プレゼンテーションランタイム
│       ├── PresenterLayout.astro    # Presenterの外枠（build:html 用）
│       ├── components/
│       │   ├── Navigation.astro     # ← → ボタン、クリック領域
│       │   ├── ProgressBar.astro    # プログレスバー
│       │   ├── SlideCounter.astro   # 「3 / 12」表示
│       │   └── PresenterNotes.astro # スピーカーノート
│       ├── presenter.ts             # 最小限のJS（キーボード制御、状態管理）
│       ├── transitions.css          # トランジション定義
│       └── AGENTS.md                # カスタマイズガイド
│
├── scripts/
│   ├── build-png.mjs               # Playwright → PNG（LLM 確認用）
│   ├── build-pdf.mjs               # Playwright → PDF パイプライン
│   └── build-html.mjs              # main.html 後処理 + Presenterランタイム注入
│
└── assets/
    └── fonts/
```

---

## SlideLayout.astro 実装設計

以下の `aspectRatio` と `SIZES` は**あくまで一例**。プロジェクトに合わせて変更してよい。
ただし、固定枠・`overflow: hidden`・header/main/footer の基本構造は slaide の前提なので維持する。

### コア構造

```astro
---
interface Props {
  frontmatter?: Record<string, any>;
  title?: string;
  theme?: 'light' | 'dark';
  aspectRatio?: '16:9' | '4:3' | 'A4' | 'A4-landscape' | 'poster';
  showHeader?: boolean;
  showFooter?: boolean;
  pageNumber?: number;
  className?: string;
}

const SIZES = {
  '16:9':         { width: 1920, height: 1080 },
  '4:3':          { width: 1440, height: 1080 },
  'A4':           { width: 794,  height: 1123 },
  'A4-landscape': { width: 1123, height: 794  },
  'poster':       { width: 3840, height: 2160 },
};
const DEFAULT_ASPECT_RATIO = '16:9';

// frontmatter > 個別Props > デフォルト のフォールバック
const fm = Astro.props.frontmatter ?? {};
const theme = fm.theme ?? Astro.props.theme ?? 'light';
const aspectRatio = Astro.props.aspectRatio ?? DEFAULT_ASPECT_RATIO;
const size = SIZES[aspectRatio];
const showHeader = fm.showHeader ?? Astro.props.showHeader ?? true;
const showFooter = fm.showFooter ?? Astro.props.showFooter ?? true;
const title = fm.title ?? Astro.props.title ?? '';
const pageNumber = Astro.props.pageNumber ?? null;
---

<div
  class:list={["slide-frame", theme, Astro.props.className]}
  style={`--slide-width: ${size.width}px; --slide-height: ${size.height}px;`}
  data-slide
  data-slide-transition={fm.transition ?? 'fade'}
  data-slide-notes={fm.notes ?? ''}
>
  {showHeader && (
    <header class="slide-header">
      <slot name="header">
        <span class="text-slide-caption text-muted">{title}</span>
      </slot>
    </header>
  )}

  <main class="slide-content">
    <slot />
  </main>

  {showFooter && (
    <footer class="slide-footer">
      <slot name="footer">
        {pageNumber && <span class="text-slide-caption text-muted">{pageNumber}</span>}
      </slot>
    </footer>
  )}
</div>

<style>
  .slide-frame {
    width: var(--slide-width);
    height: var(--slide-height);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* Light theme (default) */
  .slide-frame.light {
    --color-bg: #ffffff;
    --color-text: #1a1a2e;
    --color-muted: #6b7280;
    --color-border: #e5e7eb;
    --color-primary: #2563eb;
    --color-secondary: #7c3aed;
    --color-accent: #f59e0b;
    --color-chart-1: #2563eb;
    --color-chart-2: #7c3aed;
    --color-chart-3: #059669;
    --color-chart-4: #f59e0b;
    --color-chart-5: #ef4444;
    --color-chart-6: #8b5cf6;
    background: var(--color-bg);
    color: var(--color-text);
  }

  /* Dark theme */
  .slide-frame.dark {
    --color-bg: #0f172a;
    --color-text: #f1f5f9;
    --color-muted: #94a3b8;
    --color-border: #334155;
    --color-primary: #60a5fa;
    --color-secondary: #a78bfa;
    --color-accent: #fbbf24;
    --color-chart-1: #60a5fa;
    --color-chart-2: #a78bfa;
    --color-chart-3: #34d399;
    --color-chart-4: #fbbf24;
    --color-chart-5: #f87171;
    --color-chart-6: #c084fc;
    background: var(--color-bg);
    color: var(--color-text);
  }

  /* Typography scale */
  .slide-frame {
    --font-size-title: 64px;
    --font-size-heading: 40px;
    --font-size-body: 24px;
    --font-size-caption: 16px;
    --font-family-sans: 'Noto Sans JP', system-ui, sans-serif;
    --font-family-mono: 'JetBrains Mono', monospace;
    font-family: var(--font-family-sans);
  }

  /* Spacing scale */
  .slide-frame {
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 32px;
    --space-xl: 64px;
    --content-padding: 64px;
  }

  .slide-header {
    padding: var(--space-md) var(--content-padding);
    flex-shrink: 0;
  }

  .slide-content {
    flex: 1;
    padding: 0 var(--content-padding);
    overflow: hidden;
  }

  .slide-footer {
    padding: var(--space-md) var(--content-padding);
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
```

### デッキ設定の扱い

Phase 1 では `_deck.json` のようなデッキ単位のデフォルト設定ファイルは導入しない。

- LLM は `main.astro` にスライド順序を書き、各スライドコンポーネントに必要な設定を書く
- 共通の見た目は `SlideLayout.astro` のデフォルトに寄せる
- デッキ名や出力ファイル名はディレクトリ名から決める
- 将来、PDF author や HTML title などビルド専用メタデータが必要になった場合だけ、別ファイルを追加検討する

### main.astro による順序管理

スライド順序の唯一の真実は `src/pages/<deck-name>/main.astro` に置く。

```astro
---
import Title from './slides/Title.astro';
import Agenda from './slides/Agenda.astro';
import MarketOverview from './slides/MarketOverview.astro';
import Closing from './slides/Closing.astro';
---

<Title />
<Agenda />
<MarketOverview />
<Closing />
```

各スライドは `slides/` 配下の Astro コンポーネントとして分割する。挿入・並び替えは `main.astro` の import と JSX の順序変更だけで済む。

---

## Presenter ランタイム設計

### 設計思想

build:html が出力するスタンドアロン HTML は**プレゼンテーションソフト**である。
ブラウザで開くだけで、キーボード操作でスライドを進め、トランジションアニメーション付きでプレゼンできる。

**PresenterのUIパーツは Astro コンポーネントとして作る。** ナビゲーションボタン、プログレスバー、スライド番号表示等はすべて `.astro` ファイル。build:html 時に普通の HTML/CSS に展開されてワンファイルに結合される。

JS は最小限。キーボード制御と状態管理だけを `presenter.ts` に書く。UIの見た目はすべて Astro コンポーネント側の HTML + CSS が担当する。

React は使わない。Astro がビルド時に静的 HTML に展開するので、ランタイム JS が最小限で済む。スタンドアロン HTML として軽量。

### レイヤー構造

```
[PresenterLayout.astro]          ← ビューポート、スケーリング、ナビUI
  ├── Navigation.astro           ← ← → ボタン、クリック領域
  ├── ProgressBar.astro          ← 下部プログレスバー
  ├── SlideCounter.astro         ← 「3 / 12」
  ├── PresenterNotes.astro       ← スピーカーノート
  └── [各スライド]
        └── [SlideLayout.astro]  ← 固定枠、トンマナ
              └── コンテンツ
```

**PresenterLayout は build:html 時にだけ使う。** build:pdf / build:png では SlideLayout だけで十分。

### PresenterLayout.astro

```astro
---
// build:html.mjs がこのレイアウトでスライド群をラップする
interface Props {
  slides: { html: string; transition: string; notes: string }[];
  deckTitle?: string;
}
const { slides, deckTitle } = Astro.props;
---
<div class="presenter-viewport">
  <div class="slide-scaler">
    {slides.map((slide, i) => (
      <section
        data-slide
        data-slide-transition={slide.transition}
        data-slide-notes={slide.notes}
        class:list={[i === 0 && 'active']}
        set:html={slide.html}
      />
    ))}
  </div>

  <!-- Presenter UI コンポーネント -->
  <Navigation />
  <ProgressBar total={slides.length} />
  <SlideCounter total={slides.length} />
  <PresenterNotes />
</div>
```

### Presenter UI コンポーネント例

**Navigation.astro** — クリック領域 + ボタン:

```astro
<div class="nav-prev" data-nav="prev" aria-label="前のスライド"></div>
<div class="nav-next" data-nav="next" aria-label="次のスライド"></div>

<style>
  .nav-prev, .nav-next {
    position: fixed;
    top: 0;
    width: 15%;
    height: 100%;
    cursor: pointer;
    z-index: 100;
  }
  .nav-prev { left: 0; }
  .nav-next { right: 0; }
  .nav-prev:hover { background: linear-gradient(to right, rgba(0,0,0,0.05), transparent); }
  .nav-next:hover { background: linear-gradient(to left, rgba(0,0,0,0.05), transparent); }
</style>
```

**ProgressBar.astro:**

```astro
---
interface Props { total: number; }
---
<div class="presenter-progress" data-progress aria-label="スライド進捗">
  <div class="presenter-progress-bar"></div>
</div>

<style>
  .presenter-progress {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: transparent;
    z-index: 1000;
  }
  .presenter-progress-bar {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
    width: 0%;
  }
</style>
```

### src/presenter/presenter.ts

UIの見た目は Astro コンポーネントが担当するため、JS は**イベントハンドリングと状態管理だけ**:

```ts
class SlidePresenter {
  private current = 0;
  private slides: HTMLElement[];
  private transitions: Map<string, TransitionHandler>;

  constructor() {
    this.slides = Array.from(document.querySelectorAll('[data-slide]'));
    this.transitions = new Map([
      ['fade', new FadeTransition()],
      ['slide', new SlideTransition()],
      ['flip', new FlipTransition()],
      ['none', new NoneTransition()],
      // Claude Code がカスタムトランジションを追加可能
    ]);
    this.bindEvents();
    this.showSlide(0);
  }

  private bindEvents() {
    // キーボード
    document.addEventListener('keydown', (e) => {
      const actions: Record<string, () => void> = {
        'ArrowRight': () => this.next(),
        ' ':          () => this.next(),
        'ArrowLeft':  () => this.prev(),
        'f':          () => this.toggleFullscreen(),
        'p':          () => this.toggleNotes(),
      };
      actions[e.key]?.();
    });

    // クリックナビゲーション（Navigation.astro の要素）
    document.querySelector('[data-nav="prev"]')?.addEventListener('click', () => this.prev());
    document.querySelector('[data-nav="next"]')?.addEventListener('click', () => this.next());
  }

  private async showSlide(index: number, direction: 'next' | 'prev' = 'next') {
    const from = this.slides[this.current];
    const to = this.slides[index];
    const name = to.dataset.slideTransition ?? 'fade';
    const transition = this.transitions.get(name) ?? this.transitions.get('fade')!;

    await transition.execute(from, to, direction);
    this.current = index;
    this.updateProgress();
    this.updateNotes();
  }

  private updateProgress() {
    const bar = document.querySelector('.presenter-progress-bar') as HTMLElement;
    if (bar) bar.style.width = `${((this.current + 1) / this.slides.length) * 100}%`;

    const counter = document.querySelector('[data-slide-counter]');
    if (counter) counter.textContent = `${this.current + 1} / ${this.slides.length}`;
  }

  private updateNotes() {
    const notes = this.slides[this.current].dataset.slideNotes ?? '';
    const el = document.querySelector('[data-presenter-notes]');
    if (el) el.textContent = notes;
  }

  next() { if (this.current < this.slides.length - 1) this.showSlide(this.current + 1, 'next'); }
  prev() { if (this.current > 0) this.showSlide(this.current - 1, 'prev'); }
  toggleFullscreen() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  toggleNotes() { document.querySelector('[data-presenter-notes]')?.classList.toggle('visible'); }
}

// --- トランジション ---
interface TransitionHandler {
  execute(from: HTMLElement, to: HTMLElement, direction: 'next' | 'prev'): Promise<void>;
}

// 初期化
new SlidePresenter();
```

### src/presenter/transitions.css

```css
/* Fade（デフォルト） */
[data-slide] {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
[data-slide].active {
  opacity: 1;
  pointer-events: auto;
}

/* Slide（横スライド） */
[data-slide].slide-enter-next  { transform: translateX(100%); }
[data-slide].slide-enter-prev  { transform: translateX(-100%); }
[data-slide].slide-active      { transform: translateX(0); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
[data-slide].slide-exit-next   { transform: translateX(-100%); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
[data-slide].slide-exit-prev   { transform: translateX(100%); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }

/* Flip（3D回転） */
.presenter-viewport { perspective: 1500px; }
[data-slide].flip-enter  { transform: rotateY(90deg); backface-visibility: hidden; }
[data-slide].flip-active { transform: rotateY(0); transition: transform 0.6s ease; }
[data-slide].flip-exit   { transform: rotateY(-90deg); transition: transform 0.6s ease; }

/* プレゼンターノート */
[data-presenter-notes] {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 200px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 16px;
  font-size: 18px;
  overflow-y: auto;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 999;
}
[data-presenter-notes].visible { transform: translateY(0); }
```

### カスタマイズのユースケース

ユーザーが Claude Code に指示するシナリオ:

**「ページめくりのアニメーションをカードフリップにして」**
→ Claude Code が `transitions.css` に新しいアニメーション定義を追加
→ `presenter.ts` の transitions Map に登録
→ 対象スライドの frontmatter に `transition: "card-flip"` を設定

**「プレゼン時に下にタイマーを表示して」**
→ Claude Code が `src/presenter/components/Timer.astro` を新規作成
→ `PresenterLayout.astro` に `<Timer />` を追加
→ `presenter.ts` にタイマーロジックを追加

**「スライド一覧のサムネイルを表示したい」**
→ Claude Code が `src/presenter/components/SlideGrid.astro` を新規作成
→ キーボードショートカットで表示切替

すべてプロジェクト内のファイル編集だけで実現できる。npm install 不要。新しいUIパーツは Astro コンポーネントとして追加するだけ。

---

## build-png.mjs 設計（LLM 品質チェック用）

### 目的

Claude Code がスライドの品質を目視チェックするための PNG 出力。LLM は PNG を直接コンテキストウィンドウに読み込んで評価できる。PDF よりも高速に生成でき、LLM との相性が最も良い形式。

### 処理フロー

```
1. 引数パース（--deck <n> | --all）
2. Astro ビルド済み dist/ から `main.html` を取得
3. Playwright でページを開き、`[data-slide]` 要素を列挙
4. 既定のスライドサイズを決定
5. Playwright Chromium 起動
6. 各スライド要素を page.screenshot() で PNG 生成
7. dist/<deck-name>/01.png, 02.png, ... に出力
8. Playwright を閉じる
```

### コード骨格

```ts
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORT_SIZES: Record<string, { width: number; height: number }> = {
  '16:9':         { width: 1920, height: 1080 },
  '4:3':          { width: 1440, height: 1080 },
  'A4':           { width: 794,  height: 1123 },
  'A4-landscape': { width: 1123, height: 794  },
  'poster':       { width: 3840, height: 2160 },
};

async function buildPng(deckName: string) {
  const htmlPath = path.join('dist', deckName, 'main.html');

  const viewport = VIEWPORT_SIZES['16:9'];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport });
  const outDir = path.join('dist', deckName, 'png');
  fs.mkdirSync(outDir, { recursive: true });
  const page = await context.newPage();
  await page.goto(`file://${path.resolve(htmlPath)}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  const slides = await page.locator('[data-slide]').all();

  for (const [index, slide] of slides.entries()) {
    const pngPath = path.join(outDir, `${String(index + 1).padStart(2, '0')}.png`);
    await slide.screenshot({
      path: pngPath,
      type: 'png',
    });
    console.log(`  📸 ${pngPath}`);
  }

  await browser.close();
  console.log(`✅ ${slides.length} slides → ${outDir}/`);
}
```

### Claude Code のチェックワークフロー

```
Claude Code がスライド生成
  → npm run build:png -- --deck <deck-name>
  → dist/<deck-name>/png/01.png, 02.png, ... が生成される
  → Claude Code が PNG を見て品質判断:
    - はみ出していないか
    - 余白は適切か
    - 色・フォントの統一感
    - チャートや SVG が正しく表示されているか
  → 問題があればソースを修正
  → 再度 build:png
  → OK なら build:pdf / build:html
```

build:png は build:pdf より高速（PDF結合処理がない）。LLM のイテレーションループに最適。

---

## build-pdf.mjs 設計

### 処理フロー

```
1. 引数パース（--deck <name> | --all）
2. Astro ビルド済み dist/ から `main.html` を取得
3. Playwright でページを開き、`[data-slide]` 要素を列挙
4. 既定のページサイズを決定
5. Playwright Chromium 起動
6. 各スライド要素を1ページずつ PDF 化
7. pdf-lib で全ページを1つのPDFに結合
8. dist/<deck-name>.pdf に出力
9. Playwright を閉じる
```

### ページサイズのマッピング

```ts
const PAGE_SIZES: Record<string, { width: string; height: string }> = {
  '16:9':         { width: '338.67mm', height: '190.5mm' },   // PowerPoint標準
  '4:3':          { width: '254mm',    height: '190.5mm' },
  'A4':           { width: '210mm',    height: '297mm' },
  'A4-landscape': { width: '297mm',    height: '210mm' },
  'poster':       { width: '841mm',    height: '594mm' },     // A1
};
```

### 実装の注意点

- `page.pdf()` は Playwright の Chromium モード限定（Firefox/WebKit は非対応）
- フォントの読み込み完了を待つ必要がある（`page.waitForTimeout` or font loading API）
- CSS custom properties がPDF出力に正しく反映されるか検証が必要
- SVG 内のテキストがPDFでコピー可能かどうか検証が必要

### コード骨格

```ts
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function buildPdf(deckName: string) {
  const htmlPath = path.join('dist', deckName, 'main.html');

  const pageSize = PAGE_SIZES['16:9'];

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const mergedPdf = await PDFDocument.create();
  const page = await context.newPage();
  await page.goto(`file://${path.resolve(htmlPath)}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);

  const slideCount = await page.locator('[data-slide]').count();

  for (let index = 0; index < slideCount; index++) {
    await page.evaluate((i) => {
      document.querySelectorAll<HTMLElement>('[data-slide]').forEach((slide, idx) => {
        slide.style.display = idx === i ? 'block' : 'none';
      });
    }, index);

    const pdfBytes = await page.pdf({
      width: pageSize.width,
      height: pageSize.height,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const tempPdf = await PDFDocument.load(pdfBytes);
    const [copiedPage] = await mergedPdf.copyPages(tempPdf, [0]);
    mergedPdf.addPage(copiedPage);
  }

  const finalPdfBytes = await mergedPdf.save();
  fs.writeFileSync(`dist/${deckName}.pdf`, finalPdfBytes);
  await browser.close();

  console.log(`✅ dist/${deckName}.pdf`);
}
```

---

## build-html.mjs 設計

### 処理フロー

```
1. 引数パース（--deck <name> | --all）
2. Astro ビルド済み dist/ から `main.html` を取得
3. `main.html` の `<body>` と `<head>` を読み込む
4. スライド要素に Presenter 用の補助属性を付与
5. src/presenter/runtime.ts をバンドル（esbuild）
6. src/presenter/transitions.css を読み込み
7. Presenter ランタイム + CSS を注入
8. 画像・フォントを Base64 インライン化
10. dist/<deck-name>.html に出力
```

### 出力HTMLの構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{deckTitle ?? deckName}</title>
  <style>
    /* リセット + presenter viewport */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; }
    .presenter-viewport {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .slide-scaler {
      width: var(--slide-width);
      height: var(--slide-height);
      transform-origin: center center;
      /* JS が viewport に合わせて scale を計算 */
    }

    /* トランジション CSS（transitions.css のインライン） */
    {transitions_css}

    /* 各スライドの scoped CSS（Astro ビルドから抽出） */
    {slide_styles}

    /* インラインフォント */
    {font_face_declarations}
  </style>
</head>
<body>
  <div class="presenter-viewport">
    <div class="slide-scaler">
      <!-- スライド1 -->
      <section data-slide data-slide-transition="fade" data-slide-notes="...">
        {slide_01_html}
      </section>

      <!-- スライド2 -->
      <section data-slide data-slide-transition="slide">
        {slide_02_html}
      </section>

      <!-- ... -->
    </div>
  </div>

  <!-- プログレスバー -->
  <div class="presenter-progress"></div>

  <!-- スピーカーノート -->
  <div class="presenter-notes"></div>

  <script>
    {runtime_js}
  </script>
</body>
</html>
```

### ビューポートスケーリング

スライドは 1920×1080px 固定だが、表示するモニターのサイズは様々。JS でビューポートに合わせてスケーリングする。

```ts
function scaleToFit() {
  const viewport = document.querySelector('.presenter-viewport')!;
  const scaler = document.querySelector('.slide-scaler')! as HTMLElement;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const sw = 1920;  // --slide-width
  const sh = 1080;  // --slide-height
  const scale = Math.min(vw / sw, vh / sh);
  scaler.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', scaleToFit);
scaleToFit();
```

### Base64 インライン化

スタンドアロン HTML のため、外部リソースはすべてインラインに:

- 画像（png, jpg, svg）→ `<img src="data:image/png;base64,...">`
- フォント → `@font-face { src: url(data:font/woff2;base64,...) }`
- CSS → `<style>` タグにインライン
- JS → `<script>` タグにインライン

### 実装の注意点

- esbuild で runtime.ts をバンドルする（TypeScript → JS 変換 + tree shaking）
- Astro ビルドの出力HTML から `main.html` の `<head>` と `<body>` を安全に再利用する
- Astro の scoped CSS（`data-astro-*` 属性）がそのまま動くか検証が必要
- Base64 化するとファイルサイズが膨らむ。フォントファイルが大きい場合はサブセット化を推奨

---

## check-slides.spec.mjs 設計

### Playwright Test として実装

```ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const deckName = process.env.DECK ?? 'sample';
const distDir = path.join('dist', deckName);

const slideFiles = fs.readdirSync(distDir)
  .filter(f => /^\d+\.html$/.test(f))
  .sort();

for (const file of slideFiles) {
  test(`Visual check: ${deckName}/${file}`, async ({ page }) => {
    await page.goto(`file://${path.resolve(distDir, file)}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // スクリーンショット保存
    const screenshotPath = `screenshots/${deckName}/${file.replace('.html', '.png')}`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,  // 固定枠サイズでキャプチャ
    });

    // オプション: スクリーンショット比較（リグレッション検知）
    // await expect(page).toHaveScreenshot(`${deckName}-${file}.png`);
  });
}
```

### Claude Code 連携

Claude Code が MCP 経由で Playwright を操作する場合のフロー:

1. `npm run dev` → Astro dev サーバー起動
2. Claude Code が Playwright でスクリーンショット取得
3. 画像を自己評価（はみ出し、余白、色の統一感）
4. 問題があればソースを修正
5. 1-4 を繰り返す
6. 品質OKなら `npm run build:pdf`

---

## tailwind.config.mjs 設計

### 完全な設定

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    // レスポンシブブレークポイントを無効化
    screens: {},
    extend: {
      // スライド固定サイズ
      width: {
        'slide': 'var(--slide-width)',
      },
      height: {
        'slide': 'var(--slide-height)',
      },

      // カラーシステム → CSS custom properties
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
          5: 'var(--color-chart-5)',
          6: 'var(--color-chart-6)',
        },
      },

      // タイポグラフィスケール → CSS custom properties
      fontSize: {
        'slide-title': ['var(--font-size-title)', { lineHeight: '1.2' }],
        'slide-heading': ['var(--font-size-heading)', { lineHeight: '1.3' }],
        'slide-body': ['var(--font-size-body)', { lineHeight: '1.6' }],
        'slide-caption': ['var(--font-size-caption)', { lineHeight: '1.5' }],
      },

      // スペーシングスケール → CSS custom properties
      spacing: {
        'slide-xs': 'var(--space-xs)',
        'slide-sm': 'var(--space-sm)',
        'slide-md': 'var(--space-md)',
        'slide-lg': 'var(--space-lg)',
        'slide-xl': 'var(--space-xl)',
      },

      // フォントファミリー
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
      },
    },
  },
  plugins: [],
};
```

### Tailwind デフォルトカラーの扱い

検討中。選択肢:

1. **完全無効化**: `colors: { ...上記のみ }` で extend ではなく直接上書き。LLM がデフォルトの `text-blue-500` 等を使えなくなる。トークン遵守を強制
2. **残す**: extend で追加のみ。LLM がデフォルトカラーも使える。柔軟だがトンマナ逸脱のリスク
3. **警告**: Tailwind plugin でデフォルトカラー使用時に警告（実装コスト高）

推奨: Phase 1 では **2（残す）** 。AGENTS.md で「デザイントークンを使え」と指示する。Phase 2 で完全無効化を検討。

---

## astro.config.mjs 設計

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({
      configFile: './tailwind.config.mjs',
    }),
  ],
  // 静的サイト生成（デフォルト）
  output: 'static',
  // 各スライドは独立したページ
  build: {
    format: 'file',  // /01.html（ディレクトリではなくファイル）
  },
});
```

`build.format: 'file'` にすることで、`src/pages/pitch-deck/main.astro` → `dist/pitch-deck/main.html` になる。ビルドスクリプトはこの1ファイルを処理すればよい。

---

## パフォーマンス考慮事項

### PDF ビルド速度

- Playwright の起動は1回。ページは使い回す
- 10枚のスライドで 5〜15秒を目標
- Chromium の `--disable-gpu`, `--no-sandbox` で高速化

### HTML ファイルサイズ

- フォント: woff2 サブセット化で Noto Sans JP は 1〜2MB
- 画像: 元画像のサイズに依存。AGENTS.md で「画像は軽量に」と促す
- ランタイム JS: 5KB 以下を目標
- 目標: フォント込みで 5MB 以下

---

## 未解決の技術的課題

1. **Astro scoped CSS の再利用**: build-html.mjs が `main.html` の scoped CSS を安全に再利用できるか
2. **フォント読み込みタイミング**: PDF出力時にカスタムフォントが確実に読み込まれるか
3. **SVG テキストの PDF コピー可能性**: SVG 内テキストが PDF でテキスト選択・コピーできるか
4. **Tailwind v4 との互換性**: `@astrojs/tailwind` が Tailwind v4 をサポートしているか要確認
5. **esbuild バンドル**: runtime.ts を esbuild でバンドルする際の設定（target, format）
6. **デッキメタデータの置き場**: 将来ビルド専用メタデータが必要になった場合、frontmatter と別ファイルのどちらを採用するか
