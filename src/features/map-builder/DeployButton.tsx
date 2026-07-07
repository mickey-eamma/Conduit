interface DeployButtonProps {
  onDeploy: () => void;
}

const DEPLOY_ICON = '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>';

export function DeployButton({ onDeploy }: DeployButtonProps) {
  return (
    <button className="deploy-btn" id="deployBtn" title="Open this composed map as a read-only page in a new tab" onClick={onDeploy}>
      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: DEPLOY_ICON }} />
      Deploy Asset Map
    </button>
  );
}
