# slaide ロードマップ

---

## 実装優先順位

### Phase 1: 最小構成で動くもの

1. プロジェクト初期化（package.json, astro.config.mjs, tailwind.config.mjs, tsconfig.json）
2. SlideLayout.astro（固定枠 + CSS custom properties によるデザインシステム）
3. AGENTS.md 群（ルート、components/、pages/）
4. サンプルデッキ1つ（sample/ に main.astro + slides/）
5. build-pdf.mjs（Playwright → PDF、--deck 対応）
6. build-html.mjs（main.html 後処理 + ナビゲーション、--deck 対応）

### Phase 2: 品質向上

7. build-png.mjs（Playwright → PNG、LLM 品質チェック用）
8. Playwright ビジュアルチェック（check-slides.spec.mjs）
9. AGENTS.md のデザイン原則を充実
10. 複数テーマ対応（light / dark / custom）
11. ポスター出力モード

### Phase 3: 配布

12. `npm create slaide` scaffolding CLI（create-slaide パッケージ）
13. GitHub テンプレートリポジトリ化（補助）
14. README.md / ドキュメント整備

### Phase 4: SKILL edition

15. SKILL.md（薄いオーケストレーター）
16. ブラックボックス化の実装
17. Eject 機能
18. フォント・素材問題の解決

---

## 配布戦略

### Phase 1: npm create edition

`npm create slaide` で Astro プロジェクトが出てくる。AGENTS.md 入り。

```bash
npm create slaide my-deck
cd my-deck
npm install
# → Claude Code / Codex / Cursor で「ピッチデッキ作って」
```

`create-slaide` npm パッケージの中身はテンプレートファイル群をコピーするだけの scaffolding CLI。

### monorepo での使い方

```
client-project/
├── app/                  ← アプリ本体
├── infra/                ← Terraform 等
├── docs/                 ← ドキュメント
└── slides/               ← npm create slaide で生成
    ├── package.json
    ├── src/pages/
    │   ├── proposal/     ← 提案資料
    │   └── report/       ← 報告資料
    └── ...
```

### Phase 4: SKILL edition（後回し）

- SKILL.md は薄いオーケストレーター（プロジェクト生成 → AGENTS.md に委譲）
- Astro をブラックボックス化。ユーザーには PDF/HTML だけが見える
- Eject で npm create edition 相当に変換可能
- 未解決: フォント・素材の提供方法

---

## 未決事項

- フォント戦略: どのフォントを推奨するか。バンドルはしない
- PPTX 出力: スコープ外。将来対応の可能性はあるが優先度低
- Tailwind デフォルトカラーの扱い: 完全無効化してプロジェクト定義のみにするか、共存させるか（Phase 1 では共存、Phase 2 で再検討）

技術的な未解決課題は [designDoc.md](designDoc.md) を参照。
