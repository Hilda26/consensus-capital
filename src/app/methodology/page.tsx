import { MethodologyPanel } from "@/components/MethodologyPanel";

export default function MethodologyPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-deep-navy">METHODOLOGY</h1>
      <div className="mt-6 bg-white/70 border border-dusk-blue/20 rounded-2xl p-6">
        <MethodologyPanel />
      </div>
    </div>
  );
}
