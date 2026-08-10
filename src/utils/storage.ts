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

/**
 * 読めなかった保存データの退避先。
 * 初期状態で上書きする前にここへ逃がす。目で読めば復旧できる原本を、
 * 起動しただけで消してしまうのを防ぐ。
 */
const BROKEN_KEY_PREFIX = 'deliverycheck.v1.broken.'

const SCHEMA_VERSION = 1

const EMPTY: StoredState = {
  version: SCHEMA_VERSION,
  projectName: '',
  checked: createEmptyChecked(),
}

function empty(): StoredState {
  return { ...EMPTY, checked: createEmptyChecked() }
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

/**
 * 読めなかった原本を退避する。退避に失敗しても読み込み自体は続ける。
 *
 * 同じ内容が既に退避してあれば何もしない。loadState は1回の起動で複数回走ることがあり
 * （React の StrictMode など）、素直に書くと同じ原本が積み上がって保存領域を無駄に食う。
 */
function quarantine(raw: string): void {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(BROKEN_KEY_PREFIX) && localStorage.getItem(key) === raw) return
    }
    localStorage.setItem(`${BROKEN_KEY_PREFIX}${Date.now()}`, raw)
  } catch {
    /* 容量超過などで退避できないことはある。画面を止める理由にはしない */
  }
}

/**
 * 読み込み。壊れていても例外を投げず、初期状態に落とす。
 *
 * ただし「初期状態に落とす」と「原本を消す」は別。
 * 読めなかったデータは必ず退避してから初期状態を返す。
 * 知らない version も同じ扱いにする（踏み潰して確定保存すると、
 * 新しい版で書いたデータが古い版を開いただけで失われるため）。
 */
export function loadState(): StoredState {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      quarantine(raw)
      return empty()
    }

    const obj = parsed as Partial<StoredState>
    if (obj.version !== SCHEMA_VERSION) {
      quarantine(raw)
      return empty()
    }

    return {
      version: SCHEMA_VERSION,
      projectName: typeof obj.projectName === 'string' ? obj.projectName : '',
      checked: mergeChecked(obj.checked),
    }
  } catch {
    // プライベートモード・JSON 破損・容量超過。画面を白くしないことを優先する。
    if (raw) quarantine(raw)
    return empty()
  }
}

/**
 * 保存。失敗しても握りつぶす（保存できないだけで操作は続けられる）。
 *
 * 中身が同じときは書かない。他のタブの変更を受け取って書き戻すと、
 * タブ同士で保存が往復して止まらなくなる。
 */
export function saveState(state: StoredState): void {
  try {
    const next = JSON.stringify(state)
    if (localStorage.getItem(STORAGE_KEY) === next) return
    localStorage.setItem(STORAGE_KEY, next)
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

/**
 * 他のタブでの変更を受け取る。返り値を呼ぶと購読をやめる。
 *
 * これが無いと、2つのタブで開いたときに後から操作したタブが
 * 先のタブのチェックを消す。しかも消された側の画面は完了のまま残るため、
 * 「確認できていないものを確認済みとして表示する」という一番まずい出方になる。
 *
 * e.key === null は他タブで clear() が呼ばれた合図。この鍵だけを見ていると
 * リセットを取りこぼす。
 */
export function subscribeExternalChange(onChange: () => void): () => void {
  function handle(event: StorageEvent) {
    if (event.key !== null && event.key !== STORAGE_KEY) return
    onChange()
  }
  window.addEventListener('storage', handle)
  return () => window.removeEventListener('storage', handle)
}
