/**
 * AnnotationNode — small SOP callout that appears near a system node.
 * Fades in when its chapter is active, fades out otherwise.
 * Dashed left border accent, italic text, no background.
 */
export default function AnnotationNode({ data }) {
  const { text, visible } = data;

  return (
    <div
      className={`
        select-none pointer-events-none max-w-[180px]
        border-l-2 border-dashed border-accent/30 pl-2 py-0.5
        transition-opacity duration-300 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="text-[10px] text-muted italic leading-snug">{text}</p>
    </div>
  );
}
