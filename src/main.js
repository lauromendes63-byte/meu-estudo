import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/motion.css';

import { createLocalStorageAdapter } from './domain/storage-adapter.js';
import { createStudyEngine } from './domain/study-engine.js';
import { initToastListeners, vibrate } from './ui/feedback.js';
import { attachMasterDetailSwipeBack, attachTabSwipe } from './ui/gestures.js';
import { createRouter } from './ui/router.js';
import { createPwaUpdater } from './pwa/updater.js';

import { createHeaderNavController } from './ui/views/header-nav.js';
import { createModulesView } from './ui/views/modules-view.js';
import { createModuleDetailView } from './ui/views/module-detail-view.js';
import { createStudyView } from './ui/views/study-view.js';
import { createExamsView } from './ui/views/exams-view.js';
import { createLessonSheet } from './ui/views/lesson-sheet.js';
import { createLessonViewer } from './ui/views/lesson-viewer.js';
import { createModuleModal } from './ui/views/module-modal.js';
import { createExamModal } from './ui/views/exam-modal.js';
import { createSearchModal } from './ui/views/search-modal.js';
import { createSettingsModal } from './ui/views/settings-modal.js';

function bootstrap() {
  initToastListeners();

  const storageAdapter = createLocalStorageAdapter();
  const engine = createStudyEngine({ storageAdapter });
  const updater = createPwaUpdater();

  // References populated right after views mount
  let headerNav = null;
  let modulesView = null;
  let moduleDetailView = null;
  let studyView = null;
  let examsView = null;
  let lessonViewer = null;
  let moduleModal = null;
  let lessonSheet = null;
  let examModal = null;
  let searchModal = null;
  let settingsModal = null;

  function renderAll() {
    modulesView?.render();
    if (engine.state.currentModuleId) {
      moduleDetailView?.render();
    }
    studyView?.render();
    examsView?.render();
    lessonViewer?.renderIfOpen();
  }

  const router = createRouter({
    engine,
    renderAll,
    syncHeaderAndNav: () => headerNav?.sync(),
    onDetailShown: () => {},
    onStudyPaneShown: () => studyView?.refreshVisibleLists()
  });

  moduleModal = createModuleModal({ engine, router });

  lessonSheet = createLessonSheet({
    engine,
    router,
    onNeedModule: () => moduleModal.open(null)
  });

  examModal = createExamModal({
    engine,
    router,
    onNeedModule: () => moduleModal.open(null)
  });

  lessonViewer = createLessonViewer({
    engine,
    router,
    onEditLesson: (lessonId) => lessonSheet.open({ editLessonId: lessonId }),
    onOpenModuleDetail: (moduleId) => router.openModuleDetail(moduleId)
  });

  searchModal = createSearchModal({
    engine,
    router,
    onOpenModuleDetail: (moduleId) => router.openModuleDetail(moduleId),
    onViewLesson: (lessonId) => lessonViewer.open(lessonId)
  });

  settingsModal = createSettingsModal({
    engine,
    router,
    updater
  });

  headerNav = createHeaderNavController({
    engine,
    onQuickSearch: () => searchModal.open(),
    onOpenSettings: () => settingsModal.open(),
    onCenterClick: () => {
      vibrate(8);
      if (engine.getPendingReviews().length > 0) {
        engine.state.studySubTab = 'revisar';
        router.switchTab('tab-estudo');
      } else if (engine.state.lessons.some((l) => !l.isStudied)) {
        engine.state.studySubTab = 'estudar';
        router.switchTab('tab-estudo');
      } else {
        router.switchTab('tab-modulos');
      }
    },
    onTabSelect: (tabId) => {
      vibrate(8);
      router.switchTab(tabId);
    }
  });

  modulesView = createModulesView({
    engine,
    onOpenModuleDetail: (moduleId) => router.openModuleDetail(moduleId),
    onOpenCreateModule: (editId) => moduleModal.open(editId),
    onQuickAddLesson: (moduleId) => lessonSheet.open({ preselectModuleId: moduleId })
  });

  moduleDetailView = createModuleDetailView({
    engine,
    onBack: (opts) => router.closeModuleDetail(opts),
    onEditModule: (moduleId) => moduleModal.open(moduleId),
    onAddLesson: (moduleId) => lessonSheet.open({ preselectModuleId: moduleId }),
    onEditLesson: (lessonId) => lessonSheet.open({ editLessonId: lessonId }),
    onViewLesson: (lessonId) => lessonViewer.open(lessonId)
  });

  studyView = createStudyView({
    engine,
    onQuickAddLesson: (moduleId) => lessonSheet.open({ preselectModuleId: moduleId }),
    onViewLesson: (lessonId) => lessonViewer.open(lessonId)
  });

  examsView = createExamsView({
    engine,
    onOpenCreateExam: () => examModal.open(null),
    onEditExam: (examId) => examModal.open(examId),
    onOpenModuleDetail: (moduleId) => router.openModuleDetail(moduleId),
    onQuickAddLessonForExam: (moduleId, examId) =>
      lessonSheet.open({ preselectModuleId: moduleId, preselectExamId: examId }),
    onViewLesson: (lessonId) => lessonViewer.open(lessonId)
  });

  // Subscribe state mutations to surgical view reconciliation
  engine.subscribe(() => {
    renderAll();
    headerNav.sync();
    if (engine.state.activeTab === 'tab-estudo' && !engine.state.currentModuleId) {
      studyView.refreshVisibleLists();
    }
  });

  // Wire left-edge interactive swipe-back on module detail pane
  attachMasterDetailSwipeBack({
    pane: document.getElementById('tab-modulo-detail'),
    onCommitBack: () => router.closeModuleDetail({ skipTransition: true })
  });

  // Wire horizontal swipe navigation between Módulos <-> Estudo <-> Provas
  attachTabSwipe({
    container: document.getElementById('main-content'),
    shouldIgnoreStart: () => router.isOverlayOpen() || Boolean(engine.state.currentModuleId),
    getAdjacentTab: (delta) => router.getAdjacentTab(delta),
    getActivePane: () => router.getActiveTabPane(),
    onCommitTab: (targetTabId, direction) => {
      vibrate(6);
      router.switchTab(targetTabId, { direction });
    }
  });

  // Initial render & PWA setup
  router.initHistoryListener();
  renderAll();
  headerNav.sync();
  updater.init();
}

bootstrap();
