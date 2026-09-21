"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { ArrowRight, BookOpen, Check, Copy, FlaskConical, Microscope, NotebookPen, SlidersHorizontal, Workflow } from "lucide-react";
import type { SeriesArticle } from "@/content/series";
import {
  ARTICLE4_LESSONS, ARTICLE4_SOURCES, ARTICLE4_SOURCE_NOTE,
  ARTICLE4_TECHNOLOGY_COMPARISON, ARTICLE4_ALGORITHM_COMPARISON,
  ARTICLE4_COMPARISON_NOTE, ARTICLE4_ALGORITHM_NOTE, ARTICLE4_GLOSSARY,
} from "@/content/article4";
import { TeachingMedia } from "./TeachingMedia";
import { Article4Tools } from "./Article4Tools";
import { trackArticle4Event } from "@/lib/analytics";
import { article4LessonPath, parseArticle4Query, type LessonId, type Level } from "@/lib/article4/state";
import { createLearningRecord, saveObservation, removeObservation, clearObservations, learningRecordJson, learningRecordMarkdown, LEARNING_RECORD_NOTICE, LEARNING_RECORD_SESSION_NOTICE } from "@/lib/article4/export";
import type { ModelObservation } from "@/lib/article4/models";
import "./article4.css";

type Mode = "watch" | "steps" | "explore";
const navigationEvent = "article4-navigation";
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(navigationEvent, callback);
  return () => { window.removeEventListener("popstate", callback); window.removeEventListener(navigationEvent, callback); };
}
const snapshot = () => window.location.search;
const serverSnapshot = () => "";

export function Article4Companion({ article }: { article: SeriesArticle }) {
  const queryString = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const query = parseArticle4Query(new URLSearchParams(queryString));
  const lesson = ARTICLE4_LESSONS.find(item => item.id === query.lessonId)!;
  const [modeState, setModeState] = useState<{ lesson: LessonId; mode: Mode }>({ lesson: "sampling", mode: "watch" });
  const mode = modeState.lesson === lesson.id ? modeState.mode : "watch";
  const [record, setRecord] = useState(createLearningRecord);
  const [recordMessage, setRecordMessage] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<{ key: string; message: string; manualLink: string } | null>(null);
  const copyKey = `${lesson.id}:${query.level}`;
  const copyMessage = copyFeedback?.key === copyKey ? copyFeedback.message : "";
  const manualLink = copyFeedback?.key === copyKey ? copyFeedback.manualLink : "";
  const [format, setFormat] = useState<"json" | "markdown">("json");
  const [showRecord, setShowRecord] = useState(false);
  const lessonHeadingRef = useRef<HTMLHeadingElement>(null);
  const [lessonNavigation, setLessonNavigation] = useState(0);
  const sources = ARTICLE4_SOURCES.filter(source => lesson.sourceIds.includes(source.id));
  const hasMissingMedia = ARTICLE4_LESSONS.some(item => !item.media.mp4 || !item.media.gif || item.media.steps.some(step => !step.image));

  useEffect(() => { void trackArticle4Event("article4_lesson_open", { lesson: query.lessonId, level: query.level }); }, [query.lessonId, query.level]);

  useEffect(() => {
    if (!lessonNavigation || !lessonHeadingRef.current) return;
    const heading = lessonHeadingRef.current;
    // The shared sticky navigation wraps at narrow widths. Measure its actual
    // height so lesson links reveal the new content in the in-app panel too.
    const headerHeight = document.querySelector("body header")?.getBoundingClientRect().height ?? 0;
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: Math.max(0, window.scrollY + heading.getBoundingClientRect().top - headerHeight - 24), behavior: "instant" });
  }, [lessonNavigation]);

  function navigate(id: LessonId, level: Level = query.level, nextMode: Mode = "watch", revealLesson = true) {
    setModeState({ lesson: id, mode: nextMode });
    setCopyFeedback(null);
    window.history.pushState(null, "", article4LessonPath(id, level));
    window.dispatchEvent(new Event(navigationEvent));
    if (revealLesson) setLessonNavigation(previous => previous + 1);
  }
  function followLessonLink(event: MouseEvent<HTMLAnchorElement>, id: LessonId, level: Level = query.level) {
    // Keep native open-in-new-tab/window behavior and the real href fallback.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(id, level);
  }
  function chooseMode(next: Mode) {
    setModeState({ lesson: lesson.id, mode: next });
    void trackArticle4Event("article4_mode_change", { lesson: lesson.id, level: query.level, mode: next });
  }
  function save(id: LessonId, observation: ModelObservation) {
    setRecord(previous => saveObservation(previous, id, observation));
    setRecordMessage(`Saved ${ARTICLE4_LESSONS.find(item => item.id === id)!.title}. Later input changes will not change this observation.`);
  }
  async function copyLessonLink() {
    const link = new URL(article4LessonPath(lesson.id, query.level), window.location.origin).toString();
    try { await navigator.clipboard.writeText(link); setCopyFeedback({ key: copyKey, message: "Lesson link copied. Live inputs are not included.", manualLink: "" }); }
    catch { setCopyFeedback({ key: copyKey, message: "Copy the lesson link below. Live inputs are not included.", manualLink: link }); }
  }
  function exportRecord(selectedFormat: "json" | "markdown") {
    const content = selectedFormat === "json" ? learningRecordJson(record) : learningRecordMarkdown(record);
    if (!content) { setRecordMessage("Save an example from Explore before exporting a learning record."); return; }
    const url = URL.createObjectURL(new Blob([content], { type: selectedFormat === "json" ? "application/json" : "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `quantum-foundry-article4-learning-record.${selectedFormat === "json" ? "json" : "md"}`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setRecordMessage(`Exported ${record.observations.length} saved observation${record.observations.length === 1 ? "" : "s"} as ${selectedFormat === "json" ? "JSON" : "Markdown"}.`);
    void trackArticle4Event("article4_note_export", { format: selectedFormat });
  }

  return <div className="article4">
    <header className="a4-hero"><div className="a4-container">
      <nav className="a4-breadcrumb" aria-label="Series breadcrumb"><Link href="/series">Beyond the Quantum Processor</Link><span aria-hidden="true">/</span><span>Article 04</span></nav>
      <div className="a4-eyebrow">Ten lessons · Four educational tools</div>
      <h1>Which quantum machine is worth testing for your problem?</h1>
      <p className="a4-intro">Explore the article’s examples, change one assumption, and see why a fast gate or a large qubit count is not the whole answer.</p>
      <div className="a4-entry-grid">{[
        { id: "sampling" as const, icon: FlaskConical, title: "Understand a chemistry experiment", hint: "Begin with sampling and bias" },
        { id: "scheduling" as const, icon: Workflow, title: "Try the five-job scheduling example", hint: "Inspect jobs and equipment conflicts" },
        { id: "transmon" as const, icon: Microscope, title: "See how the four machines work", hint: "Begin with superconducting qubits" },
      ].map(item => <a key={item.id} href={article4LessonPath(item.id, 100)} className="a4-entry" onClick={event => followLessonLink(event, item.id, 100)}><item.icon aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.hint} →</small></span></a>)}</div>
      <p className="a4-independent">Independent personal project. Not an official Google product. These lessons use educational models and do not run on quantum hardware.</p>
      {article.canonicalArticleUrl && <a href={article.canonicalArticleUrl} target="_blank" rel="noreferrer" className="a4-article-link">Read the full Article 4 ↗</a>}
    </div></header>

    <div className="a4-container">
      {hasMissingMedia && <p className="a4-availability" role="note"><strong>Companion preview.</strong> The original V9 stills and four local tools are available. Videos, GIFs, and numbered step images have not yet been supplied; those media features remain unavailable.</p>}
      {queryString && query.usedDefaults && <p className="a4-availability" role="status">A missing, invalid, or repeated lesson or level used its safe default: sampling or Level 100.</p>}
      <div className="a4-workspace">
        <aside className="a4-sidebar"><div className="a4-sidebar-heading"><BookOpen size={15} aria-hidden="true" /> Lessons</div><nav aria-label="Article 4 lessons">{ARTICLE4_LESSONS.map((item, index) => <a key={item.id} aria-current={lesson.id === item.id ? "page" : undefined} href={article4LessonPath(item.id, query.level)} onClick={event => followLessonLink(event, item.id)}><span className="a4-lesson-number">{String(index + 1).padStart(2, "0")}</span><span>{item.title}</span>{item.tool && <SlidersHorizontal aria-label="Includes an Explore tool" size={13} />}</a>)}</nav><p>Start with the question.<br />Watch, inspect, then explore.</p><a className="a4-record-jump" href="#learning-record">Your learning record ({record.observations.length}) ↓</a></aside>

        <div className="a4-main">
          <article className="a4-lesson" data-lesson-id={lesson.id}>
            <div className="a4-lesson-top"><span>Lesson {String(ARTICLE4_LESSONS.indexOf(lesson) + 1).padStart(2, "0")} / 10</span><span>Article 4 V9</span></div>
            <h2 ref={lessonHeadingRef} tabIndex={-1}>{lesson.question}</h2>
            <div className="a4-lesson-copy">{lesson.paragraphs.map(text => <p key={text}>{text}</p>)}</div>
            {["transmon", "ions", "blockade", "photonics"].includes(lesson.id) && <div className="a4-hardware-links" aria-label="Technology being explained">{([ ["transmon", "Superconducting"], ["ions", "Ions"], ["blockade", "Neutral atoms"], ["photonics", "Photonics"] ] as const).map(([id, title]) => <a key={id} href={article4LessonPath(id, query.level)} aria-current={id === lesson.id ? "page" : undefined} onClick={event => followLessonLink(event, id)}>{title}</a>)}</div>}
            <div className="a4-modes" aria-label="Lesson modes"><button type="button" aria-pressed={mode === "watch"} onClick={() => chooseMode("watch")}>Watch</button><button type="button" aria-pressed={mode === "steps"} onClick={() => chooseMode("steps")}>Step through</button>{lesson.tool && <button type="button" aria-pressed={mode === "explore"} onClick={() => chooseMode("explore")}>Explore</button>}</div>
            {mode !== "explore" && <TeachingMedia key={`${lesson.id}-${mode}`} lesson={lesson} mode={mode} />}
            <div hidden={mode !== "explore"}><Article4Tools lessonId={lesson.id} save={save} navigate={id => navigate(id, query.level, "explore")} /></div>
            {mode !== "explore" && <p className="a4-takeaway"><strong>Takeaway.</strong> {lesson.takeaway}</p>}
            <div className="a4-boundaries"><section><h3>What this shows</h3><p>{lesson.shows}</p></section><section><h3>What this does not show</h3><p>{lesson.doesNotShow}</p></section></div>
            <div className="a4-share"><button className="a4-button" type="button" onClick={() => void copyLessonLink()}><Copy size={15} aria-hidden="true" />Copy lesson link</button><span className="a4-muted" role="status">{copyMessage || "Shares the lesson and level, not your live inputs."}</span>{manualLink && <input aria-label="Lesson link to copy" readOnly value={manualLink} onFocus={event => event.target.select()} />}</div>
          </article>

          <details className="a4-technical" open={query.level === 400} onToggle={event => { const open = event.currentTarget.open; if (open !== (query.level === 400)) navigate(lesson.id, open ? 400 : 100, mode, false); }}><summary>Level 400 — Technical explanation</summary><div>{lesson.technical.paragraphs.map(text => <p key={text}>{text}</p>)}<ul className="a4-equations">{lesson.technical.equations.map(equation => <li key={equation}><code>{equation}</code></li>)}</ul><p>Sources: {lesson.sourceIds.join(", ")}. These are teaching models, not device measurements.</p></div></details>
          <details className="a4-sources"><summary>Sources and model provenance ({sources.length})</summary><p>{ARTICLE4_SOURCE_NOTE}</p><ul>{sources.map(source => <li key={source.id} id={`article4-source-${source.number}`}><a href={source.links[0]?.url} target="_blank" rel="noreferrer">{source.text}</a></li>)}</ul><p>Local calculations execute in your browser. Model version 1.0.0. Source revision article4-v9. No hardware confidence score or new scientific review date is assigned.</p></details>
          <div className="a4-next"><span>Keep exploring</span><a href={article4LessonPath(lesson.nextLessonId, query.level)} onClick={event => followLessonLink(event, lesson.nextLessonId)}>Next: {ARTICLE4_LESSONS.find(item => item.id === lesson.nextLessonId)!.title}<ArrowRight size={15} aria-hidden="true" /></a></div>

          <section className="a4-record" id="learning-record" aria-labelledby="article4-record-heading"><div className="a4-record-header"><div><NotebookPen size={22} aria-hidden="true" /><h2 id="article4-record-heading">Your learning record</h2></div><span>{record.observations.length} saved</span></div><p>{LEARNING_RECORD_SESSION_NOTICE}</p><p>{LEARNING_RECORD_NOTICE}</p>
            {record.observations.length === 0 ? <div className="a4-empty-record">Choose Explore, change an assumption, and select “Save this example.” Watching a lesson does not create an observation.</div> : <ol className="a4-observations">{record.observations.map(observation => <li key={observation.id}><div><strong>{ARTICLE4_LESSONS.find(item => item.id === observation.lessonId)!.title}</strong><span>{observation.modelId} · {observation.capturedAt}</span><details><summary>Inspect saved inputs and results</summary><pre>{JSON.stringify({ inputs: observation.inputs, inputUnits: observation.inputUnits, outputs: observation.outputs, outputUnits: observation.outputUnits }, null, 2)}</pre></details></div><button type="button" className="a4-button" onClick={() => { setRecord(previous => removeObservation(previous, observation.id)); setRecordMessage("Observation removed."); }} aria-label={`Remove ${observation.id}`}>Remove</button></li>)}</ol>}
            <div className="a4-record-actions"><button className="a4-button a4-primary" type="button" onClick={() => exportRecord("json")}>Export JSON</button><button className="a4-button" type="button" onClick={() => exportRecord("markdown")}>Export Markdown</button>{record.observations.length > 0 && <><button className="a4-button" type="button" onClick={() => setShowRecord(previous => !previous)}>{showRecord ? "Hide" : "Preview"} export</button><button className="a4-button" type="button" onClick={() => { setRecord(previous => clearObservations(previous)); setRecordMessage("Learning record cleared."); }}>Clear record</button></>}</div>
            <p role="status" className="a4-record-status">{recordMessage}</p>
            {showRecord && record.observations.length > 0 && <div className="a4-export-preview"><label htmlFor="article4-export-format">Preview format</label><select id="article4-export-format" value={format} onChange={event => setFormat(event.target.value as "json" | "markdown")}><option value="json">JSON</option><option value="markdown">Markdown</option></select><pre>{format === "json" ? learningRecordJson(record) : learningRecordMarkdown(record)}</pre></div>}
          </section>
        </div>
      </div>

      <section className="a4-comparison" aria-labelledby="article4-compare-title"><div className="a4-section-label">Compare questions, not headline scores</div><h2 id="article4-compare-title">Where the article would look first</h2><p>{ARTICLE4_COMPARISON_NOTE}</p><div className="a4-comparison-grid">{ARTICLE4_TECHNOLOGY_COMPARISON.map(row => <article key={row.technology}><h3>{row.technology}</h3><p className="a4-developers">{row.developers}</p><dl><dt>Use cases worth evaluating</dt><dd>{row.useCases}</dd><dt>The question that decides the fit</dt><dd>{row.question}</dd></dl><p className="a4-muted">Sources {row.sourceIds.join(", ")}</p></article>)}</div></section>
      <section className="a4-comparison" aria-labelledby="article4-algorithms-title"><div className="a4-section-label">A separate algorithm comparison</div><h2 id="article4-algorithms-title">The method changes what to measure</h2><p>{ARTICLE4_ALGORITHM_NOTE}</p><div className="a4-table-wrap"><table><caption>Algorithm requirements and fair comparisons</caption><thead><tr><th scope="col">Method</th><th scope="col">What must work well</th><th scope="col">What to compare</th></tr></thead><tbody>{ARTICLE4_ALGORITHM_COMPARISON.map(row => <tr key={row.method}><th scope="row">{row.method}</th><td>{row.requirements}</td><td>{row.comparison}</td></tr>)}</tbody></table></div><details className="a4-sources"><summary>Read the algorithm comparison as a list</summary>{ARTICLE4_ALGORITHM_COMPARISON.map(row => <article key={row.method}><h3>{row.method}</h3><p>Requirements: {row.requirements}</p><p>Compare: {row.comparison}</p></article>)}</details></section>
      <details className="a4-sources a4-all-sources"><summary>All 41 V9 references and glossary</summary><p>{ARTICLE4_SOURCE_NOTE}</p><ol>{ARTICLE4_SOURCES.map(source => <li key={source.id} value={source.number}><a href={source.links[0]?.url} target="_blank" rel="noreferrer">{source.text.replace(/^\[\d+\]\s*/, "")}</a></li>)}</ol><h3>Glossary</h3><dl className="a4-glossary">{ARTICLE4_GLOSSARY.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl></details>
      <section className="a4-assess"><div><Check size={21} aria-hidden="true" /><h2>Assess your own problem</h2><p>Bring your question and classical baseline to Quick Assessment. These lesson examples do not supply scientific evidence or unlock Build.</p></div><Link className="a4-button a4-primary" href="/assess?level=quick&problemClass=UNKNOWN&goal=learning">Assess my own problem<ArrowRight size={16} aria-hidden="true" /></Link></section>
      <noscript><section className="a4-comparison"><h2>All ten lessons</h2><p>Reading works without JavaScript. Enable JavaScript for local tools and learning-record export.</p>{ARTICLE4_LESSONS.map(item => <article key={item.id}><h3>{item.question}</h3>{item.paragraphs.map(text => <p key={text}>{text}</p>)}<p>{item.takeaway}</p><p>What this does not show: {item.doesNotShow}</p></article>)}</section></noscript>
    </div>
  </div>;
}
