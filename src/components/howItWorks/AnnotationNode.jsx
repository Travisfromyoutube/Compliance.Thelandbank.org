/**
 * AnnotationNode - SOP callout for the dark blueprint diagram.
 * Fades in when its chapter is active, fades out otherwise.
 * Light text + subtle dashed border for visibility on dark background.
 */
export default function AnnotationNode({ data }) {
  const { text, visible } = data;

  return (
    <div
      className={`
        select-none pointer-events-none max-w-[180px]
        border-l-2 border-dashed pl-2 py-0.5
        transition-opacity duration-300 ease-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ borderLeftColor: 'rgba(255, 255, 255, 0.15)' }}
    >
      <p className="text-[11px] italic leading-snug"
        style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        {text}
      </p>
    </div>
  );
}
