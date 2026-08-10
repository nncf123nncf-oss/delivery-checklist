import { CATEGORIES, type CheckedMap, type ChecklistItem } from '../types/checklist'

type ProgressProps = {
  done: number
  total: number
  percent: number
  items: ChecklistItem[]
  checked: CheckedMap
}

/** 完了率のリング/棒グラフの選択は「あと何個か」を優先し、分数を主・％を副にしている。 */
export function ProgressSummary({ done, total, percent, items, checked }: ProgressProps) {
  const complete = done === total

  return (
    <div className="progress">
      <div className="progress__numbers">
        <span className="progress__fraction">
          <span className="progress__done">{done}</span>
          <span className="progress__slash"> / </span>
          <span className="progress__total">{total}</span>
        </span>
        <span className="progress__percent">{percent}%</span>
      </div>

      <div
        className={`bar${complete ? ' bar--complete' : ''}`}
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="チェックの進みぐあい"
      >
        <div className="bar__fill" style={{ width: `${percent}%` }} />
      </div>

      <ul className="minibars">
        {CATEGORIES.map((category) => {
          const catItems = items.filter((item) => item.categoryId === category.id)
          const catDone = catItems.filter((item) => checked[item.id]).length
          const catPercent = catItems.length === 0 ? 0 : Math.floor((catDone / catItems.length) * 100)
          return (
            <li className="minibars__cell" key={category.id} data-category={category.id}>
              <div className="minibars__track">
                <div className="minibars__fill" style={{ width: `${catPercent}%` }} />
              </div>
              <span className="minibars__name">{category.name}</span>
              <span className="minibars__count">
                {catDone}/{catItems.length}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type PendingListProps = {
  pending: ChecklistItem[]
  /** PC パネルは 6 件で畳む。シートは全件出すので undefined。 */
  limit?: number
  onJump: (id: string) => void
}

/** 未完了項目。並びは元のカテゴリ順・項目順のまま（重要度順に並べ替えると探す場所が食い違う）。 */
export function PendingList({ pending, limit, onJump }: PendingListProps) {
  const shown = typeof limit === 'number' ? pending.slice(0, limit) : pending
  const rest = pending.length - shown.length

  return (
    <>
      <ul className="pending__list">
        {shown.map((item) => {
          const category = CATEGORIES.find((c) => c.id === item.categoryId)
          return (
            <li key={item.id}>
              <button type="button" className="pending__row" data-category={item.categoryId} onClick={() => onJump(item.id)}>
                <span className="pending__dot" aria-hidden="true" />
                <span className="pending__category">{category?.name}</span>
                <span className="pending__label">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {rest > 0 && <p className="pending__rest">他 {rest} 件</p>}
    </>
  )
}

type SuccessProps = {
  total: number
  variant: 'panel' | 'inline'
}

export function SuccessMessage({ total, variant }: SuccessProps) {
  return (
    <div className={`success success--${variant}`} role="status">
      <span className="success__icon" aria-hidden="true">
        <svg viewBox="0 0 28 28" width="28" height="28" focusable="false">
          <circle cx="14" cy="14" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
          <polyline
            points="8,14.5 12.3,18.5 20,9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <p className="success__title">{total}件、すべて確認できました。</p>
      <p className="success__note">送信してだいじょうぶです。</p>
    </div>
  )
}
