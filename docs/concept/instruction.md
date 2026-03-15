# slaide 設計ドキュメント

## これは何か

Claude Code / Codex に渡すための設計指示書。このドキュメントに基づいてプロジェクトの骨組みを構築すること。

---

## コンセプト

**自然言語からコンサル品質のスライドを生成し、PDF/HTML で出力する Astro ベースのビルドインフラ。**

### 提供価値

- Claude Code / Codex CLI のサブスクさえあれば、自然言語で「〇〇のプレゼン作って」と言うだけでコンサル品質のスライドが出てくる
- API 課金ゼロ。追加 SaaS 不要
- エージェントがローカルのファイルを編集して自動でスライドを生成する世界観
- `npm run build:pdf` → スライド PDF
- `npm run build:html` → アニメーション付きワンファイル HTML プレゼン（ブラウザさえあればプレゼンできる）

### ツールの正体

- **Astro プロジェクトテンプレート**: ビルドパイプライン + デザインシステムを強制する layout + Tailwind CSS
- **AGENTS.md**: プロジェクト内に埋め込まれた指示書。Claude Code が自動で読み込み、スライドの作り方を理解する
- **ビルドスクリプト**: Astro build → Playwright → PNG/PDF 生成 + HTML後処理

### 重要な設計原則

1. **スライドは固定枠。** Web と根本的に違う。1920×1080px の箱。はみ出したら切れる。これが全設計を支配する最重要制約
2. **コンポーネントは事前定義しない。** LLM がプロジェクトごとに最適なコンポーネントを作る。プリセットは柔軟性を殺す
3. **SlideLayout.astro がトンマナを強制する。** 固定枠の提供 + カラー・フォント・余白の体系。プロジェクトごとにカスタマイズする
4. **Tailwind CSS が規約の強制装置。** CSS custom properties を Tailwind トークンにマッピング。LLM が `text-primary` と書くだけでデザインシステム準拠
5. **AGENTS.md が品質を担保する。** コンポーネント作成・SVG 活用・デザイン原則を LLM に教える
6. **フォント・素材はユーザーが用意する。** ツールにはバンドルしない
7. **Presenter は自前実装。** reveal.js 等の既存プレゼンフレームワークは使わない（理由は後述）

---

## 既存ツールとの違い

### 競合比較

| | slaide | Marp | Slidev | reveal.js |
|--|--------|------|--------|-----------|
| 入力 | 自然言語 | Markdown | Markdown | HTML/Markdown |
| 誰が書く | LLM エージェント | 人間 | 人間 | 人間 |
| 品質チェック | LLM が build:png で自己チェック | 人間が目視 | 人間が目視 | 人間が目視 |
| デザインの自由度 | 無限（Astro + Tailwind） | テーマ制約 | テーマ制約 | テーマ制約 |
| Presenter カスタマイズ | LLM が自然言語で機能追加可能 | 設定変更のみ | 設定変更のみ | 設定変更 + プラグイン |
| PDF 出力 | Playwright | Playwright/Chrome | Playwright | ブラウザ印刷 |
| PPTX 出力 | スコープ外 | 画像埋め込み（非編集） | 画像埋め込み（非編集） | 非対応 |
| HTML プレゼン | スタンドアロン1ファイル | スタンドアロン | SPA（要ホスティング） | SPA |

### 本質的な違い

既存ツールはすべて **「人間が Markdown/HTML を書く」** 前提で設計されている。slaide は **「LLM エージェントが自律的にスライドを生成し、自己チェックし、品質が出るまでイテレーションする」** 前提で設計されている。レイヤーが一段上。

Marp/Slidev/reveal.js は「Markdown を書くだけでスライドができる」を価値とする。slaide は「自然言語で言うだけでスライドができる」を価値とする。ユーザーはコードを一行も書かない。

### Presenter に reveal.js を使わない理由（A/B/C 案の検討結果）

Presenter ランタイム（build:html の出力であるプレゼンテーション機能）について、3つの案を検討した。

**A案: Astro + 自前 Presenter（採用）**
- Presenter を Astro コンポーネント + 薄い JS で自作
- JS ~100行 + CSS ~50行。軽量
- Tailwind / CSS custom properties と完全に統合。デザインの衝突ゼロ
- LLM が Presenter のコンポーネント（Timer, SlideGrid 等）を自由に追加可能
- Presenter 自体が AI カスタマイズ可能という差別化ポイント

**B案: Astro + reveal.js（不採用）**
- reveal.css（54KB）が Tailwind と衝突する。`.reveal` スコープ内でフォントサイズ、色、h1-h6、opacity を opinionated に設定
- reveal.js のテーマを無効化して CSS を上書きすると、reveal.js と戦うことになる
- Presenter のカスタマイズが「reveal.js の設定変更」に制限される

**C案: reveal.js のみ（Astro 不要）（不採用）**
- Astro のコンポーネントシステム、Tailwind 統合、スコープド CSS がなくなる
- LLM が生 HTML を書くことになり品質がブレる

**結論: A案。** Presenter に必要な機能（キーボード操作、トランジション、スケーリング、プログレスバー、フルスクリーン）は自前で ~150行で実装できる。reveal.js の 115KB + 54KB を入れて CSS の衝突と戦うより、自前の方が軽量・シンプル・カスタマイズ自由。

---

## 2つのエディション

### npm create edition（Phase 1 — 先に作る）

```bash
npm create slaide my-deck
cd my-deck
npm install
# → Claude Code / Codex / Cursor 等で「ピッチデッキ作って」
```

- 対象: 開発者、カスタマイズ重視の人
- Astro プロジェクト全体が見える
- SlideLayout.astro やコンポーネントを直接編集できる
- AGENTS.md がプロジェクト内に入っており、Claude Code が自動で読む

### SKILL edition（Phase 2 — 後で作る）

```bash
claude skill install slaide
# → 「プレゼン作って」で全自動
```

- 対象: 非開発者、速さ重視の人
- Astro を隠蔽。ユーザーには PDF/HTML だけが見える
- 内部で .slaide/ にプロジェクトを展開し、ビルドして成果物だけ返す
- 「ソース見せて」と言えば Eject（npm create edition 相当に変換）できる
- 未解決課題: フォント・素材をどう用意させるか（要検討）

### エディション間の関係

```
SKILL edition
  → 内部でプロジェクトを生成（AGENTS.md 込み）
  → 本当の知識は AGENTS.md にある
  → SKILL.md は薄いオーケストレーター

npm create edition
  → プロジェクトがそのまま出てくる（AGENTS.md 入り）
  → SKILL 不要。AGENTS.md を Claude Code が自動で読む

共通基盤 = AGENTS.md + Astro プロジェクトテンプレート
```

**Phase 1 では npm create edition のみ作る。**

---

## プロジェクト構造

`npm create slaide` が生成するプロジェクト:

```
my-deck/
├── package.json                ← astro, tailwind, playwright, pdf-lib
├── astro.config.mjs            ← tailwind integration 設定済み
├── tailwind.config.mjs         ← スライド用トークン設定済み
├── tsconfig.json
│
├── AGENTS.md                   ← プロジェクトルートの指示書（このツールの心臓）
│
├── scripts/
│   ├── build-png.mjs           ← Playwright → PNG（LLM 品質チェック用）
│   ├── build-pdf.mjs           ← Playwright → PDF 生成
│   └── build-html.mjs          ← main.html 後処理 + Presenter ランタイム注入
│
├── assets/                     ← 画像・SVG・素材置き場
│   └── fonts/                  ← ユーザーが用意するフォント
│
└── src/
    ├── layouts/
    │   └── SlideLayout.astro   ← 固定枠 + デザインシステム
    ├── components/             ← 空。LLM がプロジェクトごとに作る
    │   └── AGENTS.md           ← コンポーネント設計ルール
    ├── presenter/              ← プレゼンテーションランタイム
    │   ├── PresenterLayout.astro ← Presenterの外枠（build:html 用）
    │   ├── components/         ← Presenter UI パーツ（Astro コンポーネント）
    │   │   ├── Navigation.astro
    │   │   ├── ProgressBar.astro
    │   │   ├── SlideCounter.astro
    │   │   └── PresenterNotes.astro
    │   ├── presenter.ts        ← 最小限のJS（キーボード制御、状態管理のみ）
    │   ├── transitions.css     ← トランジションアニメーション定義
    │   └── AGENTS.md           ← ランタイムカスタマイズガイド
    └── pages/                  ← 空。LLM がスライドを作る
        └── AGENTS.md           ← スライドの書き方ルール
```

### AGENTS.md の配置（Progressive Disclosure）

```
AGENTS.md                       ← プロジェクト全体のルール・ワークフロー
src/components/AGENTS.md        ← コンポーネント設計ガイド
src/presenter/AGENTS.md         ← プレゼンランタイムのカスタマイズガイド
src/pages/AGENTS.md             ← スライドの書き方・main.astro・命名規則
```

Claude Code はカレントディレクトリの AGENTS.md を自動で読む。各ディレクトリに配置することで、必要な知識が必要な場所で提供される。SKILL.md の 500 行制限を気にする必要がない。

技術的な実装詳細は **designDoc.md** を参照。

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
npm run build:html -- --all
```

### 出力

```
dist/
├── pitch-deck.pdf
├── pitch-deck.html
├── quarterly-report.pdf
└── quarterly-report.html
```

### Phase 1 のデッキ設定方針

- Phase 1 では `_deck.json` は作らない
- デッキ名・出力ファイル名はディレクトリ名から決める
- 共通の見た目は `SlideLayout.astro` 側で定義する
- 順序は `main.astro` のコード順で決める
- スライド固有の値は各スライドコンポーネント内に書く
- 将来、PDF author や HTML title などビルド専用のメタデータが必要になった場合だけ、別ファイルを追加検討する

### pages/ のルール

- `src/pages/` 直下のディレクトリが1つのデッキ
- 各デッキには `main.astro` を置き、ここがスライド順序の唯一の真実になる
- `slides/` 配下に各スライドを Astro コンポーネントとして分割する
- スライドの挿入・並び替えは `main.astro` の import と JSX の並びを編集するだけでよい

### main.astro

`main.astro` は順序だけを記述する。

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

### 各スライドコンポーネント

各スライドコンポーネントは `SlideLayout.astro` を使って1枚のスライドを描画する。`frontmatter` 相当の値はコンポーネント内の定数として持てばよい。

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

LLM はプロジェクトに応じてフィールドを自由に追加してよい（例: `background`, `class` 等）。

### スライドの書き方

```astro
---
import SlideLayout from '../../../layouts/SlideLayout.astro';

const frontmatter = {
  title: "市場分析レポート",
  theme: "dark",
  showFooter: false,
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

### components/ のルール

- 事前定義なし。LLM がプロジェクトの要件に応じて自由に作成する
- レイアウトパターン（TwoColumn, FullBleed, CenterContent 等）もコンポーネントとして LLM が作る
- チャート、テーブル、アイコンセット等もすべて LLM がその場で作る
- スライドの「型」（TitleSlide, SectionDivider, DataSlide 等）も LLM がコンポーネント化してよい

### assets/ のルール

- フォントは `assets/fonts/` に配置。ユーザーが事前に用意する
- 画像・SVG は `assets/` 直下またはサブディレクトリに配置
- SVG の活用を積極的に行う（LLM が直接 SVG を書く）

---

## SlideLayout.astro の設計

### Web とスライドの根本的な違い

Web ページは縦に無限スクロールする。スライドは固定サイズの箱。はみ出したら切れる。これがプロジェクト全体の設計を支配する最重要制約。

### HTML 構造

```astro
<div class="slide-frame">
  <header class="slide-header">
    <slot name="header" />
  </header>
  <main class="slide-content">
    <slot />
  </main>
  <footer class="slide-footer">
    <slot name="footer" />
  </footer>
</div>

<style>
  .slide-frame {
    width: var(--slide-width, 1920px);
    height: var(--slide-height, 1080px);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-family-sans);
  }
  .slide-content {
    flex: 1;
    padding: var(--content-padding);
    overflow: hidden;
  }
</style>
```

### アスペクト比とサイズ

| プリセット | 幅 | 高さ | 用途 |
|-----------|------|------|------|
| 16:9 | 1920px | 1080px | 標準プレゼン（デフォルト） |
| 4:3 | 1440px | 1080px | レガシー |
| A4 | 794px | 1123px | 印刷用ドキュメント |
| A4-landscape | 1123px | 794px | 印刷用横向き |
| poster | 3840px | 2160px | ポスター |

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

LLM はプロジェクト開始時に SlideLayout.astro のトンマナ部分をカスタマイズする。ただし slot 構造と固定枠の仕組みは壊さない。

### CSS Custom Properties

**タイポグラフィ:**
- `--font-size-title`, `--font-size-heading`, `--font-size-body`, `--font-size-caption`
- `--font-family-sans`, `--font-family-mono`

**カラー:**
- `--color-primary`, `--color-secondary`, `--color-accent`
- `--color-bg`, `--color-text`, `--color-muted`, `--color-border`
- `--color-chart-1` 〜 `--color-chart-6`
- `theme="dark"` / `theme="light"` でセット切替

**スペーシング:**
- `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (32px), `--space-xl` (64px)

**レイアウト:**
- `--slide-width`, `--slide-height`, `--content-padding`

### Props インターフェース

`aspectRatio` とサイズ定義は `SlideLayout.astro` に持たせてよい。ただし以下は一例であり、プロジェクトに応じて変更可能。

```typescript
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
```

frontmatter が渡された場合、個別 Props より frontmatter の値が優先される。

### SlideLayout.astro が担当しないこと

- コンテンツのレイアウトパターン → LLM が components/ に作る
- チャートの描画 → LLM が components/ に作る or SVG 直書き
- 画像の配置 → 各スライドが自由に決める
- アニメーション → HTML 出力時にビルドスクリプトが付与
- スライドの「型」の定義 → LLM が自由に作る

---

## Tailwind CSS

### スライド用カスタマイズ

Web 用の Tailwind デフォルト設定ではなく、スライド用にカスタマイズする。

```js
// tailwind.config.mjs
export default {
  theme: {
    screens: {},  // レスポンシブブレークポイントは不要
    extend: {
      width: { 'slide': 'var(--slide-width)' },
      height: { 'slide': 'var(--slide-height)' },
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
          5: 'var(--color-chart-5)',
          6: 'var(--color-chart-6)',
        }
      },
      fontSize: {
        'slide-title': 'var(--font-size-title)',
        'slide-heading': 'var(--font-size-heading)',
        'slide-body': 'var(--font-size-body)',
        'slide-caption': 'var(--font-size-caption)',
      },
      spacing: {
        'slide-xs': 'var(--space-xs)',
        'slide-sm': 'var(--space-sm)',
        'slide-md': 'var(--space-md)',
        'slide-lg': 'var(--space-lg)',
        'slide-xl': 'var(--space-xl)',
      }
    }
  }
}
```

### 設計意図

Tailwind の設定が CSS custom properties にマッピングされることで、LLM が `text-primary` や `gap-slide-md` と書くだけで自動的にデザインシステムに準拠する。ハードコードの余地をなくす規約強制装置。

### 無効化するもの

- `screens`（レスポンシブ）— スライドは固定サイズ
- `container` — 不要
- デフォルトのカラーパレット — プロジェクト定義のカラーのみに制限（検討中）

---

## ビルドスクリプト

### npm run build:pdf（scripts/build-pdf.mjs）

```
引数: --deck <deck-name> | --all

Astro build（静的 HTML 生成）
  → 指定デッキの `main.html` を Playwright で開く
  → HTML 内の各スライド要素を順番に PDF 化
  → pdf-lib で1つの PDF に結合
  → 出力: dist/<deck-name>.pdf
```

実装ポイント:
- Playwright は Chromium モードで `page.pdf()` を使用
- ページサイズはプロジェクトの既定アスペクト比を参照する
- 16:9 の場合: 幅 254mm × 高さ 142.9mm
- 高解像度オプション（ポスター出力用）も対応
- `--all` 指定時は全デッキを一括ビルド

### npm run build:html（scripts/build-html.mjs）

```
引数: --deck <deck-name> | --all

Astro build（静的 HTML 生成）
  → 指定デッキの `main.html` を読み込み
  → スライドナビゲーション JS を注入（キーボード操作、トランジション）
  → CSS・JS・フォント・画像をすべてインライン化
  → 出力: dist/<deck-name>.html（完全スタンドアロン）
```

実装ポイント:
- 依存ゼロのスタンドアロン HTML。ブラウザで開くだけでプレゼン可能
- メールで送れるサイズ感を意識
- キーボードナビゲーション（← → キー、スペースキー）
- CSS トランジション（フェード or スライド）
- フルスクリーンモード対応
- 画像・フォントは Base64 インライン化

### package.json scripts

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

## LLM 品質チェック（build:png）

build:png は Claude Code がスライドの品質を自律チェックするための出力形式。LLM は PNG を直接コンテキストウィンドウに読み込んで視覚的に評価できる。PDF より高速に生成でき、LLM との相性が最も良い。

### チェックフロー

```
Claude Code がスライド生成
  → npm run build:png -- --deck <n>
  → dist/<deck-name>/png/01.png, 02.png, ... が出力される
  → Claude Code が PNG を直接見て品質判断
    - テキストがはみ出していないか
    - 余白は適切か
    - 色のコントラストは十分か
    - 全体の統一感はあるか
  → 問題があれば修正 → 再度 build:png
  → OK なら build:pdf / build:html
```

### scripts/check-slides.spec.mjs

- Playwright Test として実装
- 全ページのスクリーンショットを `screenshots/` に保存
- Claude Code の MCP 経由で Playwright を操作可能 → エージェントの自律的品質改善ループ

---

## 依存パッケージ

```json
{
  "dependencies": {
    "astro": "^5.x",
    "@astrojs/tailwind": "^6.x",
    "tailwindcss": "^4.x"
  },
  "devDependencies": {
    "playwright": "^1.x",
    "pdf-lib": "^1.x"
  }
}
```

### 意図的に含めないもの

- Chart.js, D3.js, Mermaid 等 → LLM が必要に応じてインストール or SVG 直書き
- フォントファイル → ユーザーが用意
- デフォルト Tailwind カラーパレット → プロジェクト定義のトークンのみ

---

## AGENTS.md の設計方針

### ルート AGENTS.md

- プロジェクト概要
- ワークフロー（要件確認 → 構成設計 → コンポーネント作成 → スライド作成 → チェック → ビルド）
- デザイン原則（固定枠、1スライド1メッセージ、余白、色の節度等）
- 禁止事項
- ビルドコマンド

### src/components/AGENTS.md

- コンポーネント設計の指針（再利用性、Props 定義、Tailwind クラス使用）
- 作るべきコンポーネントの例（レイアウトパターン、スライドの型、データ表示）
- チャート・図表ガイド（SVG 優先、ライブラリ使用の判断基準）
- コード例

### src/pages/AGENTS.md

- スライドの書き方（frontmatter、SlideLayout の使い方）
- ファイル命名規則
- スライド構成パターン（タイトル→アジェンダ→本体→サマリー）
- レイアウトパターン集

---

## 配布戦略

### Phase 1: npm create edition

`npm create slaide` で Astro プロジェクトが出てくる。AGENTS.md 入り。

```bash
npm create slaide my-deck
cd my-deck
npm install
# → Claude Code / Codex / Cursor で「ピッチデッキ作って」
```

`create-slaide` npm パッケージの中身はテンプレートファイル群をコピーするだけの scaffolding CLI。

### monorepo での使い方

```
client-project/
├── app/                  ← アプリ本体
├── infra/                ← Terraform 等
├── docs/                 ← ドキュメント
└── slides/               ← npm create slaide で生成
    ├── package.json
    ├── src/pages/
    │   ├── proposal/     ← 提案資料
    │   └── report/       ← 報告資料
    └── ...
```

```json
// ルートの package.json
{
  "workspaces": ["app", "slides"]
}
```

### Phase 2: SKILL edition（後回し）

- SKILL.md は薄いオーケストレーター（プロジェクト生成 → AGENTS.md に委譲）
- Astro をブラックボックス化。ユーザーには PDF/HTML だけが見える
- Eject で npm create edition 相当に変換可能
- 未解決: フォント・素材の提供方法

---

## 実装優先順位

### Phase 1: 最小構成で動くもの

1. プロジェクト初期化（package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json）
2. SlideLayout.astro（固定枠 + CSS custom properties によるデザインシステム）
3. AGENTS.md 群（ルート、components/、pages/）
4. サンプルデッキ1つ（sample/ に main.astro + slides/）
5. build-pdf.mjs（Playwright → PDF、--deck 対応）
6. build-html.mjs（main.html 後処理 + ナビゲーション、--deck 対応）

### Phase 2: 品質向上

7. Playwright ビジュアルチェック（check-slides.spec.mjs）
8. AGENTS.md のデザイン原則を充実
9. 複数テーマ対応（light / dark / custom）
10. ポスター出力モード

### Phase 3: 配布

11. `npm create slaide` scaffolding CLI（create-slaide パッケージ）
12. GitHub テンプレートリポジトリ化（補助）
13. README.md / ドキュメント整備

### Phase 4: SKILL edition

14. SKILL.md（薄いオーケストレーター）
15. ブラックボックス化の実装
16. Eject 機能
17. フォント・素材問題の解決

---

## 未決事項

- プロジェクト名: `slaide`（slide + AI）に確定
- フォント戦略: どのフォントを推奨するか。バンドルはしない
- HTML 出力時のアニメーション/トランジション: reveal.js 風にするか独自実装か
- PPTX 出力: スコープ外。将来対応の可能性はあるが優先度低
- Tailwind デフォルトカラーの扱い: 完全無効化してプロジェクト定義のみにするか、共存させるか
