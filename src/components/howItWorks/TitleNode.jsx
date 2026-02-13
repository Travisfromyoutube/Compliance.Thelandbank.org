/**
 * TitleNode — persistent header at the top of the React Flow diagram.
 * No border, no background — just text on the drafting paper.
 * Never dims regardless of active chapter.
 */
export default function TitleNode({ data }) {
  return (
    <div className="text-center select-none pointer-events-none px-4">
      <h2 className="font-heading text-lg font-bold text-text leading-tight">
        {data.title}
      </h2>
      <p className="text-xs text-muted italic mt-0.5">{data.subtitle}</p>
    </div>
  );
}
