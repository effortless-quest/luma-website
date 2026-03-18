import styles from './Philosophy.module.css'

export default function Philosophy() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.quote}>
          &ldquo;Not to become someone — but to understand yourself.&rdquo;
        </p>
        <p className={styles.attr}>— The spirit of Luma</p>
      </div>
    </section>
  )
}
