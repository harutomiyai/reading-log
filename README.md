# 📚 Reading Log (読書記録アプリ)

没入型読書タイマーと、シンプルな書籍管理機能を備えた読書記録アプリケーションです。
ログイン不要で、すぐに使い始めることができます。

**📱 デモサイト (Live Demo):**
[https://reading-log-eight.vercel.app/](https://reading-log-eight.vercel.app/)

## ✨ 特徴 (Features)

* **没入型タイマー (Focus Mode):**
    * 読書開始ボタンを押すと画面が暗転し、現在時刻と開始時刻のみが表示されます。
    * デジタルデトックスを意識し、読書に集中できる環境を提供します。
* **シンプルな書籍管理:**
    * タイトルと著者名を入力して登録。
    * 表紙は「好みの色」または「画像URL」から選択可能。
* **記録・統計:**
    * 読書時間を自動で記録。
    * 総読書時間や完読した冊数をグラフアイコンで可視化。
* **PWA対応 (スマホアプリ化):**
    * スマートフォン（iOS/Android）のホーム画面に追加することで、ネイティブアプリのように全画面で使用可能です。
* **ローカルストレージ保存:**
    * データはブラウザ内に保存されます。サーバー送信は行わないため、プライバシーも安心です。

## 📲 スマホへのインストール方法 (PWA)

このアプリは **PWA (Progressive Web App)** に対応しています。

1.  デモサイトのURLをスマホのブラウザ（Safari または Chrome）で開く。
2.  **iPhone (Safari):** 「共有」ボタン → 「ホーム画面に追加」をタップ。
3.  **Android (Chrome):** メニュー「︙」 → 「アプリをインストール」または「ホーム画面に追加」をタップ。

これで、ホーム画面からアプリとして起動できます。

## 🛠️ 使用技術 (Tech Stack)

* **Frontend:** [React](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **PWA:** [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
* **Deploy:** [Vercel](https://vercel.com/)

## 💻 ローカルでの実行方法 (Local Development)

手元でコードを動かしたい場合は、以下の手順で行ってください。

```bash
# リポジトリのクローン
git clone [https://github.com/harutomiyai/reading-log.git](https://github.com/harutomiyai/reading-log.git)

# ディレクトリへ移動
cd reading-log

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
