'use client'

import { useEffect, useRef } from 'react'
import styles from './Features.module.css'

const FEATURES = [
  { icon: '🕯️', title: 'Rich Text Journal',    desc: 'A beautiful, distraction-free writing canvas that adapts to any time of day. Morning light, evening warmth, deep night — Luma sets the atmosphere.', tag: 'Daily writing' },
  { icon: '🧠', title: 'Local AI Companion',   desc: 'Powered by Ollama running entirely on your machine. Ask Luma to reflect on your entry, explore a feeling, or keep you company — no internet required.', tag: 'Ollama · On-device' },
  { icon: '🔍', title: 'Contextual Memory',    desc: 'Semantic search through all your past entries using RAG. Find a memory not by keywords, but by meaning and feeling.', tag: 'Semantic RAG' },
  { icon: '🌙', title: 'Mood Insights',        desc: 'Luma quietly tracks the emotional tone of your writing over time. See trends, understand your patterns, notice how you\'ve grown.', tag: 'Sentiment analysis' },
  { icon: '🔒', title: 'Encryption & Privacy', desc: 'Password-protect your journal with full encryption. Your words are yours alone — Luma never touches a server.', tag: 'E2E encrypted' },
  { icon: '📅', title: 'Daily Schedule',       desc: 'Build routines, plan your days, and reflect on how you spent your time. Luma holds your structure so your mind can wander freely.', tag: 'Planning + reflection' },
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
      <p className={`${styles.label} ${styles.reveal}`}>What Luma offers</p>
      <h2 className={`${styles.title} ${styles.reveal}`}>
        Everything you need,<br /><em>nothing leaves your device</em>
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