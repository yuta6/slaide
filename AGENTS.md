# slaide — 開発ガイド

自然言語からコンサル品質のスライドを生成する Astro ベースのビルドインフラ。

## このリポジトリの構造

```
slaide/
├── docs/           ← コンセプト・技術設計・ロードマップ
├── template/       ← npm create slaide で配布される成果物（AGENTS.md あり）
└── cli/            ← create-slaide CLI（Phase 3）
```

各ディレクトリの詳細は、そのディレクトリ内の AGENTS.md や `docs/designDoc.md` を参照。

## 2つのレイヤーを理解する

このリポジトリには **2つの異なるレイヤー** がある。混同しないこと。

### A: 開発レイヤー（このリポジトリ自体）

- **目的**: slaide という OSS ツールを開発する
- **対象**: このリポジトリを開発する AI / 開発者
- **コンセプト**: `docs/overview.md`（設計思想・競合比較）
- **技術設計**: `docs/designDoc.md`（どう作るか）
- **ロードマップ**: `docs/roadmap.md`（Phase 1-4・未決事項）

### B: テンプレートレイヤー（成果物）

- **目的**: エンドユーザーが `npm create slaide` で取得し、AI にスライドを作らせる
- **対象**: テンプレートを使ってスライドを生成する AI（Claude Code / Codex 等）
- **場所**: `template/` ディレクトリ以下すべて
- **AGENTS.md 群**: テンプレートに同梱され、エンドユーザーの AI が自動で読む

### 開発時の注意

- `template/` 内のファイルを編集するときは、**エンドユーザーの AI がこれを読む** ことを意識する
- `docs/` のファイルを編集するときは、**このプロジェクトの開発仕様** を更新している
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

## コミットルール

### Conventional Commits（必須）

`commitlint` + `lefthook` の `commit-msg` フックで強制される。形式:

```
<type>(<scope>): <description>
```

**type（必須）:**

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `build` | ビルドシステムや外部依存の変更 |
| `ci` | CI 設定の変更 |
| `chore` | その他の雑務 |
| `revert` | 過去のコミットの取り消し |

**scope（推奨）:**

| scope | 対象 |
|-------|------|
| `template` | `template/` 配下の変更 |
| `cli` | `cli/` 配下の変更 |
| `docs` | `docs/` 配下の変更 |
| `root` | ルートの設定ファイル等 |

**例:**

```
feat(template): add SlideLayout.astro with fixed-frame design system
fix(template): resolve text overflow in slide content area
docs: update designDoc.md with presenter runtime spec
chore(root): add biome and lefthook configuration
build(template): add Playwright and pdf-lib dependencies
```

### コミットの粒度

- 1つの論理的変更 = 1コミット
- `template/` と `docs/` をまたぐ変更は別コミットに分ける（レイヤーの分離）
- WIP コミットは避ける。意味のある単位でコミットする

## コード品質ツール

### Biome（Linter + Formatter）

```bash
npm run lint          # チェックのみ
npm run lint:fix      # 自動修正
npm run format        # フォーマット
```

- `.ts`, `.mjs`, `.js`, `.json` をフルサポート
- `.astro` は frontmatter 部分のみ（テンプレート部分は Biome 未対応）
- 設定: `biome.json`（ルート）

### lefthook（Git Hooks）

- **pre-commit**: ステージングされたファイルに `biome check` を実行
- **commit-msg**: `commitlint` で Conventional Commits 形式を検証
- 設定: `lefthook.yml`（ルート）

### commitlint

- 設定: `commitlint.config.cjs`
- ベース: `@commitlint/config-conventional`
- scope は `template`, `cli`, `docs`, `concept`, `root` を許可

## 開発コマンド

```bash
# ルートで実行
npm install                    # biome + lefthook をインストール
npm run lint                   # 全体を lint
npm run lint:fix               # lint + 自動修正

# template/ で実行（Phase 1 構築後）
cd template
npm install
npm run dev                    # Astro dev サーバー
npm run build:png -- --deck <name>   # PNG 出力（LLM チェック用）
npm run build:pdf -- --deck <name>   # PDF 出力
npm run build:html -- --deck <name>  # HTML 出力
```

## 仕様の参照先

実装に迷ったら以下を参照:

- **全体像・コンセプト**: `docs/overview.md`
- **技術的な設計詳細**: `docs/designDoc.md`
- **ロードマップ**: `docs/roadmap.md`
- **テンプレートの AGENTS.md**: `template/AGENTS.md`（エンドユーザー向けだが、何を提供するか理解するために読む）
