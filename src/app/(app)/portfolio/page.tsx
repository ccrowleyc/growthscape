import { ComingSoon } from "@/components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Portfolio Views"
      description="See valuations and plan progress across all your companies."
      bullets={["Compare current and target valuations across companies", "Track Value Creation Plan progress and initiative variances"]}
    />
  );
}
