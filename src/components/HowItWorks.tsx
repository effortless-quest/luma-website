import styles from './HowItWorks.module.css'

const STEPS = [
  { num: 'I',   title: 'Download & install Luma',     desc: 'Grab the latest release from GitHub. Luma is a native desktop app built with Tauri, available for Linux, macOS, and Windows.' },
  { num: 'II',  title: 'Connect your businesses',     desc: 'Tell Luma which business models you run — crocheting, content creation, sales, print on demand. It auto-configures itself for each one.' },
  { num: 'III', title: 'Step back. Luma runs it.',    desc: 'Orders, inventory, marketing, social posts, website updates — Luma handles operations autonomously. You get notified only when something needs you.' },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <p className={styles.label}>How it works</p>
      <h2 className={styles.title}>
        Three steps to a<br /><em>running business</em>
      </h2>
      <div className={styles.steps}>
        {STEPS.map(step => (
          <div key={step.num} className={styles.step}>
            <div className={styles.num}>{step.num}</div>
            <div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
