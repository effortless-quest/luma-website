'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import styles from './Hero.module.css'

// Dynamically import ThreeRoom so it only runs client-side (no SSR)
const ThreeRoom = dynamic(() => import('./ThreeRoom'), { ssr: false })

type Scene = 'predawn' | 'morning' | 'afternoon' | 'night'
type View  = 'beach'   | 'city'    | 'forest'

const SCENE_BUTTONS: { key: Scene; icon: string; label: string }[] = [
  { key: 'predawn',   icon: '✦',  label: 'Pre-dawn'  },
  { key: 'morning',   icon: '🌅', label: 'Morning'   },
  { key: 'night',     icon: '🌙', label: 'Night'     },
  { key: 'afternoon', icon: '☀️', label: 'Afternoon' },
]
const VIEW_BUTTONS: { key: View; icon: string; label: string }[] = [
  { key: 'beach',  icon: '🌊', label: 'Beach'  },
  { key: 'city',   icon: '🏙️', label: 'City'   },
  { key: 'forest', icon: '🌲', label: 'Forest' },
]

export default function Hero() {
  const [scene, setScene] = useState<Scene>('night')
  const [view,  setView]  = useState<View>('beach')

  return (
    <section className={styles.hero}>
      <ThreeRoom scene={scene} view={view} />
      <div className={styles.overlay} />

      {/* Scene toggle */}
      <div className={styles.sceneToggle}>
        {SCENE_BUTTONS.map(({ key, icon, label }) => (
          <button
            key={key}
            title={label}
            className={`${styles.togBtn} ${scene === key ? styles.active : ''}`}
            onClick={() => setScene(key)}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className={styles.viewToggle}>
        {VIEW_BUTTONS.map(({ key, icon, label }) => (
          <button
            key={key}
            title={label}
            className={`${styles.togBtn} ${view === key ? styles.active : ''}`}
            onClick={() => setView(key)}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Hero text */}
      <div className={styles.content}>
        <p className={styles.eyebrow}>✦ &nbsp;Private · Local · Peaceful &nbsp;✦</p>
        <h1 className={styles.title}>
          Write with<br /><em>gentle focus</em>
        </h1>
        <p className={styles.sub}>your private, local AI journaling companion</p>
        <div className={styles.btns}>
          <a
            href="https://github.com/effortless-quest/luma/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnPrimary}
          >
            ✦ &nbsp;Download Luma
          </a>
          <a
            href="https://github.com/effortless-quest/luma"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSecondary}
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
