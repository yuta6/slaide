# slaide ロードマップ

---

## 実装優先順位

### Phase 1: 最小構成で動くもの（実装済み）

1. プロジェクト初期化（package.json, astro.config.mjs, tsconfig.json）
2. SlideLayout.astro（固定枠 + CSS custom properties によるデザインシステム）
3. AGENTS.md 群（ルート、components/、pages/、presenter/）
4. サンプルデッキ1つ（sample/ に main.astro + _slides/）
5. build-png.mjs（Playwright → PNG、LLM 品質チェック用）
6. build-pdf.mjs（Playwright → PDF、--deck 対応）
7. build-html.mjs（main.html 後処理 + Presenter 注入、--deck 対応）

### Phase 2: 品質向上

8. Playwright ビジュアルチェック（check-slides.spec.mjs）
9. AGENTS.md のデザイン原則を充実
10. 複数テーマ対応（light / dark / custom）
11. ポスター出力モード

### Phase 3: 配布

12. `npm create slaide` scaffolding CLI（create-slaide パッケージ）
13. README.md / ドキュメント整備

### Phase 4: SKILL edition

14. SKILL.md（薄いオーケストレーター）
15. ブラックボックス化の実装
16. Eject 機能
17. フォント・素材問題の解決

---

## 未決事項

- フォント戦略: どのフォントを推奨するか。バンドルはしない
- PPTX 出力: スコープ外。将来対応の可能性はあるが優先度低

技術的な未解決課題は [designDoc.md](designDoc.md) を参照。
