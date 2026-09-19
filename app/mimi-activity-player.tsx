import { useEffect, useMemo, useState } from "react";
import { GripVertical, Type, Undo2 } from "lucide-react";
import StudyViewer from "./study-viewer";
import AtlasPartPreview from "./atlas-part-preview";
import { STUDY_ORGANS } from "./study-data";
import type { Atlas, Part } from "./anatomy";
import type { Activity, ActivityAnswer } from "./mimi-lesson-types";
import type { MimiSound } from "./mimi-sound";

type Props = {
  activity: Activity;
  disabled: boolean;
  onAnswerChange: (answer: ActivityAnswer | undefined) => void;
  onInteraction?: (sound: MimiSound) => void;
};
const letters = ["A", "B", "C", "D"];
const activityLabels: Record<Activity["kind"], string> = {
  mcq: "Choose the best answer",
  "type-label": "Name the structure",
  "function-from-model": "Read the structure",
  "sequence-flow": "Build the pathway",
  "case-application": "Clinical reasoning",
  "identify-hotspot": "Locate the structure",
};

// These lessons deliberately use the same BodyParts3D source as the full
// Atlas, rather than a simplified stand-in. The generic organ lessons use
// their bundled GLB scans below; bones and muscles resolve to actual atlas
// pieces because they are not individual GLB files in this repository.
const atlasQueries: Record<string, string[]> = {
  femur: ["femur"],
  "muscle-arm": ["long head of biceps brachii", "short head of biceps brachii"],
};

const modelGuides: Record<string, { label: string; detail: string }[]> = {
  femur: [
    {
      label: "Femoral head",
      detail:
        "The rounded proximal surface that articulates with the acetabulum at the hip.",
    },
    { label: "Shaft", detail: "The long, weight-bearing body of the femur." },
    {
      label: "Condyles",
      detail: "Distal articular surfaces that meet the tibia at the knee.",
    },
  ],
  "muscle-arm": [
    {
      label: "Biceps brachii",
      detail: "Flexes the elbow and assists forearm supination.",
    },
    {
      label: "Triceps brachii",
      detail: "The main extensor of the elbow joint.",
    },
    {
      label: "Tendon",
      detail: "Connective tissue that transfers muscle force to bone.",
    },
  ],
};

function ModelGuide({ organId }: { organId: string }) {
  const items = modelGuides[organId];
  const [active, setActive] = useState(0);
  if (!items) return null;
  return (
    <section className="mimi-model-guide" aria-label="Structure guide">
      <div>
        <strong>Structure guide</strong>
        <span>Tap a landmark for its role</span>
      </div>
      <nav>
        {items.map((item, index) => (
          <button
            key={item.label}
            className={active === index ? "active" : ""}
            onClick={() => setActive(index)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <p>
        <b>{items[active].label}.</b> {items[active].detail}
      </p>
    </section>
  );
}

function AtlasLessonModel({
  organId,
  name,
}: {
  organId: string;
  name: string;
}) {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/models/atlas.json", { signal: controller.signal })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Unable to load anatomy catalogue.")),
      )
      .then((data: unknown) => setAtlas(data as Atlas))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          console.error(error);
      });
    return () => controller.abort();
  }, []);
  const parts = useMemo<Part[]>(() => {
    if (!atlas) return [];
    const queries = atlasQueries[organId] ?? [];
    const ids = new Set(
      queries.flatMap(
        (query) =>
          atlas.concepts.find((concept) => concept.name.toLowerCase() === query)
            ?.elements ?? [],
      ),
    );
    return atlas.parts.filter((part) => ids.has(part.id));
  }, [atlas, organId]);
  if (!atlas)
    return (
      <div className="mimi-real-model-loading">
        Loading the real anatomy model…
      </div>
    );
  if (!parts.length)
    return (
      <div className="mimi-real-model-loading">
        This anatomical structure is unavailable. Try another activity.
      </div>
    );
  return <AtlasPartPreview atlas={atlas} parts={parts} name={name} stage />;
}

export default function MimiActivityPlayer({
  activity,
  disabled,
  onAnswerChange,
  onInteraction,
}: Props) {
  const [choice, setChoice] = useState<number | undefined>();
  const [typed, setTyped] = useState("");
  const [ordered, setOrdered] = useState<string[]>([]);
  useEffect(() => {
    setChoice(undefined);
    setTyped("");
    setOrdered([]);
    onAnswerChange(undefined);
  }, [activity.id]);
  const organ =
    "organ" in activity
      ? STUDY_ORGANS.find((item) => item.id === activity.organ)
      : undefined;
  const choose = (index: number) => {
    if (disabled) return;
    onInteraction?.("select");
    setChoice(index);
    onAnswerChange({ value: index });
  };
  const updateText = (value: string) => {
    if (disabled) return;
    setTyped(value);
    onAnswerChange(value.trim() ? { value } : undefined);
  };
  const remaining = useMemo(
    () =>
      activity.kind === "sequence-flow"
        ? activity.steps.filter((item) => !ordered.includes(item.id))
        : [],
    [activity, ordered],
  );
  const addStep = (id: string) => {
    if (disabled) return;
    onInteraction?.("select");
    const next = [...ordered, id];
    setOrdered(next);
    onAnswerChange({ value: next });
  };
  const removeStep = (id: string) => {
    if (disabled) return;
    const next = ordered.filter((item) => item !== id);
    setOrdered(next);
    onAnswerChange(next.length ? { value: next } : undefined);
  };
  const optionList =
    activity.kind === "mcq" ||
    activity.kind === "function-from-model" ||
    activity.kind === "case-application"
      ? activity.options
      : undefined;
  return (
    <div className={`mimi-activity mimi-activity-${activity.kind}`}>
      <div className="mimi-activity-brief">
        <span>{activityLabels[activity.kind]}</span>
        <p>{activity.learningObjective}</p>
      </div>
      {organ && (
        <>
          <div
            className="mimi-model-card"
            aria-label={`Interactive 3D ${organ.name} model`}
          >
            {atlasQueries[organ.id] ? (
              <AtlasLessonModel organId={organ.id} name={organ.name} />
            ) : (
              <StudyViewer
                key={activity.id}
                organ={organ}
                stage
                showCaption={false}
                mode="study"
                showHotspots={false}
              />
            )}
            {activity.kind === "type-label" && (
              <div className="mimi-target-status">
                <Type size={16} />
                {activity.hint}
              </div>
            )}
          </div>
          {atlasQueries[organ.id] && <ModelGuide organId={organ.id} />}
        </>
      )}
      {activity.kind === "type-label" && (
        <label className="mimi-answer-input">
          <span>Your answer</span>
          <input
            value={typed}
            onChange={(event) => updateText(event.target.value)}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="words"
            placeholder="Type the structure name"
          />
        </label>
      )}
      {activity.kind === "sequence-flow" && (
        <div className="mimi-sequence">
          <p>
            Tap each structure in the order blood travels. Tap a selected step
            to remove it.
          </p>
          <div className="mimi-sequence-answer">
            {ordered.length === 0 ? (
              <span>Build the pathway here</span>
            ) : (
              ordered.map((id, index) => {
                const step = activity.steps.find((item) => item.id === id)!;
                return (
                  <button
                    key={id}
                    onClick={() => removeStep(id)}
                    disabled={disabled}
                  >
                    <b>{index + 1}</b>
                    {step.label}
                  </button>
                );
              })
            )}
          </div>
          <div className="mimi-sequence-bank">
            {remaining.map((step) => (
              <button
                key={step.id}
                onClick={() => addStep(step.id)}
                disabled={disabled}
              >
                <GripVertical size={15} />
                {step.label}
              </button>
            ))}
          </div>
          {ordered.length > 0 && !disabled && (
            <button
              className="mimi-sequence-reset"
              onClick={() => {
                setOrdered([]);
                onAnswerChange(undefined);
              }}
            >
              <Undo2 size={14} /> Reset order
            </button>
          )}
        </div>
      )}
      {optionList && (
        <div className="mimi-options">
          {optionList.map((option, index) => (
            <button
              key={option}
              disabled={disabled}
              className={choice === index ? "chosen" : ""}
              onClick={() => choose(index)}
            >
              <b>{letters[index]}</b>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
