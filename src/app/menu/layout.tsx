export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100dvh", overflow: "hidden", background: "#0c0c0c" }}>
      {children}
    </div>
  );
}
