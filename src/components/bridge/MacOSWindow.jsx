/**
 * MacOSWindow - Skeuomorphic Mac OS 9 window chrome
 *
 * Now accepts children instead of hardcoded tab content.
 * Used as the container for the File Explorer in Chapter 2.
 * CSS classes (.macos9-*) are defined in src/index.css.
 */
export default function MacOSWindow({ title = 'Inside the Portal', children }) {
  return (
    <div className="macos9-desktop">
      <div className="macos9-window">
        {/* Title bar */}
        <div className="macos9-titlebar">
          <span className="macos9-btn macos9-btn-close" />
          <span className="macos9-btn macos9-btn-minimize" />
          <span className="macos9-btn macos9-btn-zoom" />
          <span className="macos9-titlebar-text">{title}</span>
        </div>
        {/* Content */}
        <div className="macos9-content">
          {children}
        </div>
      </div>
    </div>
  );
}
