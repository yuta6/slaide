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

12. Presenter runtime を `DeckLayout.astro` から `presenter.ts` へ分離するか判断
13. print/export 用 CSS の整理
14. AGENTS.md と docs の運用を安定化
15. 複数テーマ対応（light / dark / custom）
16. ポスター出力モード

### Phase 4: SKILL edition

17. SKILL.md（薄いオーケストレーター）
18. ブラックボックス化の実装
19. Eject 機能
20. フォント・素材問題の解決

---

## 未決事項

- フォント戦略: どのフォントを推奨するか。バンドルはしない
- Presenter runtime をどの粒度で分割するか
- source assets の運用ルールをどこまでテンプレートに同梱するか
- PPTX 出力: スコープ外。将来対応の可能性はあるが優先度低

技術的な詳細は [designDoc.md](designDoc.md) を参照。
