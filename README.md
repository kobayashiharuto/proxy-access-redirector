# Proxy Access Redirector

ブラウザ拡張機能「Proxy Access Redirector」は、学術サイトや企業 VPN などのプロキシ経由アクセスを自動化するツールです。

## 機能

- プロキシ経由の URL への自動リダイレクト
- 右クリックメニューからの手動リダイレクト
- カスタマイズ可能なリダイレクトルール
- シンプルで使いやすい設定画面

## インストール方法

### 開発版としてインストール

1. このリポジトリをクローン

```bash
git clone https://github.com/yourusername/proxy-access-redirector.git
```

2. Chrome 拡張機能の管理ページ（chrome://extensions/）を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. クローンしたディレクトリを選択

## 使用方法

1. 拡張機能のアイコンをクリックして設定画面を開く
2. リダイレクトルールを追加・編集
3. 自動リダイレクトの有効/無効を設定

### デフォルトのルール

- ACM Digital Library: dl.acm.org → dl-acm-org.waseda.idm.oclc.org
- IEEE Xplore: ieeexplore.ieee.org → ieeexplore-ieee-org.waseda.idm.oclc.org

## 開発

### 必要なツール

- Node.js
- npm

### セットアップ

```bash
npm install
```

### ビルド

```bash
npm run build
```

## ライセンス

MIT License
