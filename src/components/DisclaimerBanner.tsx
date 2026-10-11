import { useState } from 'react'

export function DisclaimerBanner({ range }: { range?: [string, string] }) {
  const [open, setOpen] = useState(false)
  const span = range ? `${range[0].slice(0, 7)} to ${range[1].slice(0, 7)}` : '2014-05 to 2015-05'
  return (
    <div role="note" className="disclaimer">
      <strong>Past sales, not listings.</strong> Every home here sold between {span}; prices are as sold. This is a course project, not financial advice.{' '}
      <button type="button" className="linklike" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Less' : 'More'}
      </button>
      {open && (
        <p style={{ margin: 'var(--s-2) 0 0' }}>
          “Model estimate” comes from a gradient-boosting model trained on these same sales (each home is estimated by a model that did not see it).
          Its typical error is about ±17%, and it cannot see condition, finishes or off-market details, so “below model” does not mean “a deal”.
        </p>
      )}
    </div>
  )
}
