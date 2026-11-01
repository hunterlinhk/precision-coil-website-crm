// Re-mounts on every navigation, so each page enters with a short rise.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
