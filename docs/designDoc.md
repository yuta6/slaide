# slaide 技術設計ドキュメント

このドキュメントは slaide の「どう作るか」を定義する。

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

## プロジェクト構造

```
slaide/
├── package.json                ← astro, tailwind, playwright, pdf-lib
├── astro.config.mjs            ← tailwind integration 設定済み
├── tailwind.config.mjs         ← スライド用トークン設定済み
├── tsconfig.json
│
├── AGENTS.md                   ← プロジェクトルートの指示書
│
├── scripts/
│   ├── build-png.mjs           ← Playwright → PNG（LLM 品質チェック用）
│   ├── build-pdf.mjs           ← Playwright → PDF 生成
│   └── build-html.mjs          ← main.html 後処理 + Presenter ランタイム注入
│
├── assets/
│   └── fonts/                  ← ユーザーが用意するフォント
│
└── src/
    ├── layouts/
    │   └── SlideLayout.astro   ← 固定枠 + デザインシステム
    ├── components/             ← LLM がプロジェクトごとに作る
    │   └── AGENTS.md           ← コンポーネント設計ルール
    ├── presenter/              ← プレゼンテーションランタイム
    │   ├── PresenterLayout.astro
    │   ├── components/
    │   │   ├── Navigation.astro
    │   │   ├── ProgressBar.astro
    │   │   ├── SlideCounter.astro
    │   │   └── PresenterNotes.astro
    │   ├── presenter.ts        ← 最小限のJS（キーボード制御、状態管理）
    │   ├── transitions.css     ← トランジション定義
    │   └── AGENTS.md           ← カスタマイズガイド
    └── pages/                  ← LLM がスライドを作る
        └── AGENTS.md           ← スライドの書き方ルール
```

### AGENTS.md の配置（Progressive Disclosure）

```
AGENTS.md                       ← プロジェクト全体のルール・ワークフロー
src/components/AGENTS.md        ← コンポーネント設計ガイド
src/presenter/AGENTS.md         ← プレゼンランタイムのカスタマイズガイド
src/pages/AGENTS.md             ← スライドの書き方・main.astro・命名規則
```

Claude Code はカレントディレクトリの AGENTS.md を自動で読む。各ディレクトリに配置することで、必要な知識が必要な場所で提供される。

---

## マルチデッキ対応

1つのプロジェクトで複数のスライドデッキを管理できる。`src/pages/` 直下のディレクトリが1つのデッキに対応する。

```
src/pages/
├── pitch-deck/
│   ├── main.astro
│   └── slides/
│       ├── Title.astro
│       ├── MarketOverview.astro
│       └── Closing.astro
├── quarterly-report/
│   ├── main.astro
│   └── slides/
│       ├── Title.astro
│       └── Summary.astro
└── ...
```

### ビルドコマンド

```bash
npm run build:pdf -- --deck pitch-deck       # 特定デッキ
npm run build:html -- --deck pitch-deck
npm run build:pdf -- --all                   # 全デッキ一括
```

### 出力

```
dist/
├── pitch-deck.pdf
├── pitch-deck.html
├── quarterly-report.pdf
└── quarterly-report.html
```

### デッキ設定方針（Phase 1）

- `_deck.json` は作らない
- デッキ名・出力ファイル名はディレクトリ名から決める
- 共通の見た目は `SlideLayout.astro` で定義
- 順序は `main.astro` のコード順
- スライド固有の値は各スライドコンポーネント内に書く
- 将来、PDF author や HTML title 等が必要になった場合だけ別ファイルを追加検討

---

## SlideLayout.astro

### Web とスライドの根本的な違い

Web ページは縦に無限スクロールする。スライドは固定サイズの箱。はみ出したら切れる。

### 2つの役割

**1. 固定枠の提供（構造的。壊してはいけない）**
- 固定サイズ + overflow: hidden
- ヘッダー/フッター/コンテンツの slot 構造
- アスペクト比の切替

**2. トンマナの定義（プロジェクトごとにカスタマイズする）**
- カラーパレットの値
- フォント設定
- 余白・スペーシングの値
- ヘッダー/フッターのデザイン

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
```

### テーマ・スタイル

```css
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
```

### アスペクト比とサイズ

| プリセット | 幅 | 高さ | 用途 |
|-----------|------|------|------|
| 16:9 | 1920px | 1080px | 標準プレゼン（デフォルト） |
| 4:3 | 1440px | 1080px | レガシー |
| A4 | 794px | 1123px | 印刷用ドキュメント |
| A4-landscape | 1123px | 794px | 印刷用横向き |
| poster | 3840px | 2160px | ポスター |

### CSS Custom Properties

**タイポグラフィ:** `--font-size-title`, `--font-size-heading`, `--font-size-body`, `--font-size-caption`, `--font-family-sans`, `--font-family-mono`

**カラー:** `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text`, `--color-muted`, `--color-border`, `--color-chart-1` 〜 `--color-chart-6`

**スペーシング:** `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (32px), `--space-xl` (64px)

**レイアウト:** `--slide-width`, `--slide-height`, `--content-padding`

### SlideLayout.astro が担当しないこと

- コンテンツのレイアウトパターン → LLM が components/ に作る
- チャートの描画 → LLM が components/ に作る or SVG 直書き
- 画像の配置 → 各スライドが自由に決める
- アニメーション → HTML 出力時にビルドスクリプトが付与
- スライドの「型」の定義 → LLM が自由に作る

---

## main.astro による順序管理

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

### スライドコンポーネントの書き方

```astro
---
import SlideLayout from '../../../layouts/SlideLayout.astro';

const frontmatter = {
  title: "市場分析レポート",
  transition: "fade",
  theme: "dark",
  showHeader: true,
  showFooter: true,
  notes: "スピーカーノート",
};
---

<SlideLayout frontmatter={frontmatter}>
  <h1 class="text-slide-title font-bold">市場分析レポート</h1>
  <p class="text-slide-heading text-muted">2026年 第1四半期</p>
</SlideLayout>
```

```astro
---
import SlideLayout from '../../../layouts/SlideLayout.astro';
import TwoColumn from '../../components/TwoColumn.astro';
import BarChart from '../../components/BarChart.astro';
import Takeaways from '../../components/Takeaways.astro';

const frontmatter = {
  title: "売上推移と主要ドライバー",
};
---

<SlideLayout frontmatter={frontmatter}>
  <TwoColumn>
    <BarChart slot="left" data={[...]} />
    <Takeaways slot="right" items={[...]} />
  </TwoColumn>
</SlideLayout>
```

---

## Presenter ランタイム

### 設計思想

build:html が出力するスタンドアロン HTML は**プレゼンテーションソフト**である。ブラウザで開くだけで、キーボード操作でスライドを進め、トランジションアニメーション付きでプレゼンできる。

**Presenter の UI パーツは Astro コンポーネントとして作る。** build:html 時に普通の HTML/CSS に展開されてワンファイルに結合される。

JS は最小限。キーボード制御と状態管理だけを `presenter.ts` に書く。React は使わない。

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

  <Navigation />
  <ProgressBar total={slides.length} />
  <SlideCounter total={slides.length} />
  <PresenterNotes />
</div>
```

### Presenter UI コンポーネント

**Navigation.astro:**

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
    bottom: 0; left: 0; right: 0;
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

### presenter.ts

UI の見た目は Astro コンポーネントが担当するため、JS は**イベントハンドリングと状態管理だけ**:

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
    ]);
    this.bindEvents();
    this.showSlide(0);
  }

  private bindEvents() {
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

interface TransitionHandler {
  execute(from: HTMLElement, to: HTMLElement, direction: 'next' | 'prev'): Promise<void>;
}

new SlidePresenter();
```

### transitions.css

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

### Presenter カスタマイズのユースケース

**「ページめくりのアニメーションをカードフリップにして」**
→ `transitions.css` に新しいアニメーション定義を追加
→ `presenter.ts` の transitions Map に登録
→ 対象スライドの frontmatter に `transition: "card-flip"` を設定

**「プレゼン時に下にタイマーを表示して」**
→ `src/presenter/components/Timer.astro` を新規作成
→ `PresenterLayout.astro` に `<Timer />` を追加
→ `presenter.ts` にタイマーロジックを追加

すべてプロジェクト内のファイル編集だけで実現できる。npm install 不要。

---

## build-png.mjs（LLM 品質チェック用）

### 処理フロー

```
1. 引数パース（--deck <n> | --all）
2. Astro ビルド済み dist/ から main.html を取得
3. Playwright でページを開き、[data-slide] 要素を列挙
4. 各スライド要素を page.screenshot() で PNG 生成
5. dist/<deck-name>/png/01.png, 02.png, ... に出力
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
    await slide.screenshot({ path: pngPath, type: 'png' });
    console.log(`  📸 ${pngPath}`);
  }

  await browser.close();
  console.log(`✅ ${slides.length} slides → ${outDir}/`);
}
```

---

## build-pdf.mjs

### 処理フロー

```
1. 引数パース（--deck <name> | --all）
2. Astro ビルド済み dist/ から main.html を取得
3. Playwright でページを開き、[data-slide] 要素を列挙
4. 各スライド要素を1ページずつ PDF 化
5. pdf-lib で全ページを1つのPDFに結合
6. dist/<deck-name>.pdf に出力
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

### 実装の注意点

- `page.pdf()` は Playwright の Chromium モード限定（Firefox/WebKit は非対応）
- フォントの読み込み完了を待つ必要がある
- CSS custom properties が PDF 出力に正しく反映されるか検証が必要
- SVG 内のテキストが PDF でコピー可能かどうか検証が必要

---

## build-html.mjs

### 処理フロー

```
1. 引数パース（--deck <name> | --all）
2. Astro ビルド済み dist/ から main.html を取得
3. main.html の <body> と <head> を読み込む
4. スライド要素に Presenter 用の補助属性を付与
5. src/presenter/runtime.ts をバンドル（esbuild）
6. src/presenter/transitions.css を読み込み
7. Presenter ランタイム + CSS を注入
8. 画像・フォントを Base64 インライン化
9. dist/<deck-name>.html に出力
```

### 出力 HTML の構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{deckTitle ?? deckName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; }
    .presenter-viewport {
      width: 100vw; height: 100vh;
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .slide-scaler {
      width: var(--slide-width);
      height: var(--slide-height);
      transform-origin: center center;
    }
    {transitions_css}
    {slide_styles}
    {font_face_declarations}
  </style>
</head>
<body>
  <div class="presenter-viewport">
    <div class="slide-scaler">
      <section data-slide data-slide-transition="fade">{slide_01_html}</section>
      <section data-slide data-slide-transition="slide">{slide_02_html}</section>
    </div>
  </div>
  <div class="presenter-progress"></div>
  <div class="presenter-notes"></div>
  <script>{runtime_js}</script>
</body>
</html>
```

### ビューポートスケーリング

```ts
function scaleToFit() {
  const viewport = document.querySelector('.presenter-viewport')!;
  const scaler = document.querySelector('.slide-scaler')! as HTMLElement;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const scale = Math.min(vw / 1920, vh / 1080);
  scaler.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', scaleToFit);
scaleToFit();
```

### Base64 インライン化

スタンドアロン HTML のため、外部リソースはすべてインライン:

- 画像（png, jpg, svg）→ `<img src="data:image/png;base64,...">`
- フォント → `@font-face { src: url(data:font/woff2;base64,...) }`
- CSS → `<style>` タグにインライン
- JS → `<script>` タグにインライン

### 実装の注意点

- esbuild で runtime.ts をバンドルする（TypeScript → JS 変換 + tree shaking）
- Astro の scoped CSS（`data-astro-*` 属性）がそのまま動くか検証が必要
- Base64 化するとファイルサイズが膨らむ。フォントのサブセット化を推奨

---

## check-slides.spec.mjs

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

    const screenshotPath = `screenshots/${deckName}/${file.replace('.html', '.png')}`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
  });
}
```

---

## Tailwind CSS 設定

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    screens: {},  // レスポンシブブレークポイントを無効化
    extend: {
      width: { 'slide': 'var(--slide-width)' },
      height: { 'slide': 'var(--slide-height)' },
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
      fontSize: {
        'slide-title': ['var(--font-size-title)', { lineHeight: '1.2' }],
        'slide-heading': ['var(--font-size-heading)', { lineHeight: '1.3' }],
        'slide-body': ['var(--font-size-body)', { lineHeight: '1.6' }],
        'slide-caption': ['var(--font-size-caption)', { lineHeight: '1.5' }],
      },
      spacing: {
        'slide-xs': 'var(--space-xs)',
        'slide-sm': 'var(--space-sm)',
        'slide-md': 'var(--space-md)',
        'slide-lg': 'var(--space-lg)',
        'slide-xl': 'var(--space-xl)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
      },
    },
  },
  plugins: [],
};
```

Tailwind デフォルトカラーの扱い: Phase 1 では共存させる（extend で追加のみ）。AGENTS.md で「デザイントークンを使え」と指示。Phase 2 で完全無効化を検討。

---

## Astro 設定

```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({ configFile: './tailwind.config.mjs' }),
  ],
  output: 'static',
  build: {
    format: 'file',  // /01.html（ディレクトリではなくファイル）
  },
});
```

`build.format: 'file'` にすることで、`src/pages/pitch-deck/main.astro` → `dist/pitch-deck/main.html` になる。

---

## package.json scripts

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "build:png": "astro build && node scripts/build-png.mjs",
    "build:pdf": "astro build && node scripts/build-pdf.mjs",
    "build:html": "astro build && node scripts/build-html.mjs",
    "preview": "astro preview"
  }
}
```

---

## パフォーマンス考慮事項

### PDF ビルド速度

- Playwright の起動は1回。ページは使い回す
- 10枚のスライドで 5〜15秒を目標
- Chromium の `--disable-gpu`, `--no-sandbox` で高速化

### HTML ファイルサイズ

- フォント: woff2 サブセット化で Noto Sans JP は 1〜2MB
- 画像: 元画像のサイズに依存
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
