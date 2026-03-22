import styles from './Philosophy.module.css'

export default function Philosophy() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.quote}>
          &ldquo;Pick a business. We build it. Luma runs it.&rdquo;
        </p>
        <p className={styles.attr}>— The Effortless Works promise</p>
      </div>
    </section>
  )
}
