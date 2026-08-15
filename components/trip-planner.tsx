"use client";

import { useMemo, useState } from "react";

const levels = ["Primary (Std 4-6)", "Lower Secondary", "Upper Secondary", "Pre-U / Matrikulasi"];
const lengths = ["Day trip", "2D1N", "3D2N"] as const;
const modules = [["M01", "Karst & Cave Geology"], ["M02", "Tin, Trade & Town"], ["M03", "Heritage & Identity"], ["M04", "Ecology of the Valley"]];
const basePrices = { "Day trip": 95, "2D1N": 245, "3D2N": 380 };

export function TripPlanner() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(levels[1]);
  const [length, setLength] = useState<(typeof lengths)[number]>("2D1N");
  const [students, setStudents] = useState(80);
  const [selected, setSelected] = useState(["M01"]);
  const [school, setSchool] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const price = useMemo(() => {
    const moduleCost = Math.max(0, selected.length - 1) * 12;
    const discount = students >= 120 ? 0.88 : students >= 60 ? 0.94 : 1;
    return Math.round((basePrices[length] + moduleCost) * discount);
  }, [length, selected.length, students]);

  function toggleModule(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submit() {
    if (!school.trim() || !name.trim() || !email.trim()) {
      setError("Please complete school, name and email.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <section id="planner" className="section">
      <div className="container planner-grid">
        <div>
          <span className="eyebrow accent">ISO Smart Trip Planner</span>
          <h2>Build your expedition brief in 60 seconds.</h2>
          <p className="lead">Answer three short steps. You&apos;ll get an indicative per-student cost immediately and a full costed itinerary, risk assessment and parent letter from our education team.</p>
          <div className="card price-card"><span className="eyebrow">Indicative cost / student</span><p>RM {price}<small>× {students} students</small></p><em>{length} · {selected.length} module{selected.length === 1 ? "" : "s"} · teachers travel free (1 per 15 students)</em></div>
        </div>
        <div className="card planner-card">
          {submitted ? (
            <div className="success"><span className="eyebrow accent">Brief submitted</span><h3>Terima kasih, {name}.</h3><p>Your {length.toLowerCase()} brief for {school} ({students} students) is with our education team. Expect a costed itinerary at {email} within 2 working days.</p><button className="button button-outline" onClick={() => { setSubmitted(false); setStep(0); }}>Plan another trip</button></div>
          ) : <>
            <div className="progress">{[0, 1, 2].map((item) => <i className={item <= step ? "active" : ""} key={item} />)}<span>Step {step + 1}/3</span></div>
            <div className="form-step">
              {step === 0 && <>
                <Field label="Student level"><OptionGroup options={levels} value={level} onChange={setLevel} /></Field>
                <Field label="Trip length"><OptionGroup options={[...lengths]} value={length} onChange={(value) => setLength(value as (typeof lengths)[number])} /></Field>
                <Field label={`Group size — ${students} students`}><input className="range" type="range" min="20" max="300" step="5" value={students} onChange={(event) => setStudents(Number(event.target.value))} /></Field>
              </>}
              {step === 1 && <Field label="Learning focus (select all that apply)"><div className="module-options">{modules.map(([id, label]) => <button type="button" className={selected.includes(id) ? "selected" : ""} onClick={() => toggleModule(id)} key={id}><small>{id}</small><span>{label}</span></button>)}</div></Field>}
              {step === 2 && <>
                <Field label="School name"><input value={school} onChange={(event) => setSchool(event.target.value)} placeholder="SMK Raja Perempuan" /></Field>
                <div className="two-fields"><Field label="Your name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cikgu Nuha" /></Field><Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu.my" /></Field></div>
                <Field label="Preferred dates or notes (optional)"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Mid-March, halal meals, 3 wheelchair users" /></Field>
                {error && <p className="form-error" role="alert">{error}</p>}
              </>}
            </div>
            <div className="planner-actions"><button className="back" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>Back</button><button className="button" onClick={() => step < 2 ? setStep((current) => current + 1) : submit()}>{step < 2 ? "Continue" : "Plan My School Trip"}</button></div>
          </>}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function OptionGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="option-group">{options.map((option) => <button type="button" className={option === value ? "selected" : ""} onClick={() => onChange(option)} key={option}>{option}</button>)}</div>;
}
