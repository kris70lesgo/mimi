import { Check, Play, Sparkles } from "lucide-react";
import "./mimi-auth.css";

type Props = { onDemo: () => void };

/**
 * The public build intentionally has one entry point. Personal authentication
 * remains in the codebase for later, but is not exposed while Mimi is in demo.
 */
export default function MimiAuth({ onDemo }: Props) {
  return (
    <main className="mimi-auth">
      <section className="mimi-auth-story">
        <div className="mimi-auth-brand" aria-label="Mimi">
          <span>m</span>Mimi
        </div>
        <div className="mimi-auth-orbit orbit-a" />
        <div className="mimi-auth-orbit orbit-b" />
        <div className="mimi-auth-story-copy">
          <span>INTERACTIVE ANATOMY</span>
          <h1>Build your mental map of the human body.</h1>
          <p>
            Short lessons, living 3D models, and a study routine built for
            exploration.
          </p>
          <ul>
            <li>
              <Check size={16} />
              Explore real anatomy models
            </li>
            <li>
              <Check size={16} />
              Try interactive lessons and practice labs
            </li>
            <li>
              <Check size={16} />
              No account required during the public demo
            </li>
          </ul>
        </div>
        <img
          src="/mimi/mascots/mimi-study.png"
          alt="Mimi studies an anatomical heart"
        />
      </section>
      <section className="mimi-auth-panel">
        <div className="mimi-auth-card mimi-auth-demo-card">
          <div className="mimi-auth-card-top">
            <div className="mimi-auth-mark">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mimi-auth-copy">
            <span>PUBLIC DEMO</span>
            <h2>Explore Mimi</h2>
            <p>
              Enter the full interactive preview—lessons, practice labs, and the
              3D anatomy atlas are ready to try.
            </p>
          </div>
          <button className="mimi-auth-submit mimi-auth-demo" onClick={onDemo}>
            <Play size={18} fill="currentColor" />
            Enter demo
          </button>
          <p className="mimi-auth-legal">
            Demo progress is local to this browser and is not connected to an
            account.
          </p>
        </div>
      </section>
    </main>
  );
}
