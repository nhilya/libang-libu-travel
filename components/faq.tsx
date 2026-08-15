"use client";

const faqs = [
  ["What is the minimum and maximum group size?", "We run expeditions from 20 students up to 300. Groups above 120 are split into rotating pods so no cohort waits at a site."],
  ["Do you provide documentation for school approval?", "Yes. Every confirmed booking includes a written risk assessment, guide licence copies, insurance certificate, itinerary, and an editable parent consent letter in Bahasa Malaysia and English."],
  ["Is the programme aligned to the syllabus?", "Each module maps to KSSM learning standards for Geography, Sejarah, Science and Biology. Teachers receive outcomes, worksheets and a post-trip reflection task."],
  ["How do you handle dietary and accessibility needs?", "All meals are halal by default, with vegetarian and allergy options collected at booking. We offer step-free alternatives for cave and heritage segments — flag it in the planner."],
  ["What is included in the per-student price?", "Guiding, site entrance fees, air-conditioned coach transport within Ipoh, meals as per itinerary, teacher packs, insurance and the on-day coordinator. Long-distance transport to Ipoh is quoted separately."],
];

export function Faq() {
  return (
    <section id="faq" className="section muted-section">
      <div className="container faq-grid">
        <div><span className="eyebrow accent">FAQ</span><h2>Questions from the staff room.</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span aria-hidden="true">⌄</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
