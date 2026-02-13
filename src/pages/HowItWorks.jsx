import { useState, useRef, useCallback, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import ICONS from '../icons/iconMap';
import { AdminPageHeader } from '../components/ui';
import SystemMap from '../components/howItWorks/SystemMap';
import MobileNavStrip from '../components/howItWorks/MobileNavStrip';
import FlipCards from '../components/howItWorks/FlipCard';
import FileExplorer from '../components/howItWorks/FileExplorer';
import TechStack from '../components/howItWorks/TechStack';
import DataFlowPipeline from '../components/howItWorks/DataFlowPipeline';
import SecurityStack from '../components/howItWorks/SecurityStack';
import SyncFlow from '../components/howItWorks/SyncFlow';

/**
 * HowItWorks - "How This Portal Works" page
 *
 * Split-panel layout:
 * - Left (40%): Persistent React Flow system architecture diagram
 * - Right (60%): Scrollable chapters with interactive content
 *
 * Bidirectional sync:
 * - Scrolling chapters highlights the relevant node on the diagram
 * - Clicking a node scrolls to the matching chapter
 * - Mobile: diagram replaced by a horizontal pill strip
 */

/* ── Node-to-chapter mapping (for click-to-scroll) ── */
const NODE_TO_CHAPTER = {
  buyer:      'what-it-does',
  admin:      'what-it-does',
  api:        'whats-inside',
  neon:       'tech-behind-it',
  filemaker:  'how-data-moves',
  compliance: 'data-stays-safe',
  resend:     'how-data-moves',
};

export default function HowItWorks() {
  usePageTitle('How This Portal Works');
  const [activeChapter, setActiveChapter] = useState('what-it-does');
  const chapterRefs = useRef({});
  const scrollContainerRef = useRef(null);

  /* ── Intersection Observer: scroll → highlight node ── */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        }
      },
      {
        root: container,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    Object.values(chapterRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* ── Click node → scroll to chapter ── */
  const handleNodeClick = useCallback((nodeId) => {
    const chapterId = NODE_TO_CHAPTER[nodeId];
    if (!chapterId) return;
    const el = chapterRefs.current[chapterId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveChapter(chapterId);
    }
  }, []);

  /* ── Mobile nav → scroll to chapter ── */
  const handleMobileNav = useCallback((chapterId) => {
    const el = chapterRefs.current[chapterId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveChapter(chapterId);
    }
  }, []);

  const setChapterRef = useCallback((id) => (el) => {
    chapterRefs.current[id] = el;
  }, []);

  return (
    <div className="space-y-0">
      <AdminPageHeader
        title="How This Portal Works"
        subtitle="What's actually happening under the hood"
        icon={ICONS.bookOpen}
      />

      {/* Mobile nav strip */}
      <MobileNavStrip activeChapter={activeChapter} onNavigate={handleMobileNav} />

      {/* Split panel layout */}
      <div className="flex gap-6">
        {/* Left: System Map (hidden on mobile) */}
        <div className="hidden lg:block w-[30%] flex-shrink-0">
          <div className="sticky top-0 h-[calc(100vh-100px)] rounded-lg border border-border drafting-bg overflow-hidden">
            <SystemMap activeChapter={activeChapter} onNodeClick={handleNodeClick} />
          </div>
        </div>

        {/* Right: Chapters */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-w-0 space-y-12 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 scroll-smooth"
        >
          <div id="what-it-does" ref={setChapterRef('what-it-does')}>
            <FlipCards />
          </div>
          <div id="whats-inside" ref={setChapterRef('whats-inside')}>
            <FileExplorer />
          </div>
          <div id="tech-behind-it" ref={setChapterRef('tech-behind-it')}>
            <TechStack />
          </div>
          <div id="how-data-moves" ref={setChapterRef('how-data-moves')}>
            <DataFlowPipeline />
          </div>
          <div id="data-stays-safe" ref={setChapterRef('data-stays-safe')}>
            <SecurityStack />
          </div>
          <div id="what-stays-sync" ref={setChapterRef('what-stays-sync')}>
            <SyncFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
