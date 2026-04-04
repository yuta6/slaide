# slaide

**自然言語からコンサル品質のスライド・ドキュメントを生成し、PDF/HTML で出力する Astro ベースのビルドインフラ。**

---

## 提供価値

- Claude Code / Codex CLI のサブスクさえあれば、自然言語で「〇〇のプレゼン作って」と言うだけでコンサル品質のスライドが出てくる
- API 課金ゼロ。追加 SaaS 不要
- エージェントがローカルのファイルを編集して自動でスライドを生成する世界観
- `npm run build` → 配布可能なスタンドアロン HTML プレゼン
- `npm run build:pdf` → ベクター PDF
- `npm run build:png` → LLM 用の見た目チェック画像

---

## ツールの正体

- **Astro プロジェクトテンプレート**: deck ごとの `index.astro`、`DeckLayout.astro`、`SlideLayout.astro` を軸にした構成
- **AGENTS.md**: プロジェクト内に埋め込まれた指示書。Claude Code / Codex が自動で読み込み、スライドの作り方を理解する
- **ビルドスクリプト**: Astro build を基点に、Playwright で PNG/PDF を生成する export layer

---

## 設計原則

1. **スライドは固定枠。** Web と根本的に違う。1920×1080px の箱。はみ出したら切れる。これが最重要制約
2. **コンポーネントは事前定義しない。** LLM がプロジェクトごとに最適なコンポーネントを作る
3. **SlideLayout.astro が 1枚のスライドを規律づける。** 固定枠、design tokens、header/content/footer 構造
4. **DeckLayout.astro がプレゼンアプリを担う。** viewport fit、ナビゲーション、notes、progress bar
5. **Astro scoped CSS が規約の強制装置。** Tailwind は使わず、CSS custom properties を軸にする
6. **AGENTS.md が品質を担保する。** LLM にスライド設計、コンポーネント設計、品質チェックの流れを教える
7. **Presenter は自前実装。** reveal.js 等の既存フレームワークは使わない

---

## 既存ツールとの違い

| | slaide | Marp | Slidev | reveal.js |
|--|--------|------|--------|-----------|
| 入力 | 自然言語 | Markdown | Markdown | HTML/Markdown |
| 誰が書く | LLM エージェント | 人間 | 人間 | 人間 |
| 品質チェック | LLM が `build:png` で自己チェック | 人間が目視 | 人間が目視 | 人間が目視 |
| デザインの自由度 | 高い（Astro + CSS custom properties） | テーマ制約 | テーマ制約 | テーマ制約 |
| Presenter カスタマイズ | LLM が直接コード変更可能 | 設定変更中心 | 設定変更中心 | 設定変更 + プラグイン |
| PDF 出力 | Chromium print-to-PDF | Playwright/Chrome | Playwright | ブラウザ印刷 |
| HTML プレゼン | スタンドアロン HTML | スタンドアロン | SPA | SPA |

### 本質的な違い

既存ツールは **「人間が Markdown/HTML を書く」** 前提で設計されている。slaide は **「LLM エージェントがスライドを生成し、品質チェックまで含めて自律的に回す」** 前提で設計されている。

---

## Presenter に reveal.js を使わない理由

3つの案を比較した結果:

**A案: Astro + 自前 Presenter（採用）**
- DeckLayout に直接 runtime を持てる
- CSS custom properties と完全に統合できる
- AI が Presenter 自体を自由に直せる

**B案: Astro + reveal.js（不採用）**
- 既存 CSS と競合しやすい
- カスタマイズの中心が reveal.js の流儀になる

**C案: reveal.js のみ（不採用）**
- Astro の component system と scoped CSS を捨てることになる

**結論:** 軽量な自前 Presenter の方が、テンプレート構造・デザイン・AI 編集体験のすべてに相性が良い。

---

## 2つのエディション

### npm create edition（Phase 1-3）

```bash
npm create slaide@latest my-slides
cd my-slides
npm install
# → Claude Code / Codex / Cursor 等で「ピッチデッキ作って」
```

- 対象: 開発者、カスタマイズ重視
- Astro プロジェクト全体が見える
- DeckLayout / SlideLayout / コンポーネントを直接編集できる
- AGENTS.md がプロジェクト内に入り、AI が自動で読む
- 1プロジェクトで複数デッキを管理できる

### SKILL edition（Phase 4）

```bash
claude skill install slaide
# → 「プレゼン作って」で全自動
```

- 対象: 非開発者、速さ重視
- Astro を隠蔽し、ユーザーには PDF/HTML だけを見せる
- 内部でプロジェクトを生成し、成果物だけ返す
- 必要なら eject して npm create edition 相当にできる

### 共通基盤

共通基盤は **AGENTS.md + Astro プロジェクトテンプレート** である。

---

## 依存パッケージ

```json
{
  "dependencies": {
    "astro": "^5.x"
  },
  "devDependencies": {
    "playwright": "^1.x",
    "vite-plugin-singlefile": "^2.x"
  }
}
```

### 意図的に含めないもの

- Tailwind CSS → Astro scoped CSS + CSS custom properties で十分
- Chart.js, D3.js, Mermaid 等 → LLM が必要に応じて追加する
- フォントファイル → ユーザーが用意する
