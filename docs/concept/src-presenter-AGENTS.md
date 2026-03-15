# Presenter カスタマイズガイド

## 概要

`src/presenter/` はスタンドアロン HTML プレゼンの機能を提供する。
build:html がこのランタイムをスライドと結合してワンファイル HTML に出力する。

**このディレクトリのファイルは自由に編集・追加してよい。**

## アーキテクチャ

Presenter の UI パーツは **Astro コンポーネント** として作られている。build:html 時に普通の HTML/CSS に展開されてワンファイルに結合される。JS は最小限。

```
src/presenter/
├── PresenterLayout.astro      ← 全スライドをラップする外枠
├── components/                ← UI パーツ（Astro コンポーネント）
│   ├── Navigation.astro       ← ← → クリック領域
│   ├── ProgressBar.astro      ← 下部プログレスバー
│   ├── SlideCounter.astro     ← 「3 / 12」表示
│   └── PresenterNotes.astro   ← スピーカーノート
├── presenter.ts               ← キーボード制御、状態管理（最小限のJS）
└── transitions.css            ← トランジションアニメーション定義
```

### レイヤー構造

```
[PresenterLayout.astro]          ← build:html 時のみ使用
  ├── Navigation.astro
  ├── ProgressBar.astro
  ├── SlideCounter.astro
  ├── PresenterNotes.astro
  └── [各スライド]
        └── [SlideLayout.astro]  ← 固定枠、トンマナ
              └── コンテンツ
```

build:pdf / build:png では PresenterLayout は使わない。SlideLayout だけで出力する。

## キーボードショートカット（デフォルト）

| キー | アクション |
|------|-----------|
| → / Space | 次のスライド |
| ← / Backspace | 前のスライド |
| F | フルスクリーン切替 |
| P | プレゼンターモード（スピーカーノート表示）|

## カスタマイズ方法

### トランジションの追加

1. `transitions.css` に CSS アニメーションを定義
2. `presenter.ts` の transitions Map に TransitionHandler を登録
3. スライドの frontmatter で `transition: "my-transition"` を指定

### UI パーツの追加

新しい Astro コンポーネントを `components/` に作り、`PresenterLayout.astro` に追加する。

例: タイマーを追加したい場合
1. `components/Timer.astro` を作成（HTML + CSS）
2. `PresenterLayout.astro` に `<Timer />` を追加
3. `presenter.ts` にタイマーロジックを追加

### ユーザーからの依頼例

- 「ページめくりをフリップにして」→ transitions.css + presenter.ts + frontmatter
- 「タイマーを表示して」→ Timer.astro を新規作成 + PresenterLayout に追加
- 「スライド一覧サムネイルを見たい」→ SlideGrid.astro を新規作成
- 「レーザーポインターが欲しい」→ presenter.ts にマウス追従ロジック追加
