# slaide 技術設計ドキュメント

このドキュメントは slaide の「どう作るか」を定義する。

---

## アーキテクチャ全体像

```
[自然言語]
    ↓  Claude Code / Codex（AGENTS.md に従って）
[src/pages/<deck>/index.astro] + [DeckLayout.astro] + [_slides/*.astro] + [共有コンポーネント]
    ↓
[Astro Build]
    ↓
[dist/index.html] + [dist/<deck>.html（自己完結した HTML プレゼン）]
    ↓                    ↓
[build-png.mjs]      [build-pdf.mjs]
    ↓                    ↓
[Playwright]         [Playwright + Chromium print-to-PDF]
    ↓                    ↓
[PNG（LLM確認用）]   [ベクター PDF]
```

### 3つの出力形式

| コマンド | 出力 | 対象 | 用途 |
|---------|------|------|------|
| `build` | スタンドアロン HTML | 人間 | ブラウザでのプレゼン、共有、配布 |
| `build:png` | スライドごとの PNG（ラスター） | LLM | 品質チェック。見た目の崩れ確認 |
| `build:pdf` | ベクター PDF | 人間 | 配布、印刷、メール添付 |

`npm run build` の時点で `dist/<deck>.html` はプレゼンアプリとして動作する。`build:png` と `build:pdf` はその HTML に対して export をかける。

---

## プロジェクト構造

1 repo N decks。`src/pages/` 配下のディレクトリが1つのデッキに対応する。

```
my-slides/
├── package.json                ← astro / playwright / vite-plugin-singlefile
├── astro.config.mjs
├── tsconfig.json
├── AGENTS.md                   ← プロジェクトルートの指示書
│
├── scripts/
│   ├── build-png.mjs           ← Playwright -> PNG（LLM 品質チェック用）
│   ├── build-pdf.mjs           ← Playwright page.pdf() -> ベクター PDF
│   └── lib/
│       ├── astro-inline-css.mjs← Astro build 後に CSS を HTML にインライン化
│       └── deck-utils.mjs      ← deck 解決と preview server 起動
│
└── src/
    ├── assets/
    │   └── shared/             ← 共有画像・共通アセット
    ├── components/
    │   └── SlideLayout.astro   ← 固定枠 + デザインシステム（各スライド共通）
    ├── layouts/
    │   └── DeckLayout.astro    ← Presenter shell + runtime
    └── pages/
        ├── index.astro         ← デッキ一覧ページ
        ├── _AGENTS.md          ← スライドの書き方ガイド
        └── your-deck/
            ├── index.astro
            ├── _assets/
            └── _slides/
```

### `_` prefix について

Astro は `src/pages/` 内のファイルをルーティング対象にする。`_slides/` と `_assets/` は deck の部品であり単独ページではないので `_` prefix を付ける。`_AGENTS.md` も同様にルーティングから外している。

---

## Deck 構成

### `index.astro` が順序の唯一の真実

スライド順序の唯一の真実は `src/pages/<deck-name>/index.astro` に置く。

```astro
---
import DeckLayout from '../../layouts/DeckLayout.astro';
import Title from './_slides/Title.astro';
import Summary from './_slides/Summary.astro';
---

<DeckLayout title="Presentation Title">
  <Title />
  <Summary />
</DeckLayout>
```

- deck 単位の HTML タイトルは `DeckLayout` の `title` prop で与える
- スライド順序は JSX の並び順で決まる
- deck ごとのトンマナ変更は `index.astro` の `<style is:global>` で行う

### `DeckLayout.astro`

`DeckLayout.astro` は **プレゼンアプリ全体の shell** である。

役割:

1. Presenter viewport の提供
2. slide-scaler による viewport fit
3. キーボード・クリック・タッチ操作
4. プログレスバーとスピーカーノート UI
5. スライド表示切替の runtime

`build` 後の HTML は `DeckLayout.astro` のおかげで、そのままプレゼンアプリとして動く。

### `SlideLayout.astro`

`SlideLayout.astro` は **1枚のスライド** を表す。

役割:

1. 固定サイズ + overflow hidden
2. ヘッダー / コンテンツ / フッター構造
3. アスペクト比の切替
4. CSS custom properties による design token 提供

### `SlideLayout` Props

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

---

## デザインシステム

### アスペクト比とサイズ

| プリセット | 幅 | 高さ | 用途 |
|-----------|------|------|------|
| 16:9 | 1920px | 1080px | 標準プレゼン（デフォルト） |
| 4:3 | 1440px | 1080px | レガシー |
| A4 | 794px | 1123px | 印刷用ドキュメント |
| A4-landscape | 1123px | 794px | 印刷用横向き |

### CSS Custom Properties

**タイポグラフィ:** `--font-size-title`, `--font-size-heading`, `--font-size-body`, `--font-size-caption`, `--font-family-sans`, `--font-family-mono`

**カラー:** `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text`, `--color-muted`, `--color-border`, `--color-chart-1` 〜 `--color-chart-6`

**スペーシング:** `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`, `--content-padding`

deck ごとのトンマナは `index.astro` の `<style is:global>` で上書きする。

---

## ビルドパイプライン

### `astro build`

`astro build` は deck ごとに `dist/<deck>.html` を生成する。

現行設計では:

- `vite-plugin-singlefile` で JS を単一 HTML に寄せる
- `astro-inline-css` integration で CSS を `<style>` にインライン化する

そのため `dist/<deck>.html` は自己完結した HTML プレゼンとして配布できる。

### `build-png.mjs`

```
1. `dist/` を Vite preview server で HTTP 配信
2. `dist/<deck>.html` を Playwright で開く
3. Presenter 用レイアウトを一時的に解除して全スライドを見える状態にする
4. `[data-slide]` を列挙
5. 各スライド要素を screenshot して PNG に出力
```

PNG はラスターだが、LLM の視覚確認が目的なので問題ない。

### `build-pdf.mjs`

```
1. `dist/` を Vite preview server で HTTP 配信
2. `dist/<deck>.html` を Playwright で開く
3. フォント読み込み完了を待機
4. print CSS を注入し、1 slide = 1 page の印刷レイアウトに変換
5. page.pdf() でベクター PDF を生成
6. `dist/<deck>.pdf` に保存
```

`page.pdf()` を使うことで:

- テキスト選択ができる
- リンクが生きる
- SVG や文字がラスター化されにくい

### `astro-inline-css.mjs`

Astro は build 時に `_astro/*.css` を外部ファイルとして出す。`astro-inline-css.mjs` は build 完了後に HTML を走査し、`<link rel="stylesheet">` を `<style>` に置き換える。これで deck HTML を単一ファイルとして持ち運べる。

### `deck-utils.mjs`

共通 helper 2つを持つ。

1. `resolveDecks(values)`  
   `--deck` がなければ `dist/*.html` を見て deck 一覧を解決する

2. `startPreviewServer()`  
   `dist/` を Vite preview server で HTTP 配信する。`file://` より asset 解決が安定する

---

## Presenter 実装の考え方

現行設計では Presenter runtime は `DeckLayout.astro` の `<script>` に入っている。これは実装を 1 ファイルで見通しやすく保つための選択であり、将来的に `src/presenter/presenter.ts` へ切り出す余地はある。

重要なのは以下の責務分離である。

- `DeckLayout.astro` = プレゼン全体の shell と runtime
- `SlideLayout.astro` = 1枚の固定スライド
- `_slides/*.astro` = 実際の内容

---

## パフォーマンス考慮事項

- 単一 HTML に寄せる設計なので、画像やフォントのサイズがそのまま配布サイズに効く
- `src/assets/shared/` と deck ごとの `_assets/` は source of truth であり、`dist/` に直接 source asset を置かない
- deck 数が増えても `index.astro` ベースの構造なので運用は比較的単純

---

## 未解決の技術的課題

1. Presenter runtime を `DeckLayout.astro` 内に持ち続けるか、`presenter.ts` へ切り出すか
2. print CSS を `build-pdf.mjs` の injected string のまま持つか、専用 CSS に整理するか
3. フォントと画像の最適な配布戦略をどうするか
