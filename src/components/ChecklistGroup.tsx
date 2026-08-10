import { ChecklistItem } from './ChecklistItem'
import type { Category, CheckedMap, ChecklistItem as Item } from '../types/checklist'

type Props = {
  category: Category
  items: Item[]
  checked: CheckedMap
  highlightedId: string | null
  onToggle: (id: string) => void
}

/** カテゴリ1つ分のカード。見出しに「3/5」を出して、どこが残っているかを1目で分かるようにする。 */
export function ChecklistGroup({ category, items, checked, highlightedId, onToggle }: Props) {
  const done = items.filter((item) => checked[item.id]).length

  return (
    <section className="group" data-category={category.id} aria-labelledby={`group-${category.id}`}>
      <div className="group__head">
        <h2 className="group__title" id={`group-${category.id}`}>
          <span className="group__dot" aria-hidden="true" />
          {category.name}
        </h2>
        <span className="group__count">
          {done}/{items.length}
        </span>
      </div>

      <div className="group__items">
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            checked={checked[item.id] ?? false}
            highlighted={highlightedId === item.id}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  )
}
