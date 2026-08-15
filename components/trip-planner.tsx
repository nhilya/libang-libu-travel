"use client";

import { useMemo, useState } from "react";

const levels = ["Primary (Std 4-6)", "Lower Secondary", "Upper Secondary", "Pre-U / Matrikulasi"];
const lengths = ["Day trip", "2D1N", "3D2N"] as const;
const modules = [["M01", "Karst & Cave Geology"], ["M02", "Tin, Trade & Town"], ["M03", "Heritage & Identity"], ["M04", "Ecology of the Valley"]];
const basePrices = { "Day trip": 95, "2D1N": 245, "3D2N": 380 };
const totalSteps = 5;

export function TripPlanner() {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(levels[1]);
  const [students, setStudents] = useState(80);
  const [teachers, setTeachers] = useState(6);
  const [language, setLanguage] = useState("Bilingual");
  const [selected, setSelected] = useState(["M01"]);
  const [learningStyle, setLearningStyle] = useState("Balanced");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [length, setLength] = useState<(typeof lengths)[number]>("2D1N");
  const [origin, setOrigin] = useState("");
  const [dates, setDates] = useState("");
  const [transport, setTransport] = useState("Include coach from school");
  const [budget, setBudget] = useState("RM200–RM300");
  const [dietary, setDietary] = useState("");
  const [accessibility, setAccessibility] = useState("");
  const [documents, setDocuments] = useState(["Risk assessment", "Parent letter"]);
  const [school, setSchool] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const price = useMemo(() => {
    const moduleCost = Math.max(0, selected.length - 1) * 12;
    const discount = students >= 120 ? 0.88 : students >= 60 ? 0.94 : 1;
    return Math.round((basePrices[length] + moduleCost) * discount);
  }, [length, selected.length, students]);

  function toggleItem(id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function next() {
    if (step === 1 && (selected.length === 0 || !learningOutcome.trim())) {
      setError("Select at least one module and describe the main learning outcome.");
      return;
    }
    if (step === 2 && (!origin.trim() || !dates.trim())) {
      setError("Add the departure point and preferred date or school term.");
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  }

  function submit() {
    if (!school.trim() || !name.trim() || !role.trim() || !email.includes("@")) {
      setError("Complete school, name, role and a valid email.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <section id="planner" className="section">
      <div className="container planner-grid">
        <div className="planner-intro">
          <span className="eyebrow accent">ISO Smart Trip Planner</span>
          <h2>Build an AI-ready expedition brief.</h2>
          <p className="lead">Share your cohort, learning outcomes, logistics and student needs. Structured details help generate a more relevant initial itinerary, accurate estimate and complete approval pack.</p>
          <div className="card price-card">
            <span className="eyebrow">Indicative cost / student</span>
            <p>RM {price}<small>× {students} students</small></p>
            <em>{length} · {selected.length} module{selected.length === 1 ? "" : "s"} · {teachers} teachers · teachers travel free (1 per 15 students)</em>
          </div>
          <div className="brief-note"><span>Better proposal tip</span><p>Specific learning outcomes, dates, access needs and budget constraints reduce follow-up questions.</p></div>
        </div>

        <div className="card planner-card">
          {submitted ? (
            <div className="success">
              <span className="eyebrow accent">Detailed brief ready</span>
              <h3>Terima kasih, {name}.</h3>
              <p>Your {length.toLowerCase()} brief for {school} covers {students} students, {teachers} teachers and {selected.length} learning module{selected.length === 1 ? "" : "s"}. It is ready for initial proposal generation.</p>
              <button className="button button-outline" onClick={() => { setSubmitted(false); setStep(0); }}>Edit brief</button>
            </div>
          ) : <>
            <div className="progress">{Array.from({ length: totalSteps }, (_, item) => <i className={item <= step ? "active" : ""} key={item} />)}<span>Step {step + 1}/{totalSteps}</span></div>
            <p className="step-title">{["Your cohort", "Learning goals", "Trip logistics", "Student needs", "School contact"][step]}</p>

            <div className="form-step">
              {step === 0 && <>
                <Field label="Student level"><OptionGroup options={levels} value={level} onChange={setLevel} /></Field>
                <div className="two-fields">
                  <Field label={`Students — ${students}`}><input className="range" type="range" min="20" max="300" step="5" value={students} onChange={(event) => setStudents(Number(event.target.value))} /></Field>
                  <Field label="Teachers / chaperones"><input type="number" min="1" max="30" value={teachers} onChange={(event) => setTeachers(Number(event.target.value))} /></Field>
                </div>
                <Field label="Preferred programme language"><OptionGroup options={["English", "Bahasa Malaysia", "Bilingual"]} value={language} onChange={setLanguage} /></Field>
              </>}

              {step === 1 && <>
                <Field label="Learning modules (select all that apply)"><div className="module-options">{modules.map(([id, label]) => <button type="button" className={selected.includes(id) ? "selected" : ""} onClick={() => toggleItem(id, setSelected)} key={id}><small>{id}</small><span>{label}</span></button>)}</div></Field>
                <Field label="Preferred learning approach"><OptionGroup options={["Hands-on", "Academic", "Balanced", "Team challenge"]} value={learningStyle} onChange={setLearningStyle} /></Field>
                <Field label="Main learning outcome"><textarea value={learningOutcome} onChange={(event) => setLearningOutcome(event.target.value)} placeholder="Example: Students should explain how limestone landforms develop and document evidence in a field notebook." /></Field>
              </>}

              {step === 2 && <>
                <Field label="Trip length"><OptionGroup options={[...lengths]} value={length} onChange={(value) => setLength(value as (typeof lengths)[number])} /></Field>
                <div className="two-fields">
                  <Field label="School location / departure point"><input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Shah Alam, Selangor" /></Field>
                  <Field label="Preferred dates or school term"><input value={dates} onChange={(event) => setDates(event.target.value)} placeholder="12–13 March 2027" /></Field>
                </div>
                <Field label="Transport arrangement"><OptionGroup options={["Include coach from school", "Meet in Ipoh", "Need advice"]} value={transport} onChange={setTransport} /></Field>
              </>}

              {step === 3 && <>
                <Field label="Target budget per student"><OptionGroup options={["Below RM150", "RM150–RM200", "RM200–RM300", "RM300+"]} value={budget} onChange={setBudget} /></Field>
                <div className="two-fields">
                  <Field label="Dietary requirements"><textarea value={dietary} onChange={(event) => setDietary(event.target.value)} placeholder="Halal, vegetarian, allergies, meal timing" /></Field>
                  <Field label="Accessibility or medical needs"><textarea value={accessibility} onChange={(event) => setAccessibility(event.target.value)} placeholder="Mobility support, medication, sensory needs" /></Field>
                </div>
                <Field label="Approval documents needed"><div className="module-options compact-options">{["Risk assessment", "Parent letter", "Insurance certificate", "Guide licences"].map((item) => <button type="button" className={documents.includes(item) ? "selected" : ""} onClick={() => toggleItem(item, setDocuments)} key={item}><span>{item}</span></button>)}</div></Field>
              </>}

              {step === 4 && <>
                <Field label="School name"><input value={school} onChange={(event) => setSchool(event.target.value)} placeholder="SMK Raja Perempuan" /></Field>
                <div className="two-fields">
                  <Field label="Your name"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cikgu Aminah" /></Field>
                  <Field label="Role / department"><input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Head of Geography" /></Field>
                </div>
                <div className="two-fields">
                  <Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@school.edu.my" /></Field>
                  <Field label="Phone (optional)"><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+60 12 345 6789" /></Field>
                </div>
                <Field label="Anything else the proposal should consider?"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Exam topics, preferred sites, timetable constraints, accommodation standard or special requests." /></Field>
              </>}
              {error && <p className="form-error" role="alert">{error}</p>}
            </div>

            <div className="planner-actions">
              <button className="back" disabled={step === 0} onClick={() => { setError(""); setStep((current) => current - 1); }}>Back</button>
              <button className="button" onClick={step < totalSteps - 1 ? next : submit}>{step < totalSteps - 1 ? "Continue" : "Create proposal brief"}</button>
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><span>{label}</span>{children}</div>;
}

function OptionGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="option-group">{options.map((option) => <button type="button" className={option === value ? "selected" : ""} onClick={() => onChange(option)} key={option}>{option}</button>)}</div>;
}
