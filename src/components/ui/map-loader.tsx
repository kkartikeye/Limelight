export default function MapLoader() {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950"
      style={{ animation: "loader-fade-out 400ms ease 800ms forwards" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white" />
        <p className="text-sm text-gray-500 tracking-widest uppercase">Limelight</p>
      </div>
    </div>
  );
}
