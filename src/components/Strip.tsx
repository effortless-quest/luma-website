'use client'

import styles from './Strip.module.css'

const ITEMS = [
  '100% Local Processing',
  'Zero Cloud Dependency',
  'End-to-End Encryption',
  'Open Source',
  '15+ Languages',
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
