# slaide

自然言語からコンサル品質のスライドを生成し、PDF/HTML で出力するプロジェクト。

## クイックリファレンス

```bash
npm run dev                              # プレビュー
npm run build:png -- --deck <n>       # PNG 出力（LLM 品質チェック用）
npm run build:pdf -- --deck <n>       # PDF 出力
npm run build:html -- --deck <n>      # スタンドアロン HTML 出力
npm run build:pdf -- --all               # 全デッキ一括 PDF
```

## 最重要ルール: スライドは固定枠

Web は縦にスクロールする。**スライドは 1920×1080px の箱。はみ出したら切れる。**
すべてのレイアウト判断は「この箱に収まるか」が基準。
テキストが多すぎるならテキストを減らせ。フォントを小さくするのは最終手段。
収まらないならスライドを分割せよ。

## ワークフロー

### Step 1: 要件の確認

以下を明確にする（不明ならユーザーに質問する）:

- 何のスライドか（ピッチデッキ、提案資料、報告等）
- 対象者は誰か（投資家、クライアント、経営陣等）
- スライド枚数の目安
- トーン（フォーマル/カジュアル、dark/light）
- 含めるべきデータやチャートの有無
- デッキ名（`src/pages/` 配下のディレクトリ名になる）

### Step 2: デッキ構成の設計

スライドを書く前に全体構成を設計する。

1. デッキ名と全体構成を決める
2. SlideLayout.astro のトンマナをプロジェクトに合わせてカスタマイズ（色、フォント、余白。固定枠の構造は壊さない）
3. 必要なコンポーネントを洗い出す
4. スライドの順番とレイアウトを決める
5. ユーザーに構成案を提示して確認を取る

### Step 3: コンポーネント作成

デッキに必要な再利用可能コンポーネントを `src/components/` に作成する。
→ 詳細は `src/components/AGENTS.md` を参照

### Step 4: スライド作成

`src/pages/<deck-name>/` に `01.astro` から順番にスライドを作成する。
→ 詳細は `src/pages/AGENTS.md` を参照

### Step 5: 品質チェック（build:png）

```bash
npm run build:png -- --deck <n>
# → dist/<n>/png/01.png, 02.png, ... が出力される
```

PNG を見てチェックする:
- テキストやチャートが枠外にはみ出していないか
- 余白は十分か（スライドの40-50%は余白であるべき）
- 色・フォントの統一感があるか
- SVG やチャートが正しく表示されているか

問題があれば修正して再度 build:png。OK になるまで繰り返す。

### Step 6: ビルド

```bash
npm run build:pdf -- --deck <n>     # dist/<n>.pdf
npm run build:html -- --deck <n>    # dist/<n>.html
```

## プロジェクト構造

```
├── AGENTS.md                    ← 今読んでいるファイル
├── astro.config.mjs
├── tailwind.config.mjs          ← スライド用トークン設定済み
├── package.json
│
├── scripts/
│   ├── build-png.mjs            ← Playwright → PNG（LLM 品質チェック用）
│   ├── build-pdf.mjs            ← Playwright → PDF
│   └── build-html.mjs           ← HTML結合 + Presenterランタイム注入
│
├── assets/
│   └── fonts/                   ← ユーザーが事前配置
│
└── src/
    ├── layouts/
    │   └── SlideLayout.astro    ← 固定枠 + デザインシステム
    ├── components/
    │   └── AGENTS.md            ← コンポーネント設計ガイド
    ├── presenter/               ← プレゼンテーションランタイム
    │   ├── PresenterLayout.astro ← Presenterの外枠（build:html 用）
    │   ├── components/
    │   │   ├── Navigation.astro
    │   │   ├── ProgressBar.astro
    │   │   ├── SlideCounter.astro
    │   │   └── PresenterNotes.astro
    │   ├── presenter.ts         ← 最小限のJS（キーボード制御、状態管理）
    │   ├── transitions.css      ← トランジション定義
    │   └── AGENTS.md            ← ランタイムカスタマイズガイド
    └── pages/
        ├── AGENTS.md            ← スライドの書き方
        └── <deck-name>/
            ├── 01.astro
            └── ...
```

## SlideLayout.astro

2つの役割:

**固定枠（壊すな）:** 1920×1080px、overflow: hidden、slot構造

**トンマナ（カスタマイズしろ）:** CSS custom properties の値、ヘッダー/フッターのデザイン

プロジェクト開始時にカラーパレット、フォント、余白をブランドに合わせて調整する。

## Presenter

build:html の出力はプレゼンテーションソフト。`src/presenter/` に Astro コンポーネントとして UI パーツが入っている。

- PresenterLayout.astro が全スライドをラップ（build:html 時のみ使用）
- UI パーツ（ナビゲーション、プログレスバー等）は Astro コンポーネント
- presenter.ts は最小限のJS（キーボード制御、状態管理のみ）
- transitions.css にトランジションアニメーション定義
- カスタマイズは `src/presenter/AGENTS.md` を参照

## Tailwind CSS

`tailwind.config.mjs` で CSS custom properties が Tailwind トークンにマッピング済み。

**必ず Tailwind クラスを使うこと。CSS でハードコードしない。**

```html
<!-- 良い -->
<h2 class="text-slide-heading text-primary font-bold">タイトル</h2>

<!-- 悪い -->
<h2 style="font-size:36px; color:#2563eb;">タイトル</h2>
```

主要トークン:
- 色: `text-primary`, `text-secondary`, `text-accent`, `text-muted`, `bg-chart-1` 〜 `bg-chart-6`
- フォントサイズ: `text-slide-title`, `text-slide-heading`, `text-slide-body`, `text-slide-caption`
- スペーシング: `p-slide-sm`, `gap-slide-md`, `m-slide-lg` 等

## デザイン原則

1. **固定枠に収めろ** — はみ出したら切れる。最重要
2. **1スライド1メッセージ** — タイトルがそのスライドのキーメッセージ
3. **余白を恐れるな** — 40-50%は余白。余白は高級感
4. **タイポグラフィの階層厳守** — title > heading > body > caption。中間サイズを作らない
5. **色は3色以内** — 背景・テキスト除く。チャート色は `chart-1` 〜 `chart-6`
6. **左揃え基本** — センター揃えはタイトルスライドとセクション区切りのみ
7. **データインクレシオ** — チャートの装飾を排除。3D禁止。ラベルは最小限

## 禁止事項

1. **固定枠を壊す** — overflow: hidden や固定サイズの slot 構造を変更しない
2. **はみ出しを放置** — テキストやチャートが切れていないか必ず確認
3. **Tailwind を使わずハードコード** — `style="color: #FF0000"` 禁止。`class="text-accent"` を使う
4. **テキスト詰め込み** — 文章ではなくキーワードとフレーズで伝える
5. **フォントサイズ階層崩し** — `text-[18px]` 等の arbitrary value 禁止
6. **画像のアスペクト比崩し** — `object-contain` / `object-cover` を使う
7. **色の使いすぎ** — 1スライドの有彩色は5色以内
8. **アニメーション記述** — アニメーションは HTML ビルド時に Presenter が注入。スライド側では不要

## マルチデッキ

`src/pages/` 直下のディレクトリが1つのデッキ。Phase 1 ではデッキ設定ファイルは持たず、各スライドの frontmatter と SlideLayout のデフォルトで構成する。

将来的にビルド専用メタデータが必要になった場合だけ、別ファイルを追加検討する。
