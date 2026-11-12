import { daysDiff, formatHeaderDate } from '../../domain/dates.js';

const TAB_INDEX = {
  'tab-modulos': '0',
  'tab-estudo': '1',
  'tab-provas': '2'
};

export function createHeaderNavController({ engine, onQuickSearch, onOpenSettings, onCenterClick, onTabSelect }) {
  const btnSearch = document.getElementById('btn-open-search');
  const btnSettings = document.getElementById('btn-open-settings');
  const btnCenter = document.getElementById('btn-header-center-status');
  const headerDateEl = document.getElementById('header-date');
  const dock = document.getElementById('app-dock');
  const navBtns = Array.from(document.querySelectorAll('.nav-tab-btn'));
  const navRevDot = document.getElementById('nav-rev-dot');
  const navExamsBadge = document.getElementById('nav-provas-badge');

  btnSearch?.addEventListener('click', () => onQuickSearch?.());
  btnSettings?.addEventListener('click', () => onOpenSettings?.());
  btnCenter?.addEventListener('click', () => onCenterClick?.());

  for (const btn of navBtns) {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      if (targetTab) onTabSelect?.(targetTab);
    });
  }

  function sync() {
    const dueReviews = engine.getPendingReviews().length;
    const unstudiedCount = engine.state.lessons.filter((l) => !l.isStudied).length;

    if (headerDateEl) {
      if (dueReviews > 0) {
        headerDateEl.textContent = `${dueReviews} ${dueReviews === 1 ? 'revisão para hoje' : 'revisões para hoje'}`;
        headerDateEl.classList.add('is-alert');
      } else if (unstudiedCount > 0) {
        headerDateEl.textContent = `${unstudiedCount} ${unstudiedCount === 1 ? 'aula pendente' : 'aulas pendentes'}`;
        headerDateEl.classList.remove('is-alert');
      } else {
        headerDateEl.textContent = formatHeaderDate();
        headerDateEl.classList.remove('is-alert');
      }
    }

    const activeTab = engine.state.activeTab || 'tab-modulos';
    if (dock) {
      dock.dataset.activeIndex = TAB_INDEX[activeTab] ?? '0';
    }

    for (const btn of navBtns) {
      const isActive = btn.dataset.tab === activeTab;
      btn.classList.toggle('is-active', isActive);
      if (isActive) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    }

    if (navRevDot) {
      navRevDot.hidden = dueReviews === 0;
    }

    const todayStr = engine.getTodayStr();
    const nearExams = engine.state.exams.filter((exam) => {
      const diff = daysDiff(exam.date, todayStr);
      return diff >= 0 && diff <= 7;
    });

    if (navExamsBadge) {
      if (nearExams.length > 0) {
        navExamsBadge.textContent = String(nearExams.length);
        navExamsBadge.hidden = false;
      } else {
        navExamsBadge.hidden = true;
      }
    }
  }

  return { sync };
}
