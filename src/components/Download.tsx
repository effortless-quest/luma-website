import styles from './Download.module.css'

export default function Download() {
  return (
    <section className={styles.section} id="download">
      <div className={styles.inner}>
        <span className={styles.badge}>Version 1.0 · Initial Release</span>
        <h2 className={styles.title}>
          Begin your<br /><em>journey with Luma</em>
        </h2>
        <p className={styles.sub}>
          Free, open source, and completely private.<br />
          Your journal is ready when you are.
        </p>
        <div className={styles.btns}>
          <a
            href="https://github.com/effortless-quest/luma/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnPrimary}
          >
            ✦ &nbsp;Download for Free
          </a>
          <a
            href="https://github.com/effortless-quest/luma/issues"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSecondary}
          >
            Report an Issue
          </a>
        </div>
        <p className={styles.platform}>Available for Linux · macOS · Windows</p>
      </div>
    </section>
  )
}
