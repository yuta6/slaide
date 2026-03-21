# slaide — 開発ガイド

自然言語からコンサル品質のスライドを生成する Astro ベースのビルドインフラ。

## このリポジトリの構造

```
slaide/
├── docs/           ← コンセプト・技術設計・ロードマップ
├── template/       ← npm create slaide で配布される成果物（AGENTS.md あり）
├── biome.json      ← ルートの Biome 設定
├── lefthook.yml    ← Git hooks 設定
└── package.json    ← ルートの lint / format / commitlint コマンド
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
| `cli` | 将来の `cli/` 配下の変更 |
| `docs` | `docs/` 配下の変更 |
| `root` | ルートの設定ファイル等 |

**例:**

```
feat(template): add SlideLayout.astro with fixed-frame design system
fix(template): resolve text overflow in slide content area
docs: update designDoc.md with presenter runtime spec
chore(root): add biome and lefthook configuration
build(template): add Playwright and vite-plugin-singlefile dependencies
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
- scope は `template`, `cli`, `docs`, `root` を許可

## 開発コマンド

```bash
# ルートで実行
npm install                    # biome + lefthook をインストール
npm run lint                   # 全体を lint
npm run lint:fix               # lint + 自動修正

# template/ で実行
cd template
npm install
npm run dev                           # Astro dev サーバー
npm run build                         # dist/index.html, dist/<deck>.html
npm run build:png -- --deck <name>    # PNG 出力（LLM チェック用）
npm run build:pdf -- --deck <name>    # PDF 出力
npm run build:png                     # 全デッキ一括
npm run build:pdf                     # 全デッキ一括
npm run preview                       # dist/ をローカル確認
```

補足:

- `build:html` は現行テンプレートには存在しない。`npm run build` がスタンドアロン HTML を生成する
- `build:png` / `build:pdf` は内部で `astro build` を実行してから export する
- deck の source of truth は `template/src/pages/<deck>/index.astro`

## 仕様の参照先

実装に迷ったら以下を参照:

- **全体像・コンセプト**: `docs/overview.md`
- **技術的な設計詳細**: `docs/designDoc.md`
- **ロードマップ**: `docs/roadmap.md`
- **テンプレートの AGENTS.md**: `template/AGENTS.md`（エンドユーザー向けだが、何を提供するか理解するために読む）
