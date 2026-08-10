import { useEffect, useState } from 'react'
import './App.css'
import { ChecklistGroup } from './components/ChecklistGroup'
import { PendingList, ProgressSummary, SuccessMessage } from './components/ProgressSummary'
import {
  CATEGORIES,
  CHECKLIST_ITEMS,
  createEmptyChecked,
  type CategoryId,
} from './types/checklist'
import { clearState, loadState, saveState } from './utils/storage'

const TOTAL = CHECKLIST_ITEMS.length
/** PC の進捗パネルに出す未完了項目の件数。これを超えたぶんは「他 N 件」に畳む。 */
const PENDING_PANEL_LIMIT = 6

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [resetArmed, setResetArmed] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [lastCheckedCategory, setLastCheckedCategory] = useState<CategoryId | null>(null)

  useEffect(() => {
    saveState(state)
  }, [state])

  // 未完了リストから飛んだ直後の目印。1.6 秒だけ光らせて離す。
  useEffect(() => {
    if (!highlightedId) return
    const timer = window.setTimeout(() => setHighlightedId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [highlightedId])

  // リセットの「本当に？」は 4 秒で自動的に引っ込む（押しっぱなしの誤爆を防ぐ）。
  useEffect(() => {
    if (!resetArmed) return
    const timer = window.setTimeout(() => setResetArmed(false), 4000)
    return () => window.clearTimeout(timer)
  }, [resetArmed])

  useEffect(() => {
    if (!resetDone) return
    const timer = window.setTimeout(() => setResetDone(false), 3000)
    return () => window.clearTimeout(timer)
  }, [resetDone])

  const { checked, projectName } = state
  const pending = CHECKLIST_ITEMS.filter((item) => !checked[item.id])
  const done = TOTAL - pending.length
  // 切り捨て固定。100% が出るのは done === TOTAL のときだけ、という不変条件を守る。
  const percent = Math.floor((done / TOTAL) * 100)
  const complete = done === TOTAL

  function handleToggle(id: string) {
    const wasChecked = checked[id] === true
    setState((prev) => ({
      ...prev,
      checked: { ...prev.checked, [id]: !prev.checked[id] },
    }))
    if (!wasChecked) {
      const item = CHECKLIST_ITEMS.find((i) => i.id === id)
      if (item) setLastCheckedCategory(item.categoryId)
    }
  }

  function handleJump(id: string) {
    setSheetOpen(false)
    const el = document.getElementById(`item-${id}`)
    el?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
    setHighlightedId(id)
  }

  function handleReset() {
    // 1回目は武装するだけ。window.confirm は文言も位置も制御できないので使わない。
    if (!resetArmed) {
      setResetArmed(true)
      return
    }
    clearState()
    setState({ version: 1, projectName: '', checked: createEmptyChecked() })
    setResetArmed(false)
    setResetDone(true)
    setSheetOpen(false)
    setLastCheckedCategory(null)
  }

  // 全完了時にインラインの成功カードを差し込む位置。最後に押した場所の直下に出す。
  const inlineSuccessAfter = lastCheckedCategory ?? CATEGORIES[CATEGORIES.length - 1].id

  return (
    <div className={`app${complete ? ' app--complete' : ''}`}>
      <header className="header">
        <div className="header__inner">
          <h1 className="header__title">納品前チェック</h1>
          <input
            type="text"
            className="header__name"
            value={projectName}
            placeholder="案件名を入力"
            aria-label="案件名"
            maxLength={60}
            onChange={(e) => setState((prev) => ({ ...prev, projectName: e.target.value }))}
          />
          <span className="header__count">
            {done}/{TOTAL}
          </span>
        </div>
        <div className={`header__bar${complete ? ' header__bar--complete' : ''}`} aria-hidden="true">
          <div className="header__barfill" style={{ width: `${percent}%` }} />
        </div>
      </header>

      <main className="main">
        <div className="lists">
          {CATEGORIES.map((category) => (
            <div key={category.id}>
              <ChecklistGroup
                category={category}
                items={CHECKLIST_ITEMS.filter((item) => item.categoryId === category.id)}
                checked={checked}
                highlightedId={highlightedId}
                onToggle={handleToggle}
              />
              {complete && inlineSuccessAfter === category.id && (
                <SuccessMessage total={TOTAL} variant="inline" />
              )}
            </div>
          ))}

          <div className="reset">
            <button
              type="button"
              className={`reset__button${resetArmed ? ' reset__button--armed' : ''}${
                complete && !resetArmed ? ' reset__button--next' : ''
              }`}
              onClick={handleReset}
            >
              {resetArmed
                ? '本当にリセットしますか？'
                : complete
                  ? '次の案件へ（リセット）'
                  : 'すべてリセット'}
            </button>
            {resetDone && (
              <p className="reset__done" role="status">
                リセットしました
              </p>
            )}
          </div>
        </div>

        <aside className="panel">
          <div className="panel__sticky">
            <ProgressSummary
              done={done}
              total={TOTAL}
              percent={percent}
              items={CHECKLIST_ITEMS}
              checked={checked}
            />

            {complete ? (
              <SuccessMessage total={TOTAL} variant="panel" />
            ) : (
              <div className="pending">
                <h2 className="pending__title">残り {pending.length} 件</h2>
                <PendingList pending={pending} limit={PENDING_PANEL_LIMIT} onJump={handleJump} />
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* スマホの下部バー。置くのは残り件数だけ（親指の到達域に破壊操作を置かない）。 */}
      <div className={`dock${complete ? ' dock--complete' : ''}`}>
        <button
          type="button"
          className="dock__button"
          disabled={complete}
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((open) => !open)}
        >
          {complete ? (
            <span className="dock__label">すべて確認できました</span>
          ) : (
            <>
              <span className="dock__label">残り {pending.length} 件</span>
              <span className={`dock__caret${sheetOpen ? ' dock__caret--open' : ''}`} aria-hidden="true">
                ▲
              </span>
            </>
          )}
        </button>
      </div>

      {sheetOpen && !complete && (
        <div className="sheet" role="dialog" aria-label="未完了の項目">
          <div className="sheet__head">
            <h2 className="sheet__title">残り {pending.length} 件</h2>
            <button
              type="button"
              className="sheet__close"
              aria-label="閉じる"
              onClick={() => setSheetOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="sheet__body">
            <PendingList pending={pending} onJump={handleJump} />
          </div>
        </div>
      )}
    </div>
  )
}
