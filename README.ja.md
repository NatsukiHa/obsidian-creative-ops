# Creative Ops

Creative Ops は、記事・小説・楽曲・動画・イラスト・同人作品などを Markdown ノートで
管理する個人制作者向けの、ローカル完結型 Obsidian プラグインです。ノートの
Properties をそのまま利用するため、外部データベースを作らず、Vault の内容を送信しません。

> 状態: 初回公開版です。Obsidian Community Plugins には未掲載のため、GitHub Release
> から手動で導入してください。

## まずはここから

### 1. インストールする

1. GitHub Release から `creative-ops-0.1.0.zip` をダウンロードして展開します。
2. 展開してできた `creative-ops` フォルダを、使用する Vault の
   `<Vault>/.obsidian/plugins/` にコピーします。
3. Obsidian の **設定 → Community plugins** を開きます。必要なら制限モードを解除し、
   **Creative Ops** を有効化します。

`creative-ops` フォルダの中には、`main.js`、`manifest.json`、`styles.css` の3ファイルが
必要です。Community plugin の導入に不慣れな場合は、まず小さなテスト Vault で試してください。

### 2. 最初の制作物を作る

1. コマンドパレットを開き、**新しい制作物を作成** を選びます。
2. タイトルを入力し、ステータス、優先度、必要なら期限・保存先・テンプレートを選びます。
3. **Create** を押すと、必要な Properties が入った Markdown ノートが作成・表示されます。
4. 左リボンの **Creative Ops** を開くと、一覧とボードに制作物が表示されます。

### 3. 既存ノートを制作物にする

対象ノートを開き、コマンドパレットから **現在のノートを制作物として登録** を実行します。
不足している Properties だけを補います。すでに別の `type` があるノートは上書きしません。

## 日々の使い方

| やりたいこと | 操作 | ノートへの影響 |
| --- | --- | --- |
| 全体を見渡す | **Creative Ops** を開き、List / Board / Summary を選ぶ | 変更なし |
| 制作段階を変える | List または Board のステータスを選ぶ | そのノートの `status` だけを変更 |
| 元ノートを開く | タイトルまたはボードのカードを選ぶ | 変更なし |
| 抜け漏れを探す | **品質検査を実行** を選び、Summary を見る | 変更なし |
| 定型から作る | **新しい制作物を作成** で Vault 内テンプレートを選ぶ | 新しい Markdown ノートを1件作成 |

更新はすべて明示操作です。再読み込み、一覧表示、品質検査は読み取り専用で、ノートを
自動削除・移動・リネーム・修復しません。

## ノートの書き方

Creative Ops は、`type: creative-project` があるノートを制作物として認識します。

```yaml
---
type: creative-project
status: draft
category: article
priority: medium
created: 2026-08-03
target-date: 2026-08-17
published-date:
published-url:
progress: 25
---

# 記事タイトル
```

タイトルは通常ファイル名です。日付は `YYYY-MM-DD`、進捗は `0` から `100` の整数を
使います。初期ステータスは `idea`、`research`、`draft`、`editing`、`ready`、
`published`、`paused`、`archived` です。設定で自分の制作フローに合わせて変更できます。

## 品質検査の見方

Summary は問題を表示しますが、自動では修正しません。内容を確認してからノートまたは
設定を自分で直してください。

| 表示 | 対応例 |
| --- | --- |
| Property が不足 | 指定された Property をノートに追加します。 |
| 未知のステータス | ノートの値を直すか、設定にそのステータスを追加します。 |
| 日付・進捗が不正 | 日付を `YYYY-MM-DD` にし、進捗を `0`〜`100` の整数にします。 |
| 期限超過・停滞 | 期限、進捗、ステータス、本文を現状に合わせて更新します。 |
| 公開情報不足 | `published` のノートには `published-date` と `published-url` を入れます。 |
| 未解決リンク | Obsidian のリンクを直すか、不要なリンクを削除します。 |

## 設定

| 設定 | 用途 |
| --- | --- |
| Project folder | 読み取り対象を Vault 内の1フォルダに絞ります。空欄なら Vault 全体です。 |
| Default destination | 新しく作る制作物ノートの保存先です。 |
| Template path | Vault 内の Markdown テンプレートを指定します。必須 Properties も検査されます。 |
| Stalled after days | 更新がない制作物を停滞として表示するまでの日数です。 |
| Statuses | `idea, draft, editing, published` のように制作フローを並べます。既存の未知値は変更されず報告されます。 |
| Default status | 新規作成・明示登録時に使う初期ステータスです。 |
| Required properties | 品質検査で必須とする Properties です。 |

フォルダとテンプレートのパスは Vault 相対です。Vault の外へ出ようとするパスは受け付けません。

## プライバシーと安全性

- 外部 API、ネットワーク通信、テレメトリ、アカウント、クラウド同期は使用しません。
- 本文は収集・送信せず、公開 Vault API 経由でメタデータのみを読みます。
- 作成、登録、ステータス変更以外ではノートを変更しません。
- 自動削除、上書き、移動、リネームは行いません。
- プラグインを無効化しても、ノートは通常の Markdown として残ります。

詳細は[プライバシー説明](docs/privacy.md)と[セキュリティポリシー](SECURITY.md)を参照してください。

## 制限事項

- MVP ではドラッグ&ドロップ、ガント、カレンダー、依存関係、外部連携は未実装です。
- モバイル専用 UI はありません。`isDesktopOnly: false` ですが、導入後は使用環境で確認してください。
- 関連ノートは明示的なリンク・バックリンクのみを利用します。
- 本文ではなく Properties を読み取るため、本文だけの運用ルールは制作物判定に使えません。
- Community Plugins には未掲載です。GitHub Release から手動で導入します。

## 開発版の読み込み

実際の Vault ではなく、専用の開発 Vault で確認してください。
開発ツールには Node.js 22.13 以降と pnpm 11.9 が必要です。

1. `pnpm install --ignore-scripts`
2. `pnpm run build`
3. `main.js`、`manifest.json`、`styles.css` を
   `<Vault>/.obsidian/plugins/creative-ops/` へコピー
4. Obsidian で Creative Ops を有効化

## ライセンス

このプロジェクトは [MIT License](LICENSE) で公開します。

English: [README.md](README.md)
