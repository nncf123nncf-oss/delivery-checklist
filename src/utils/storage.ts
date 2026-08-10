import {
  CHECKLIST_ITEMS,
  createEmptyChecked,
  type CheckedMap,
  type StoredState,
} from '../types/checklist'

/**
 * 固定キー1本。案件名をキーに含めない（案件名を書き換えた瞬間にチェックが消えるため）。
 */
const STORAGE_KEY = 'deliverycheck.v1'

const EMPTY: StoredState = {
  version: 1,
  projectName: '',
  checked: createEmptyChecked(),
}

/**
 * 保存済みの id だけを拾い、知らない id は捨て、無い id は false で埋める。
 * こうしておくと、あとから項目を足しても既存のチェックがズレない。
 */
function mergeChecked(raw: unknown): CheckedMap {
  const merged = createEmptyChecked()
  if (typeof raw !== 'object' || raw === null) return merged
  const source = raw as Record<string, unknown>
  for (const item of CHECKLIST_ITEMS) {
    if (source[item.id] === true) merged[item.id] = true
  }
  return merged
}

/** 読み込み。壊れていても例外を投げず、初期状態に落とす。 */
export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY, checked: createEmptyChecked() }

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...EMPTY, checked: createEmptyChecked() }
    }
    const obj = parsed as Partial<StoredState>
    return {
      version: 1,
      projectName: typeof obj.projectName === 'string' ? obj.projectName : '',
      checked: mergeChecked(obj.checked),
    }
  } catch {
    // プライベートモード・JSON 破損・容量超過。画面を白くしないことを優先する。
    return { ...EMPTY, checked: createEmptyChecked() }
  }
}

/** 保存。失敗しても握りつぶす（保存できないだけで操作は続けられる）。 */
export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 保存できない環境ではメモリ上の状態だけで動かす */
  }
}

/** リセット。保存領域そのものを消す。 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 消せなくても画面側は初期状態に戻す */
  }
}
