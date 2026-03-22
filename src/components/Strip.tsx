'use client'

import styles from './Strip.module.css'

const ITEMS = [
  'Runs Businesses Autonomously',
  '100% Local · No Cloud',
  'Orders · Inventory · Marketing',
  'Open Source',
  'Your Personal Jarvis',
]

export default function Strip() {
  return (
    <div className={styles.strip}>
      {ITEMS.map(item => (
        <div key={item} className={styles.item}>
          <span className={styles.dot} />
          {item}
        </div>
      ))}
    </div>
  )
}
