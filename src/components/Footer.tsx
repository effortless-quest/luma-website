import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>LUMA</div>

      <ul className={styles.links}>
        <li><a href="https://github.com/effortless-quest/luma" target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href="https://github.com/effortless-quest/luma/releases" target="_blank" rel="noopener noreferrer">Releases</a></li>
        <li><a href="https://github.com/effortless-quest/luma/issues" target="_blank" rel="noopener noreferrer">Issues</a></li>
      </ul>

      <p className={styles.copy}>© 2025 Effortless Quest · All rights reserved</p>
    </footer>
  )
}
