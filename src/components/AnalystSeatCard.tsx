import type { ModelEvaluation } from "@/types/consensus-capital";
import { ModelReviewCard } from "./ModelReviewCard";

export function AnalystSeatCard({ model }: { model: ModelEvaluation }) {
  return <ModelReviewCard model={model} />;
}
