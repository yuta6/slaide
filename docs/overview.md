# slaide

**自然言語からコンサル品質のスライド・ドキュメントを生成し、PDF/HTML で出力する Astro ベースのビルドインフラ。**

---

## 提供価値

- Claude Code / Codex CLI のサブスクさえあれば、自然言語で「〇〇のプレゼン作って」と言うだけでコンサル品質のスライドが出てくる
- API 課金ゼロ。追加 SaaS 不要
- エージェントがローカルのファイルを編集して自動でスライドを生成する世界観
- `npm run build:pdf` → スライド PDF
- `npm run build:html` → アニメーション付きワンファイル HTML プレゼン（ブラウザさえあればプレゼンできる）

---

## ツールの正体

- **Astro プロジェクトテンプレート**: ビルドパイプライン + デザインシステムを強制する SlideLayout + CSS custom properties
- **AGENTS.md**: プロジェクト内に埋め込まれた指示書。Claude Code が自動で読み込み、スライドの作り方を理解する
- **ビルドスクリプト**: Astro build → Playwright → PNG/PDF 生成 + HTML後処理

---

## 設計原則

1. **スライドは固定枠。** Web と根本的に違う。1920×1080px の箱。はみ出したら切れる。これが全設計を支配する最重要制約
2. **コンポーネントは事前定義しない。** LLM がプロジェクトごとに最適なコンポーネントを作る。プリセットは柔軟性を殺す
3. **SlideLayout.astro がトンマナを強制する。** 固定枠の提供 + カラー・フォント・余白の体系。CSS custom properties で定義し、main.astro で上書き可能
4. **Astro scoped CSS が規約の強制装置。** Tailwind は使わない。CSS custom properties をデザイントークンとし、各コンポーネントの `<style>` で参照する
5. **AGENTS.md が品質を担保する。** コンポーネント作成・SVG 活用・デザイン原則を LLM に教える
6. **フォント・素材はユーザーが用意する。** ツールにはバンドルしない
7. **Presenter は自前実装。** reveal.js 等の既存プレゼンフレームワークは使わない

---

## 既存ツールとの違い

| | slaide | Marp | Slidev | reveal.js |
|--|--------|------|--------|-----------|
| 入力 | 自然言語 | Markdown | Markdown | HTML/Markdown |
| 誰が書く | LLM エージェント | 人間 | 人間 | 人間 |
| 品質チェック | LLM が build:png で自己チェック | 人間が目視 | 人間が目視 | 人間が目視 |
| デザインの自由度 | 無限（Astro + CSS custom properties） | テーマ制約 | テーマ制約 | テーマ制約 |
| Presenter カスタマイズ | LLM が自然言語で機能追加可能 | 設定変更のみ | 設定変更のみ | 設定変更 + プラグイン |
| PDF 出力 | Playwright | Playwright/Chrome | Playwright | ブラウザ印刷 |
| PPTX 出力 | スコープ外 | 画像埋め込み（非編集） | 画像埋め込み（非編集） | 非対応 |
| HTML プレゼン | スタンドアロン1ファイル | スタンドアロン | SPA（要ホスティング） | SPA |

### 本質的な違い

既存ツールはすべて **「人間が Markdown/HTML を書く」** 前提で設計されている。slaide は **「LLM エージェントが自律的にスライドを生成し、自己チェックし、品質が出るまでイテレーションする」** 前提で設計されている。レイヤーが一段上。

Marp/Slidev/reveal.js は「Markdown を書くだけでスライドができる」を価値とする。slaide は「自然言語で言うだけでスライドができる」を価値とする。ユーザーはコードを一行も書かない。

---

## Presenter に reveal.js を使わない理由

3つの案を検討した結果:

**A案: Astro + 自前 Presenter（採用）**
- JS ~100行 + CSS ~50行。軽量
- CSS custom properties と完全に統合。デザインの衝突ゼロ
- LLM が Presenter のコンポーネント（Timer, SlideGrid 等）を自由に追加可能
- Presenter 自体が AI カスタマイズ可能という差別化ポイント

**B案: Astro + reveal.js（不採用）**
- reveal.css（54KB）が CSS と衝突する
- Presenter のカスタマイズが「reveal.js の設定変更」に制限される

**C案: reveal.js のみ（不採用）**
- Astro のコンポーネントシステム、スコープド CSS がなくなる

**結論:** Presenter に必要な機能は自前で ~150行で実装できる。reveal.js の 115KB + 54KB を入れて CSS の衝突と戦うより、自前の方が軽量・シンプル・カスタマイズ自由。

---

## 2つのエディション

### npm create edition（Phase 1-3 — 先に作る）

```bash
npm create slaide my-slides
cd my-slides
npm install
# → Claude Code / Codex / Cursor 等で「ピッチデッキ作って」
```

- 対象: 開発者、カスタマイズ重視の人
- Astro プロジェクト全体が見える
- SlideLayout.astro やコンポーネントを直接編集できる
- AGENTS.md がプロジェクト内に入っており、Claude Code が自動で読む
- 1プロジェクトで複数デッキを管理できる

### SKILL edition（Phase 4 — 後で作る）

```bash
claude skill install slaide
# → 「プレゼン作って」で全自動
```

- 対象: 非開発者、速さ重視の人
- Astro を隠蔽。ユーザーには PDF/HTML だけが見える
- 内部で .slaide/ にプロジェクトを展開し、ビルドして成果物だけ返す
- 「ソース見せて」と言えば Eject（npm create edition 相当に変換）できる

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

---

## 依存パッケージ

```json
{
  "dependencies": {
    "astro": "^5.x"
  },
  "devDependencies": {
    "playwright": "^1.x",
    "pdf-lib": "^1.x"
  }
}
```

### 意図的に含めないもの

- Tailwind CSS → Astro scoped CSS + CSS custom properties で十分。必要なら後から追加可能
- Chart.js, D3.js, Mermaid 等 → LLM が必要に応じてインストール or SVG 直書き
- フォントファイル → ユーザーが用意
