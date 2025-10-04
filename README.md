# GTO Battler

<p align="center">
  <img src="https://raw.githubusercontent.com/kinodaichi1/GTObattler/main/image/GTO%20battler.png" alt="GTO Battler Logo" width="350"/>
</p>

<p align="center">
  <strong>GTO的思考を、あなたの手に。AIと共に学ぶ次世代ポーカー学習ツール</strong>
</p>

<p align="center">
  <a href="https://kinodaichi1.github.io/GTObattler/"><strong>➡️ ツールを今すぐ使ってみる (Live Demo)</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/kinodaichi1/GTObattler?style=for-the-badge" alt="GitHub Stars">
  <img src="https://img.shields.io/github/last-commit/kinodaichi1/GTObattler?style=for-the-badge" alt="Last Commit">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
</p>

---

## 🃏 GTO Battler とは？

**GTO Battler** は、テキサスホールデム中級者以上の方が、GTO（ゲーム理論最適戦略）に基づいた高度な戦略を学び、実践の場で的確な判断を下すために開発された多機能Webアプリケーションです。

複雑な状況分析から日々の学習、仲間とのホームゲームまで、あらゆるポーカーシーンを強力にサポートします。サーバー費用は不要。**HTML, CSS, JavaScriptのみで構築**されており、すべての機能を広告なし・完全無料で利用できます。

## ✨ 主な機能

| 機能 | 概要 | ステータス |
| :--- | :--- | :--- |
| **♟️ AIアクション分析** | 状況を入力するだけで、AIがあなたのハンドを評価し、**複数の合理的アクション候補とその期待値（EV）を算出**。最適な一手とその根拠を提示します。 **本ツールの中核機能です。** | ✅ **実装完了** |
| **📊 レンジファインダー** | 6-Max/HUのスタックサイズに応じたGTOプリフロップレンジを表示。正しいプリフロップ戦略を瞬時に確認できます。 | ✅ **実装完了** |
| **⏱️ トーナメントタイマー** | ブラインドレベルや時間を自由にカスタマイズ可能。プログレスバーやアラーム機能も搭載し、ホームゲームを本格的に演出します。 | ✅ **実装完了** |
| **🧠 GTOトレーナー** | 様々なシチュエーション問題に挑戦し、クイズ形式でGTO戦略の基礎を楽しく学習。あなたの知識を試しましょう。 | ✅ **実装完了** |
| **🎲 テキサスホールデム** | 実際にプレイできるテキサスホールデムシミュレーター。友人とのプレイや戦略のテストに最適です。 | ✅ **実装完了** |
| **📚 ポーカー用語集** | 基本的なアクションから高度な戦略用語まで50以上の用語を網羅。アコーディオン形式でいつでも意味を確認できます。 | ✅ **実装完了** |

---

## 🚀 ロードマップ (Roadmap)

GTO Battlerは、あなたのポーカー学習をさらに加速させるため、継続的に進化します。

### **Version 1.3.1 (Next Update)**
- **[ ] アクション分析の高度化 (Phase 1):**
    - **ICM (Independent Chip Model) の実装:** トーナメント終盤の分析精度を飛躍的に向上させ、$EVに基づいた最適アクションを推奨します。
    - **レンジアドバンテージの評価:** ボードテクスチャを読み取り、「レンジ全体として有利か」を判断。より戦略的なCベットなどを提案します。
    - **ブロッカー効果の考慮:** あなたのハンドが相手のナッツ級の組み合わせをどれだけブロックしているかを評価し、ブラフの成功率をより正確に計算します。

### **Version 1.3.2**
- **[ ] アクション分析の高度化 (Phase 2):**
    - **バリューベットの最適化:** 相手のコールレンジをターゲットにし、利益を最大化する最適なベットサイズを算出します。

### **Version 1.3.3**
- **[ ] アクション分析の高度化 (Phase 3):**
    - **将来のストリートを考慮:** ターンやリバーで起こりうる展開を予測し、インプライドオッズなども含めた複数ストリートにまたがる期待値を計算します。

### **Version 1.4.0 (Major Update)**
- **[ ] PWA (Progressive Web App) 対応の本格化:**
    - オフラインでも全機能が利用できるようにService Workerを実装。
    - スマートフォンへのインストール（ホーム画面に追加）機能を強化し、ネイティブアプリのような使い心地を目指します。
- **[ ] 新機能「バンクロール管理」:**
    - プレイ結果を記録し、収支や成績をグラフで可視化する機能を追加します。

---

## 📜 更新履歴 (Changelog)

### **V1.3.0 (Current Version)**
-   **🎉 新機能: AIアクション分析**
    -   プロジェクトの中核機能である「アクション分析」をリリースしました。
    -   入力された状況に基づき、ハンドを自動で分類し、複数のアクション候補（チェック、コール、各種サイズのベット等）の期待値（EV）を計算して最適手を提示するロジックを実装しました。
-   **UI改善:** ナビゲーションボタンの高さを統一し、より洗練されたデザインに修正しました。
-   **用語集改善:** 用語集にカテゴリ見出しを追加し、目的の用語を探しやすくしました。

*(V1.2.5以前の更新履歴は省略)*

---

## 🛠️ 技術スタック

-   **Frontend:** HTML5, CSS3, JavaScript (ES6)
-   **Deployment:** GitHub Pages

## 🤝 貢献 (Contributing)

バグ報告や機能提案は、GitHubのIssuesまでお気軽にお寄せください。プルリクエストも大歓迎です！

1.  このリポジトリをフォーク
2.  あなたの機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3.  変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4.  ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5.  プルリクエストを開く

---

**GTO Battlerが、あなたのポーカーライフをより豊かで戦略的なものにする一助となれば幸いです。**