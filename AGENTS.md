# slaide — 開発ガイド

自然言語からコンサル品質のスライドを生成する Astro ベースのビルドインフラ。

## このリポジトリの構造

```
slaide/
├── AGENTS.md                    ← 今読んでいるファイル（開発者AI向け）
├── docs/
│   └── concept/
│       ├── instruction.md       ← プロジェクトの仕様（何を作るか）
│       └── designDoc.md         ← 技術設計（どう作るか）
│
├── template/                    ← npm create slaide で配布される成果物
│   ├── AGENTS.md                ← エンドユーザーAI向け（スライドの作り方）
│   ├── src/
│   │   ├── components/
│   │   │   └── AGENTS.md        ← コンポーネント設計ガイド
│   │   ├── pages/
│   │   │   └── AGENTS.md        ← スライドの書き方
│   │   └── presenter/
│   │       └── AGENTS.md        ← Presenter カスタマイズガイド
│   └── ...                      ← Astro プロジェクトの実体（Phase 1 で構築）
│
└── cli/                         ← create-slaide CLI（Phase 3）
```

## 2つのレイヤーを理解する

このリポジトリには **2つの異なるレイヤー** がある。混同しないこと。

### A: 開発レイヤー（このリポジトリ自体）

- **目的**: slaide という OSS ツールを開発する
- **対象**: このリポジトリを開発する AI / 開発者
- **仕様書**: `docs/concept/instruction.md`（何を作るか）
- **技術設計**: `docs/concept/designDoc.md`（どう作るか）

### B: テンプレートレイヤー（成果物）

- **目的**: エンドユーザーが `npm create slaide` で取得し、AI にスライドを作らせる
- **対象**: テンプレートを使ってスライドを生成する AI（Claude Code / Codex 等）
- **場所**: `template/` ディレクトリ以下すべて
- **AGENTS.md 群**: テンプレートに同梱され、エンドユーザーの AI が自動で読む

### 開発時の注意

- `template/` 内のファイルを編集するときは、**エンドユーザーの AI がこれを読む** ことを意識する
- `docs/concept/` のファイルを編集するときは、**このプロジェクトの開発仕様** を更新している
- 2つのレイヤーの AGENTS.md は目的が異なる。内容を混同しない

## 開発ワークフロー

### Phase 1: 最小構成で動くもの

1. プロジェクト初期化（`template/` 内に package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json）
2. SlideLayout.astro（固定枠 + CSS custom properties によるデザインシステム）
3. template/ 内の AGENTS.md 群の整備
4. サンプルデッキ1つ（sample/ に main.astro + slides/）
5. build-png.mjs（Playwright → PNG、LLM 品質チェック用）
6. build-pdf.mjs（Playwright → PDF、--deck 対応）
7. build-html.mjs（main.html 後処理 + Presenter ランタイム注入、--deck 対応）

### Phase 2: 品質向上

8. AGENTS.md のデザイン原則を充実
9. 複数テーマ対応（light / dark / custom）
10. ポスター出力モード

### Phase 3: 配布

11. `cli/` に create-slaide scaffolding CLI を実装
12. npm パッケージとして公開
13. README.md / ドキュメント整備

### Phase 4: SKILL edition

14. SKILL.md（薄いオーケストレーター）
15. Eject 機能

## 技術スタック

- **Astro** — 静的サイトジェネレーター。スライドをコンポーネントとして構造化
- **Tailwind CSS** — デザイントークンの強制装置
- **Playwright** — PNG / PDF 生成
- **pdf-lib** — PDF 結合
- **esbuild** — Presenter ランタイムのバンドル

## 仕様の参照先

実装に迷ったら以下を参照:

- **全体像・コンセプト**: `docs/concept/instruction.md`
- **技術的な設計詳細**: `docs/concept/designDoc.md`
- **テンプレートの AGENTS.md**: `template/AGENTS.md`（エンドユーザー向けだが、何を提供するか理解するために読む）
