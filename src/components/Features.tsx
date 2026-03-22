'use client'

import { useEffect, useRef } from 'react'
import styles from './Features.module.css'

const FEATURES = [
  { icon: '📦', title: 'Order Management',     desc: 'Luma handles incoming orders, queues production, updates your shop, and notifies you only when it\'s time to ship. You stay out of the day-to-day.', tag: 'Fully automated' },
  { icon: '📸', title: 'Marketing Pipeline',   desc: 'Luma creates short-form content, posts to social media, updates your website when new products drop, and tracks what\'s growing.', tag: 'Content · Social · Growth' },
  { icon: '📊', title: 'Inventory Control',    desc: 'Tracks stock levels across all your businesses, reorders supplies automatically, and keeps your listings accurate — no manual counting.', tag: 'Always in stock' },
  { icon: '🧠', title: 'Local AI — No Cloud',  desc: 'Luma runs on your own hardware using Ollama. No subscription, no data leaving your network, no monthly AI bill.', tag: 'Ollama · On-device' },
  { icon: '📔', title: 'Journal Section',      desc: 'A private space to write, think, and reflect. Luma listens, remembers your entries, and helps you go deeper — all local, all yours.', tag: 'Personal · Private' },
  { icon: '📅', title: 'Daily Command Center', desc: 'See every business at a glance. Schedules, tasks, performance — one screen to run everything without switching between a dozen apps.', tag: 'One screen · Full control' },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(styles.visible) }),
      { threshold: 0.12 }
    )
    ref.current?.querySelectorAll(`.${styles.reveal}`).forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="features" ref={ref}>
      <p className={`${styles.label} ${styles.reveal}`}>What Luma does</p>
      <h2 className={`${styles.title} ${styles.reveal}`}>
        One control center,<br /><em>every business automated</em>
      </h2>
      <div className={styles.grid}>
        {FEATURES.map(f => (
          <div key={f.title} className={`${styles.card} ${styles.reveal}`}>
            <span className={styles.icon}>{f.icon}</span>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.desc}>{f.desc}</p>
            <span className={styles.tag}>{f.tag}</span>
          </div>
        ))}
      </div>
    </section>
  )
}