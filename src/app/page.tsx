import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Strip from '@/components/Strip'
import Features from '@/components/Features'
import Philosophy from '@/components/Philosophy'
import HowItWorks from '@/components/HowItWorks'
import Download from '@/components/Download'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Strip />
      <Features />
      <Philosophy />
      <HowItWorks />
      <Download />
      <Footer />
    </main>
  )
}
