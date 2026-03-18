import styles from './HowItWorks.module.css'

const STEPS = [
  { num: 'I',   title: 'Download & install Luma',    desc: 'Grab the latest release from GitHub. Luma is a native desktop app built with Tauri, available for Linux, macOS, and Windows.' },
  { num: 'II',  title: 'Install Ollama (optional)',  desc: 'For AI conversations and mood analysis, install Ollama and pick a model — Mistral, Phi, TinyLlama, or any from the library. All local, all private.' },
  { num: 'III', title: 'Begin your first entry',     desc: 'Open Luma, pick your scene — beach, city, or forest — and start writing. The room shifts with the time of day. Your words stay on your device, forever.' },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <p className={styles.label}>How it works</p>
      <h2 className={styles.title}>
        Simple to start,<br /><em>yours to keep</em>
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
