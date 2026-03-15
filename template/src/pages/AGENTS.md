# スライドの書き方

## ファイル構造

`src/pages/<deck-name>/` にデッキを作る。

```
src/pages/pitch-deck/
├── main.astro              ← スライド順序を定義
└── slides/
    ├── Title.astro
    ├── Agenda.astro
    ├── MarketOverview.astro
    └── Closing.astro
```

- 順序は `main.astro` 内のコンポーネントの並び順で決まる
- スライドを途中挿入するときもリネーム不要
- `slides/` 配下のコンポーネント名は内容がわかる名前にする

## Phase 1 の考え方

Phase 1 では `_deck.json` のようなデッキ単位のデフォルト設定ファイルは持たない。

- LLM は `main.astro` に並び順を書き、各スライドコンポーネントに必要な設定を書く
- 共通の見た目は `SlideLayout.astro` に寄せる
- デッキ名や出力ファイル名は `src/pages/<deck-name>/` のディレクトリ名から決める
- 将来、ビルド専用メタデータが必要になった場合だけ別ファイルを追加する

## main.astro

`main.astro` が順序の唯一の真実になる。

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

## 各スライドコンポーネント

各スライドコンポーネントは `SlideLayout.astro` を使って1枚分の固定枠を描画する。

```astro
---
import SlideLayout from '../../../layouts/SlideLayout.astro';

const frontmatter = {
  title: "スライドタイトル",
  transition: "fade",
  theme: "dark",
  showHeader: true,
  showFooter: true,
  notes: "スピーカーノート",
};
---

<SlideLayout frontmatter={frontmatter}>
  <!-- ここにコンテンツ -->
</SlideLayout>
```

プロジェクトに応じて独自フィールドを追加してよい。

## 基本テンプレート

```astro
---
import SlideLayout from '../../../layouts/SlideLayout.astro';

const frontmatter = {
  title: "タイトル",
  transition: "fade",
};
---

<SlideLayout frontmatter={frontmatter}>
  <!-- ここにコンテンツ -->
</SlideLayout>
```

`main.astro` には順序だけを書き、`SlideLayout` の子要素に自由にコンテンツを配置する。コンポーネント、生 HTML、インライン SVG、何でも使える。

## スライド構成のパターン

### 基本構成

1. **タイトルスライド** — タイトル、サブタイトル、日付、著者
2. **アジェンダ** — 全体の流れ（3〜5項目）
3. **セクション区切り** — 各セクションの冒頭
4. **コンテンツスライド群** — 本体
5. **サマリー / Next Steps** — 要点まとめ、次のアクション
6. **クロージング** — 連絡先、Q&A、Thank you

### よく使うレイアウト

- **キーメッセージ + チャート** — 上にメッセージ、下にチャート
- **2カラム** — 左にチャート/図、右にテイクアウェイ
- **KPIダッシュボード** — 3〜4つの大きな数字を横並び
- **ビフォーアフター** — 左に現状、右に提案
- **プロセスフロー** — 横方向の矢印でステップ
- **マトリクス** — 2x2 で分類

## 品質チェックリスト

スライドを書いたら以下を確認:

- [ ] 固定枠（1920×1080px）に収まっているか
- [ ] 1スライドで伝えるメッセージは1つだけか
- [ ] タイトルがキーメッセージになっているか
- [ ] 余白は十分か（40-50%）
- [ ] Tailwind クラスのみ使っているか（ハードコードなし）
- [ ] フォントサイズは `text-slide-*` の階層内か
- [ ] 色はデザイントークン内か
- [ ] 出典はキャプションサイズで記載したか
- [ ] 画像のアスペクト比は維持されているか

`npm run build:png -- --deck <n>` で PNG を出力し、視覚的に確認すること。

## assets の使い方

- 画像: `assets/` に配置。`<img src="/assets/logo.png" />`
- SVG: インライン推奨。複雑なものは `assets/` にファイル配置
- フォント: `assets/fonts/` にユーザーが事前配置済み
