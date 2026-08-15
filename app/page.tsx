import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Faq } from "@/components/faq";

const modules = [
  {
    id: "M01",
    subjects: "Geography · Science",
    title: "Karst & Cave Geology",
    body: "Stalactite formation, weathering and water tables studied inside a working cave system, with a field notebook task per student.",
    image: "/limestone.jpg",
  },
  {
    id: "M02",
    subjects: "History · Economics",
    title: "Tin, Trade & Town",
    body: "How dredges and dulang built a city — from mining pits to the Kinta boom and the shophouse economy that followed.",
    image: "/heritage.jpg",
  },
  {
    id: "M03",
    subjects: "Sejarah · Art",
    title: "Heritage & Identity",
    body: "A walking survey of Old Town facades, murals and food heritage, ending with a documentation and sketch brief.",
  },
  {
    id: "M04",
    subjects: "Biology · Sustainability",
    title: "Ecology of the Valley",
    body: "Limestone hill biodiversity, quarrying pressure and conservation trade-offs — debated on site, not in a slide deck.",
  },
];

const steps = [
  ["Tell us your cohort", "Year group, headcount, subject focus and budget per student through the Smart Trip Planner."],
  ["Get a costed itinerary", "Within two working days: a module-by-module day plan, transport, meals and a per-student quote."],
  ["Approvals made easy", "Risk assessment, guide licences, insurance and a parent letter template — formatted for your admin office."],
  ["Run the expedition", "Licensed field guides, teacher briefing pack, live coordinator on the day and a post-trip report."],
];

const assurances = [
  ["Licensed & insured", "MOTAC-licensed operator, licensed nature and city guides, public liability plus per-student travel cover."],
  ["1:15 supervision", "Every group runs with a lead guide, assistant guide and a dedicated safety marshal on cave sections."],
  ["Documented risk assessment", "Site-by-site hazard register, weather and flood protocols, and a written emergency evacuation plan."],
  ["Medical readiness", "First-aid certified staff, medical form collection, allergy and halal dietary handling on every meal."],
];

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container nav-wrap">
          <a className="brand" href="#top">
            <BrandLogo priority />
          </a>
          <nav aria-label="Main navigation">
            <a href="#expeditions">Expeditions</a>
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#faq">FAQ</a>
          </nav>
          <Link className="button button-small" href="/planner">Plan My School Trip</Link>
        </div>
      </header>

      <main>
        <section id="top" className="section hero">
          <div className="container hero-grid">
            <div>
              <h1>Ipoh Learning<br /><span>Expedition.<i className="strata-line" /></span></h1>
              <p className="hero-copy">A structured, geology-led school expedition through Kinta Valley limestone, tin-mining history and living heritage — designed with teachers, run by licensed guides.</p>
              <div className="actions">
                <Link className="button" href="/planner">Plan My School Trip</Link>
                <a className="button button-outline" href="#expeditions">See learning modules</a>
              </div>
              <dl className="stats">
                <div><dt>Students guided</dt><dd>6,400+</dd></div>
                <div><dt>Partner schools</dt><dd>82</dd></div>
                <div><dt>Curriculum aligned</dt><dd>4 states</dd></div>
              </dl>
            </div>
            <figure className="hero-art">
              <Image
                src="/hero.png"
                alt="Ipoh students in front of Dewan Bandaran Ipoh"
                width={3242}
                height={2174}
                priority
              />
            </figure>
          </div>
        </section>

        <section id="expeditions" className="section">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow accent">Learning modules</span><h2>Four field modules. Build the day you need.</h2></div>
              <p>Every module carries learning outcomes, a pre-trip teacher pack and a post-trip reflection task mapped to KSSM.</p>
            </div>
            <div className="module-grid">
              {modules.map((module) => (
                <article className="card module-card" key={module.id}>
                  {module.image ? <Image src={module.image} alt={module.title} width={1200} height={900} /> : <div className="strata-block" />}
                  <div className="card-body">
                    <div className="module-meta"><span>{module.id}</span><small>{module.subjects}</small></div>
                    <h3>{module.title}</h3>
                    <p>{module.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section muted-section">
          <div className="container">
            <span className="eyebrow accent">How it works</span>
            <h2>From enquiry to expedition in four steps.</h2>
            <ol className="steps">
              {steps.map(([title, body], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="safety" className="section">
          <div className="container safety-grid">
            <div>
              <span className="eyebrow accent">Safety & compliance</span>
              <h2>Built for the people who sign the approval form.</h2>
              <div className="quotes">
                <blockquote><p>“The first field trip our Geography department didn&apos;t have to write from scratch. The teacher pack alone saved us a fortnight.”</p><cite>Pn. Sharifah, Head of Geography, SMK Ipoh</cite></blockquote>
                <blockquote><p>“Approvals went through in one meeting because the risk assessment was already complete and properly documented.”</p><cite>En. Kumar, Senior Assistant, Perak</cite></blockquote>
              </div>
            </div>
            <dl className="assurances">
              {assurances.map(([title, body]) => <div key={title}><dt>{title}</dt><dd>{body}</dd></div>)}
            </dl>
          </div>
        </section>

        <Faq />
      </main>

      <footer>
        <div className="container">
          <div className="footer-cta"><h2>Ipoh is our classroom. Bring your students into it.</h2><Link className="button button-light" href="/planner">Plan My School Trip</Link></div>
          <div className="footer-grid">
            <div><BrandLogo className="footer-logo" /><p>Educational Learning Expeditions<br />Ipoh, Perak, Malaysia</p></div>
            <div><span>Contact</span><p>schools@libanglibu.travel<br />+60 5 000 0000</p></div>
            <div><span>Office hours</span><p>Mon–Fri, 9am–6pm MYT<br />Replies within 2 working days</p></div>
            <div><span>Trip apps</span><p><Link href="/guide">Tour Guide PWA</Link><br /><Link href="/teacher">Teacher PWA</Link></p></div>
          </div>
          <p className="copyright">© 2026 Libang Libu Travel — Ipoh School Outing</p>
        </div>
      </footer>
    </div>
  );
}
