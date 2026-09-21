import { GlassPanel } from "@/components/ui/GlassPanel";
import { ScrollReveal } from "./ScrollReveal";

const FEATURES = [
  {
    title: "Real-time detection",
    body: "Both scores update live, once a second, while you work.",
  },
  {
    title: "No manual logging",
    body: "Nothing to type in. The webcam and the mouse do the reading.",
  },
  {
    title: "See the correlation",
    body: "One timeline for both signals, so patterns actually stand out.",
  },
  {
    title: "Private by design",
    body: "Video is processed on-device and never leaves your browser.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:px-10 lg:px-16">
      <ScrollReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <GlassPanel key={feature.title} className="p-6">
            <h3 className="font-sans text-base font-semibold text-text">
              {feature.title}
            </h3>
            <p className="mt-2 font-sans text-sm text-text-dim">
              {feature.body}
            </p>
          </GlassPanel>
        ))}
      </ScrollReveal>
    </section>
  );
}
