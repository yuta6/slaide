# コンポーネント設計ガイド

## 原則

**コンポーネントは事前定義されていない。デッキの要件に合わせて自由に作る。**

再利用されるパターンをコンポーネントとして切り出す。1回しか使わないものはコンポーネント化不要。

## 作るべきコンポーネントの例

**レイアウトパターン:**
- `TwoColumn.astro` — 左右2カラム（slot="left", slot="right"）
- `ThreeColumn.astro` — 3カラム
- `FullBleed.astro` — パディングなしの全面表示
- `CenterContent.astro` — 中央配置

**スライドの型:**
- `TitleSlide.astro` — タイトルスライド用
- `SectionDivider.astro` — セクション区切り
- `AgendaSlide.astro` — アジェンダ/目次

**データ表示:**
- `DataTable.astro` — テーブル
- `KeyMetric.astro` — KPI ハイライト（大きな数字 + ラベル）
- `Takeaways.astro` — 要点リスト（アイコン + テキスト）

## 設計ルール

1. Props を明確に型定義する
2. **Tailwind クラスを使う。CSS ハードコード禁止。** `text-primary`, `gap-slide-md` 等のデザイントークンを使う
3. slot を活用して柔軟に子要素を受け取れるようにする
4. 1コンポーネント1ファイル

## 良い例

```astro
---
interface Props {
  items: { icon?: string; text: string; highlight?: boolean }[];
}
const { items } = Astro.props;
---
<ul class="flex flex-col gap-slide-sm list-none p-0">
  {items.map(item => (
    <li class:list={[
      "text-slide-body py-slide-sm px-slide-md border-l-3",
      item.highlight ? "border-primary font-bold" : "border-muted"
    ]}>
      {item.icon && <span class="mr-slide-xs">{item.icon}</span>}
      <span>{item.text}</span>
    </li>
  ))}
</ul>
```

## チャート・図表

### SVG を優先する

シンプルな図やアイコンは SVG で直接書く。

```astro
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="100" width="60" height="100" fill="var(--color-chart-1)" />
  <rect x="100" y="60" width="60" height="140" fill="var(--color-chart-2)" />
  <rect x="180" y="20" width="60" height="180" fill="var(--color-chart-3)" />
</svg>
```

SVG 内の色も CSS custom properties を使うこと。

### SVG が適するもの

- フローチャート・プロセス図・組織図
- シンプルな棒グラフ・円グラフ（データ5点以下）
- アイコン・ピクトグラム
- 概念図・模式図・タイムライン
- マトリクス（2x2等）

### ライブラリが必要な場合

データが多い・軸ラベルや凡例が必要な場合:

1. `npm install chart.js` 等でインストール
2. コンポーネントとしてラップ
3. `client:load` でクライアントサイドレンダリング

使い分け:
- データ5点以下 → SVG 直書き
- データ多数・軸・凡例 → Chart.js / ECharts
- フローチャート → Mermaid or SVG
- 完全カスタム → D3.js
