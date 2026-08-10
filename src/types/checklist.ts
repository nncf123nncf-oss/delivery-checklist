/** カテゴリの識別子。CSS 側の色分けにもこの文字列をそのまま使う。 */
export type CategoryId = 'file' | 'share' | 'quality' | 'contact'

export type Category = {
  id: CategoryId
  name: string
}

export type ChecklistItem = {
  /** localStorage のキーになる。一度公開したら変えない。 */
  id: string
  categoryId: CategoryId
  label: string
}

/** チェック状態。項目 id をキーにする（配列の添字で持つと項目追加でズレる）。 */
export type CheckedMap = Record<string, boolean>

export type StoredState = {
  version: 1
  projectName: string
  checked: CheckedMap
}

export const CATEGORIES: Category[] = [
  { id: 'file', name: 'ファイル' },
  { id: 'share', name: '公開設定' },
  { id: 'quality', name: '品質' },
  { id: 'contact', name: '連絡' },
]

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'file-01', categoryId: 'file', label: '送るファイルが最新版か（日付・版番号を開いて確認した）' },
  { id: 'file-02', categoryId: 'file', label: '作業用ファイル・不要データを除外した' },
  { id: 'file-03', categoryId: 'file', label: '相手が読めるファイル名になっている' },
  { id: 'file-04', categoryId: 'file', label: '圧縮ファイルを自分で解凍して開けた' },
  { id: 'file-05', categoryId: 'file', label: '添付そのものをメールに付けた' },

  { id: 'share-01', categoryId: 'share', label: '共有URLをシークレットウィンドウで開いて見えた' },
  { id: 'share-02', categoryId: 'share', label: '共有権限（閲覧／編集）が意図どおり' },
  { id: 'share-03', categoryId: 'share', label: '有効期限・パスワードの設定を確認した' },
  { id: 'share-04', categoryId: 'share', label: '無関係なフォルダへのリンクが混ざっていない' },

  { id: 'quality-01', categoryId: 'quality', label: '誤字脱字を最終確認した' },
  { id: 'quality-02', categoryId: 'quality', label: '仮テキスト（ダミー・TODO・Lorem）が残っていない' },
  { id: 'quality-03', categoryId: 'quality', label: '依頼内容を1つずつ突き合わせた' },
  { id: 'quality-04', categoryId: 'quality', label: '納品形式（スマホ表示・印刷など）で確認した' },
  { id: 'quality-05', categoryId: 'quality', label: '制作者名・クレジット表記が正しい' },

  { id: 'contact-01', categoryId: 'contact', label: '宛先（To／Cc）が正しい' },
  { id: 'contact-02', categoryId: 'contact', label: '引用部分に他社の情報が残っていない' },
  { id: 'contact-03', categoryId: 'contact', label: '納品物の使い方・注意点を本文に書いた' },
  { id: 'contact-04', categoryId: 'contact', label: '請求・次工程の案内を入れた' },
]

/** 全項目 false の初期状態。 */
export function createEmptyChecked(): CheckedMap {
  const map: CheckedMap = {}
  for (const item of CHECKLIST_ITEMS) map[item.id] = false
  return map
}
