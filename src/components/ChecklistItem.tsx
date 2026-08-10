import type { ChecklistItem as Item } from '../types/checklist'

type Props = {
  item: Item
  checked: boolean
  /** 未完了リストから飛んできた直後だけ true。1.6 秒で消える。 */
  highlighted: boolean
  onToggle: (id: string) => void
}

/**
 * 行全体がタップ領域。<label> で本物の <input type="checkbox"> を包み、
 * 見た目は :checked + 疑似要素で作る（display:none にするとキーボードで到達できなくなる）。
 */
export function ChecklistItem({ item, checked, highlighted, onToggle }: Props) {
  return (
    <label
      id={`item-${item.id}`}
      className={`item${highlighted ? ' item--highlighted' : ''}`}
      data-category={item.categoryId}
    >
      <input
        type="checkbox"
        className="item__input"
        checked={checked}
        onChange={() => onToggle(item.id)}
      />
      <span className="item__box" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="13" height="13" focusable="false">
          <polyline
            points="2.5,8.5 6.3,12 13.5,4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="item__label">{item.label}</span>
    </label>
  )
}
