// handoff/src/components/los/SectionHead.tsx

import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  meta?: string;
  right?: ReactNode;
}

export function SectionHead({ eyebrow, title, meta, right }: Props) {
  return (
    <div className="flex justify-between items-end pb-3.5 border-b border-border mb-4">
      <div>
        {eyebrow && <div className="los-mlabel mb-1.5">{eyebrow}</div>}
        <h2 className="font-serif text-[22px] leading-tight">{title}</h2>
        {meta && <div className="text-xs text-muted-foreground mt-1">{meta}</div>}
      </div>
      {right}
    </div>
  );
}
