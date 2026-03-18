'use client'

import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <a href="#" className={styles.logo}>
        LU<span>M</span>A
      </a>

      <ul className={styles.links}>
        <li><a href="#features">Features</a></li>
        <li><a href="#how">How it works</a></li>
        <li><a href="#download">Download</a></li>
      </ul>

      <a
        href="https://github.com/effortless-quest/luma/releases/latest"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cta}
      >
        Download Free
      </a>
    </nav>
  )
}
