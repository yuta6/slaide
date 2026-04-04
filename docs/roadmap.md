# slaide ロードマップ

---

## 実装優先順位

### Phase 1: 最小構成で動くもの（現状）

1. プロジェクト初期化（package.json, astro.config.mjs, tsconfig.json）
2. `SlideLayout.astro`（固定枠 + CSS custom properties による design system）
3. `DeckLayout.astro`（Presenter shell + runtime）
4. AGENTS.md 群（ルート、components/、pages/）
5. サンプルデッキ 1 つ（sample/ に `index.astro` + `_slides/`）
6. `build-png.mjs`（Playwright → PNG、LLM 品質チェック用）
7. `build-pdf.mjs`（Playwright `page.pdf()` → ベクター PDF、`--deck` 対応）
8. `astro-inline-css.mjs`（自己完結した HTML 出力のための CSS inline）
9. `deck-utils.mjs`（deck 解決と preview server）

### Phase 2: 配布

10. `npm create slaide` scaffolding CLI（create-slaide パッケージ）
11. README.md / ドキュメント整備

### Phase 3: 品質向上

12. Components AGENTS.md の拡充（コンポーネントテンプレート例、チャート統合ガイド）
13. サンプルデッキ拡充（プロセスフロー、ダークテーマ、画像アセットの例を追加）
14. Presenter runtime を `DeckLayout.astro` から `presenter.ts` へ分離
15. print/export 用 CSS の整理、複数テーマ対応、ポスター出力モード

### Phase 4: Plugin edition

Claude Code の plugin として配布し、`/slaide` で呼べるようにする。

**背景**: skill（SKILL.md）はローカルファイルベースで配布機構がない。plugin は marketplace（GitHub repo 等）経由で配布でき、中に skill を含められる。

**配布構造**:

```
packages/slaide-plugin/          ← Claude Code plugin パッケージ
├── .claude-plugin/
│   └── marketplace.json         ← plugin メタデータ
└── skills/
    └── slaide/
        └── SKILL.md             ← /slaide で呼べるオーケストレーター
```

**配布経路が 2 つに分かれる**:

| 経路 | 対象 | 方法 |
|------|------|------|
| SKILL.md | `/slaide` コマンド | plugin marketplace（GitHub repo） |
| template/ | プロジェクトファイル | `npm create slaide` |

**実装アイテム**:

16. `packages/slaide-plugin/` の作成と marketplace.json の定義
17. SKILL.md（薄いオーケストレーター — scaffold → スライド生成 → 品質チェック → 納品）
18. AGENTS.md の責務分離（SKILL.md = フロー制御、AGENTS.md = 技術ルール）
19. ブラックボックス化（SKILL.md がユーザーに見せる範囲を `src/pages/<deck>/` に限定）
20. Eject 機能（plugin モードから AGENTS.md 直接モードへの切替）
21. フォント戦略の確定（推奨フォントスタック、system-ui ベース + Google Fonts fallback）

---

## 未決事項

- フォント戦略: どのフォントを推奨するか。バンドルはしない
- Presenter runtime をどの粒度で分割するか
- source assets の運用ルールをどこまでテンプレートに同梱するか
- PPTX 出力: スコープ外。将来対応の可能性はあるが優先度低

技術的な詳細は [designDoc.md](designDoc.md) を参照。
