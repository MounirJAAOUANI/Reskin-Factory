interface Prereq {
  label: string;
  description: string;
  required: boolean;
}

const PREREQS: Prereq[] = [
  { label: 'Claude API Key', description: 'For architecture, code and ASO generation', required: true },
  { label: 'OpenAI API Key', description: 'For DALL-E logo generation', required: true },
  { label: 'GitHub Token', description: 'For Actions builds and Pages hosting', required: true },
  { label: 'Google Play Service Account', description: 'For uploading AAB to Play Console', required: true },
  { label: 'Firebase Project', description: 'For Remote Config (AdMob IDs, flags)', required: true },
  { label: 'Android Keystore', description: 'In GitHub Secrets (KEYSTORE_BASE64)', required: true },
  { label: 'Redis', description: 'Optional — falls back to jobs.json file', required: false },
];

interface Props {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function PrereqPanel({ collapsed = false, onToggle }: Props) {
  return (
    <div className="prereq-panel">
      <div className="prereq-header" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <h3>Prerequisites</h3>
        <span>{collapsed ? '▼ Show' : '▲ Hide'}</span>
      </div>
      {!collapsed && (
        <div className="prereq-grid">
          {PREREQS.map((p) => (
            <div key={p.label} className={`prereq-item ${p.required ? 'required' : 'optional'}`}>
              <div className="prereq-dot" />
              <div>
                <strong>{p.label}</strong>
                {!p.required && <span className="badge-optional"> optional</span>}
                <p>{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
