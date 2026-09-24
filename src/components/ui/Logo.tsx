import { IconMic } from "./Icons";

export default function Logo({ className = "text-3xl", mic = false }: { className?: string; mic?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 font-display font-bold uppercase tracking-tight whitespace-nowrap ${className}`}>
      {mic && <IconMic className="size-[0.8em] shrink-0 text-cesped" />}
      <span>
        Un gol de <span className="text-cesped">Closs</span>
      </span>
    </span>
  );
}
