"use client";

import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Focus,
  Info,
  Maximize2,
  RotateCcw,
  RotateCw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import AnatomyScene from "../scene";
import AtlasPartPreview from "../atlas-part-preview";
import {
  DEFAULT_VISIBLE,
  SYSTEMS,
  explanation,
  type Atlas,
  type Concept,
  type SceneState,
  type SystemId,
  type View,
} from "../anatomy";
import { hasStudyIllustrations, studyAsset, studyForName } from "../study-data";
import "../mimi-atlas-return.css";

const initial: SceneState = {
  explode: 0,
  visible: DEFAULT_VISIBLE,
  selected: [],
  isolate: false,
  view: "three-quarter",
  rotate: false,
  reset: 0,
};
type StudyTab = "overview" | "location" | "microscopic" | "compare";

export default function AtlasPage() {
  const router = useRouter();
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [state, setState] = useState<SceneState>(initial);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [studyTab, setStudyTab] = useState<StudyTab>("overview");
  const [studyZoom, setStudyZoom] = useState(1);
  const [studyBoard, setStudyBoard] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/models/atlas.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error("The anatomy catalogue could not be loaded.");
        return response.json();
      })
      .then((data) => setAtlas(data as Atlas))
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError"))
          setError(
            reason instanceof Error
              ? reason.message
              : "The anatomy catalogue could not be loaded.",
          );
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setDetailsOpen(false);
      }
      if (event.key === "/" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const partMap = useMemo(
    () => new Map(atlas?.parts.map((part) => [part.id, part])),
    [atlas],
  );
  const selectedParts = state.selected
    .map((id) => partMap.get(id))
    .filter((part): part is NonNullable<typeof part> => Boolean(part));
  const selected = selectedParts[0];
  const selectedSystem = SYSTEMS.find(
    (system) => system.id === selected?.system,
  );
  const study = chosen ? studyForName(chosen.name) : undefined;
  const hasIllustrations = study ? hasStudyIllustrations(study.id) : false;
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SYSTEMS.map((system) => [
          system.id,
          atlas?.parts.filter((part) => part.system === system.id).length ?? 0,
        ]),
      ),
    [atlas],
  );
  const activeSystems = SYSTEMS.filter((system) => counts[system.id] > 0);
  const visibleCount =
    atlas?.parts.filter((part) =>
      state.isolate
        ? state.selected.includes(part.id)
        : state.visible.includes(part.system) ||
          state.selected.includes(part.id),
    ).length ?? 0;
  const results = useMemo(() => {
    if (!atlas) return [];
    const term = query.trim().toLowerCase();
    if (!term)
      return ["heart", "brain", "liver", "stomach", "femur", "trachea"]
        .map((name) =>
          atlas.concepts.find((concept) => concept.name.toLowerCase() === name),
        )
        .filter((concept): concept is Concept => Boolean(concept));
    return atlas.concepts
      .filter(
        (concept) =>
          concept.name.toLowerCase().includes(term) ||
          concept.id.toLowerCase().includes(term),
      )
      .slice(0, 30);
  }, [atlas, query]);
  const highlightSearchMatch = (name: string) => {
    const term = query.trim();
    const at = name.toLowerCase().indexOf(term.toLowerCase());
    if (!term || at < 0) return name;
    return (
      <>
        {name.slice(0, at)}
        <mark>{name.slice(at, at + term.length)}</mark>
        {name.slice(at + term.length)}
      </>
    );
  };

  const choose = (concept: Concept) => {
    setChosen(concept);
    setStudyTab("overview");
    setStudyBoard(false);
    setStudyZoom(1);
    setState((current) => ({
      ...current,
      selected: concept.elements,
      isolate: false,
      rotate: false,
    }));
    setDetailsOpen(true);
    setSearchOpen(false);
  };

  // Lessons and challenges can link directly to a structure in the complete Atlas.
  useEffect(() => {
    if (!atlas) return;
    const requestedConcept = new URLSearchParams(window.location.search).get(
      "concept",
    );
    if (!requestedConcept) return;
    const normalizedRequest = requestedConcept.trim().toLowerCase();
    const target = atlas.concepts.find(
      (concept) =>
        concept.name.trim().toLowerCase() === normalizedRequest ||
        concept.id.trim().toLowerCase() === normalizedRequest,
    );
    if (target) choose(target);
  }, [atlas]);

  const choosePart = (id: string) => {
    const part = partMap.get(id);
    if (!part) return;
    choose({ id: part.conceptId, name: part.name, elements: [id] });
  };
  const reset = () => {
    setState((current) => ({ ...initial, reset: current.reset + 1 }));
    setChosen(null);
    setDetailsOpen(false);
    setSearchOpen(false);
  };
  const toggle = (id: SystemId) =>
    setState((current) => ({
      ...current,
      selected: [],
      isolate: false,
      visible: current.visible.includes(id)
        ? current.visible.filter((item) => item !== id)
        : [...current.visible, id],
    }));

  return (
    <main className="studio">
      <link rel="preload" href="/models/atlas.json" as="fetch" crossOrigin="anonymous" />
      {atlas && !state.isolate && (
        <AnatomyScene
          atlas={atlas}
          state={{
            ...state,
            inspectorOpen: detailsOpen && selectedParts.length > 0,
          }}
          onSelect={choosePart}
          onProgress={(value) => {
            setProgress(value);
            if (value === 100) setError("");
          }}
          onError={setError}
        />
      )}
      {atlas && state.isolate && selectedParts.length > 0 && (
        <AtlasPartPreview
          atlas={atlas}
          parts={selectedParts}
          name={chosen?.name ?? selectedParts[0].name}
          stage
          fullScreen
        />
      )}
      <div className="vignette" />

      <header className="identity">
        <div className="eyebrow">
          <span className="status-dot" /> INTERACTIVE ANATOMY
        </div>
        <h1>
          Human Atlas <small className="edition">3D</small>
        </h1>
        <div className="identity-meta">
          {atlas ? atlas.parts.length.toLocaleString() : "2,234"} modeled pieces{" "}
          <span>·</span> BodyParts3D
        </div>
      </header>
      <button
        className="mimi-atlas-return"
        onClick={() => router.push("/dashboard?demo=1")}
      >
        <ArrowLeft size={15} /> Back to Mimi
      </button>
      <nav className="top-actions" aria-label="Atlas controls">
        <button
          onClick={() => {
            setSearchOpen((open) => !open);
            setDetailsOpen(false);
          }}
        >
          <Search size={18} />
          <span>Find a structure</span>
          <kbd>/</kbd>
        </button>
        <button
          className="icon-button"
          aria-label="About this atlas"
          onClick={() => {
            setAboutOpen(true);
            setDetailsOpen(false);
          }}
        >
          <Info size={18} />
        </button>
      </nav>

      <section
        className={`layers-panel glass ${state.isolate && study ? "advanced-hidden" : ""}`}
        aria-label="Anatomical layers"
      >
        <div className="panel-heading">
          <span>Systems</span>
          <span className="small-number">{activeSystems.length}</span>
        </div>
        <div className="layer-presets">
          <button
            onClick={() =>
              setState((current) => ({
                ...current,
                selected: [],
                isolate: false,
                visible: activeSystems.map((system) => system.id),
              }))
            }
          >
            All
          </button>
          <button
            onClick={() =>
              setState((current) => ({
                ...current,
                selected: [],
                isolate: false,
                visible: ["skeletal"],
              }))
            }
          >
            Skeleton
          </button>
          <button
            onClick={() =>
              setState((current) => ({
                ...current,
                selected: [],
                isolate: false,
                visible: [
                  "cardiac",
                  "respiratory",
                  "digestive",
                  "urinary",
                  "endocrine",
                  "reproductive",
                ],
              }))
            }
          >
            Organs
          </button>
        </div>
        <div className="system-list">
          {activeSystems.map((system) => (
            <div
              key={system.id}
              className={`system-row ${state.visible.includes(system.id) ? "enabled" : ""}`}
            >
              <button
                className="system-name"
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    visible: [system.id],
                    selected: [],
                    isolate: false,
                  }))
                }
              >
                <span
                  className="system-dot"
                  style={{ background: system.color }}
                />
                {system.name}
                <span className="system-count">{counts[system.id]}</span>
              </button>
              <Switch
                checked={state.visible.includes(system.id)}
                onCheckedChange={() => toggle(system.id)}
                aria-label={`Show ${system.name}`}
              />
            </div>
          ))}
        </div>
        <div className="panel-foot">
          <span>{visibleCount.toLocaleString()} pieces visible</span>
          <button
            onClick={() =>
              setState((current) => ({
                ...current,
                visible: [],
                selected: [],
                isolate: false,
              }))
            }
          >
            Hide all
          </button>
        </div>
      </section>

      {searchOpen && (
        <>
          <button
            className="search-backdrop"
            onClick={() => setSearchOpen(false)}
            aria-label="Close anatomy search"
          />
          <section className="search-panel glass" aria-label="Find anatomy">
            <div className="panel-heading">
              <span>Find a structure</span>
              <Button
                variant="ghost"
                className="icon-button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
                <kbd>Esc</kbd>
              </Button>
            </div>
            <Combobox<Concept>
              items={results}
              value={null}
              onValueChange={(value) => {
                if (value) choose(value);
              }}
              inputValue={query}
              onInputValueChange={setQuery}
              itemToStringLabel={(concept) => concept.name}
              filter={null}
              open
              onOpenChange={(open) => {
                if (!open) setSearchOpen(false);
              }}
            >
              <ComboboxInput
                autoFocus
                placeholder="Search heart, femur, cranial nerve…"
                aria-label="Search named anatomical structures"
                showTrigger={false}
              />
              <ComboboxContent
                alignOffset={-52}
                className="anatomy-search-results"
              >
                <ComboboxEmpty>No structures match your search.</ComboboxEmpty>
                <ComboboxList>
                  {(concept: Concept) => (
                    <ComboboxItem key={concept.id} value={concept}>
                      <span className="search-result-name">
                        {highlightSearchMatch(concept.name)}
                      </span>
                      <span className="small-number">
                        {concept.elements.length}{" "}
                        {concept.elements.length === 1 ? "piece" : "pieces"}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <p className="search-note">
              {query
                ? "Showing matching structures. Press Enter to inspect a result."
                : "Try a major organ, a bone, or a source atlas identifier."}
            </p>
          </section>
        </>
      )}

      <nav
        className={`view-controls glass ${state.isolate && study ? "advanced-hidden" : ""}`}
        aria-label="Camera controls"
      >
        {(["three-quarter", "front", "side", "back"] as View[]).map(
          (view, index) => (
            <button
              key={view}
              className={state.view === view ? "active" : ""}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  view,
                  rotate: false,
                  reset: current.reset + 1,
                }))
              }
            >
              {["¾", "F", "S", "B"][index]}
            </button>
          ),
        )}
        <i />
        <button
          className={state.rotate ? "active" : ""}
          onClick={() =>
            setState((current) => ({ ...current, rotate: !current.rotate }))
          }
          aria-label="Toggle rotation"
        >
          <RotateCw size={18} />
        </button>
        <button onClick={reset} aria-label="Reset atlas">
          <RotateCcw size={17} />
        </button>
      </nav>
      <div
        className={`scene-caption ${state.isolate && study ? "advanced-hidden" : ""}`}
      >
        <span className="caption-line" />
        <span>
          {state.isolate
            ? (chosen?.name ?? "SELECTED STRUCTURE")
            : "ADULT HUMAN · MALE"}
        </span>
        <span className="caption-line" />
      </div>
      <footer className="studio-footer">
        <button onClick={() => setAboutOpen(true)}>Source & credits</button>
      </footer>

      {progress === 0 && !error && (
        <div className="loading glass" role="status">
          <div>
            <strong>Preparing the anatomy</strong>
            <span>
              {progress}% · Loading{" "}
              {atlas?.parts.length.toLocaleString() ?? "2,234"} pieces
            </span>
            <div className="loading-track">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="loading glass error" role="alert">
          <strong>3D model unavailable</strong>
          <span>{error}</span>
          <button onClick={() => location.reload()}>Reload viewer</button>
        </div>
      )}

      {detailsOpen && selected && (
        <aside
          className={`detail-sheet glass ${state.isolate ? "is-isolated" : ""}`}
          aria-label={`${chosen?.name} details`}
        >
          <button
            className="icon-button"
            aria-label="Close structure details"
            onClick={() => setDetailsOpen(false)}
          >
            <X size={18} />
          </button>
          <div className="detail-header">
            <div
              className="detail-accent"
              style={{ background: selectedSystem?.color }}
            />
            <div className="eyebrow">{selectedSystem?.name ?? "ANATOMY"}</div>
            <h2 className="structure-title">{chosen?.name}</h2>
          </div>
          <div className="detail-scroll">
            <p className="structure-description">
              {study?.summary ??
                explanation(chosen?.name ?? selected.name, selected.system)}
            </p>
            {atlas && !state.isolate && (
              <AtlasPartPreview
                atlas={atlas}
                parts={selectedParts}
                name={chosen?.name ?? selected.name}
              />
            )}
            {study ? (
              <section className="study-section">
                <div className="study-heading">
                  <BookOpen size={15} />
                  <span>
                    {state.isolate
                      ? "Dedicated interactive model"
                      : "Detailed organ study"}
                  </span>
                  <small>{study.hotspots.length} labels</small>
                </div>
                {!state.isolate && (
                  <p className="study-start-note">
                    This preview is the same selected Atlas structure. Isolate
                    it for the full study workspace and landmark materials.
                  </p>
                )}
                <div className="study-tabs">
                  {(
                    [
                      "overview",
                      "location",
                      "microscopic",
                      "compare",
                    ] as StudyTab[]
                  ).map((tab) => (
                    <button
                      className={studyTab === tab ? "active" : ""}
                      key={tab}
                      onClick={() => {
                        setStudyTab(tab);
                        setStudyZoom(1);
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {hasIllustrations && studyTab === "overview" ? (
                  <div className="study-overview">
                    <img
                      src={studyAsset(study.id, "organ")}
                      alt={`Illustration of ${study.name}`}
                    />
                    <dl>
                      {study.facts.map((fact) => (
                        <div key={fact.label}>
                          <dt>{fact.label}</dt>
                          <dd>{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : hasIllustrations ? (
                  <figure className="study-illustration">
                    <img
                      src={studyAsset(
                        study.id,
                        studyTab === "overview" ? "organ" : studyTab,
                      )}
                      alt={`${studyTab} illustration of ${study.name}`}
                    />
                  </figure>
                ) : (
                  <div className="study-asset-fallback">
                    <BookOpen size={18} />
                    <span>
                      Use the interactive BodyParts3D model to inspect this
                      structure from every angle.
                    </span>
                  </div>
                )}
                {hasIllustrations && state.isolate && (
                  <button
                    className="expand-study"
                    onClick={() => {
                      setStudyZoom(1);
                      setStudyBoard(true);
                    }}
                  >
                    <Maximize2 size={14} /> Expand illustration
                  </button>
                )}
              </section>
            ) : (
              <span className="context-note">
                Same selected Atlas structure · rotate the preview or isolate it
                for focused inspection.
              </span>
            )}
            <div className="structure-meta">
              <span>
                Atlas reference<strong>{chosen?.id}</strong>
              </span>
              <span>
                Selected pieces
                <strong>{state.selected.length.toLocaleString()}</strong>
              </span>
            </div>
          </div>
          <div className="detail-actions">
            <button
              className={`primary-action ${state.isolate ? "active" : ""}`}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  isolate: !current.isolate,
                  explode: 0,
                }))
              }
            >
              <Focus size={18} />
              {state.isolate
                ? study
                  ? "Return to whole atlas"
                  : "Show surrounding anatomy"
                : "Isolate structure"}
              <ChevronRight size={16} />
            </button>
            <button
              className="secondary-action"
              onClick={() => {
                setState((current) => ({
                  ...current,
                  selected: [],
                  isolate: false,
                }));
                setDetailsOpen(false);
              }}
            >
              Clear selection
            </button>
          </div>
        </aside>
      )}

      {study && hasIllustrations && studyBoard && (
        <section className="study-board glass" role="dialog" aria-modal="true">
          <div className="study-board-header">
            <div>
              <span className="eyebrow">STUDY MATERIAL</span>
              <h2>
                {study.name} · {studyTab}
              </h2>
            </div>
            <button
              className="icon-button"
              onClick={() => setStudyBoard(false)}
              aria-label="Close expanded illustration"
            >
              <X size={18} />
            </button>
          </div>
          <div className="study-board-image">
            <img
              src={studyAsset(
                study.id,
                studyTab === "overview" ? "organ" : studyTab,
              )}
              alt={`${studyTab} illustration of ${study.name}`}
              style={{ transform: `scale(${studyZoom})` }}
            />
          </div>
          <div className="study-board-controls">
            <span>Move closer for landmark review</span>
            <div>
              <button
                onClick={() => setStudyZoom((zoom) => Math.max(1, zoom - 0.25))}
                disabled={studyZoom <= 1}
              >
                <ZoomOut size={16} />
              </button>
              <output>{Math.round(studyZoom * 100)}%</output>
              <button
                onClick={() =>
                  setStudyZoom((zoom) => Math.min(2.5, zoom + 0.25))
                }
                disabled={studyZoom >= 2.5}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
      {aboutOpen && (
        <section className="about-sheet glass" role="dialog" aria-modal="true">
          <button
            className="icon-button"
            aria-label="Close information"
            onClick={() => setAboutOpen(false)}
          >
            <X size={18} />
          </button>
          <div className="eyebrow">SOURCE & SCOPE</div>
          <h2 className="structure-title">A body, revealed.</h2>
          <p>
            Explore the adult male reference anatomy from BodyParts3D. The atlas
            contains 2,234 individual meshes and thousands of named anatomical
            concepts for educational exploration.
          </p>
          <p>
            This reference is an educational atlas, not a diagnostic or surgical
            tool.
          </p>
        </section>
      )}
    </main>
  );
}
