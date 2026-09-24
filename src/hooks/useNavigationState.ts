import { useReducer, useCallback } from 'react';
import { Subject } from '../types';

export type TabId =
  | 'dashboard'
  | 'study'
  | 'practice'
  | 'simulator'
  | 'leaderboard'
  | 'collaboration'
  | 'upgrade'
  | 'admin'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'about'
  | 'faq'
  | 'profile'
  | '404';

export interface NavigationState {
  activeTab: TabId;
  studySubTab: string;
  initialMockId: string | undefined;
  initialNoteId: string | undefined;
  explainerQuery: string | undefined;
  explainerSubj: Subject | undefined;
  practiceSubject: Subject | undefined;
  practiceAutoStart: boolean;
}

type NavigationAction =
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_STUDY_SUB_TAB'; subTab: string }
  | { type: 'START_MOCK'; mockId: string }
  | { type: 'CLEAR_MOCK_ID' }
  | { type: 'OPEN_STUDY_NOTE'; noteId: string }
  | { type: 'CLEAR_NOTE_ID' }
  | { type: 'JUMP_TO_EXPLAINER'; query: string; subject: Subject }
  | { type: 'CLEAR_EXPLAINER' }
  | { type: 'START_PRACTICE'; subject: Subject; autoStart?: boolean }
  | { type: 'CLEAR_PRACTICE_INITIAL' }
  | { type: 'RESET' };

export const TAB_ROUTES: Record<string, string> = {
  dashboard: '/',
  study: '/study',
  practice: '/practice',
  simulator: '/simulator',
  leaderboard: '/leaderboard',
  collaboration: '/collaboration',
  upgrade: '/upgrade',
  admin: '/admin',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  about: '/about',
  faq: '/faq',
  profile: '/profile',
};

const initialState: NavigationState = {
  activeTab: 'dashboard',
  studySubTab: 'learning',
  initialMockId: undefined,
  initialNoteId: undefined,
  explainerQuery: undefined,
  explainerSubj: undefined,
  practiceSubject: undefined,
  practiceAutoStart: false,
};

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.tab,
        // Clear transient state when switching tabs (except simulator keeps mockId until cleared)
        ...(action.tab !== 'simulator' ? { initialMockId: undefined } : {}),
        ...(action.tab !== 'study' ? { initialNoteId: undefined, explainerQuery: undefined, explainerSubj: undefined } : {}),
      };

    case 'SET_STUDY_SUB_TAB':
      return { ...state, studySubTab: action.subTab };

    case 'START_MOCK':
      return { ...state, activeTab: 'simulator', initialMockId: action.mockId };

    case 'CLEAR_MOCK_ID':
      return { ...state, initialMockId: undefined };

    case 'OPEN_STUDY_NOTE':
      return {
        ...state,
        activeTab: 'study',
        studySubTab: 'learning',
        initialNoteId: action.noteId,
        initialMockId: undefined,
        explainerQuery: undefined,
        explainerSubj: undefined,
      };

    case 'CLEAR_NOTE_ID':
      return { ...state, initialNoteId: undefined };

    case 'JUMP_TO_EXPLAINER':
      return {
        ...state,
        activeTab: 'study',
        studySubTab: 'explainer',
        explainerQuery: action.query,
        explainerSubj: action.subject,
        initialMockId: undefined,
        initialNoteId: undefined,
      };

    case 'CLEAR_EXPLAINER':
      return { ...state, explainerQuery: undefined };

    case 'START_PRACTICE':
      return {
        ...state,
        activeTab: 'practice',
        practiceSubject: action.subject,
        practiceAutoStart: action.autoStart ?? false,
        initialMockId: undefined,
        initialNoteId: undefined,
        explainerQuery: undefined,
        explainerSubj: undefined,
      };

    case 'CLEAR_PRACTICE_INITIAL':
      return { ...state, practiceSubject: undefined, practiceAutoStart: false };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function useNavigationState(initialActiveTab?: TabId) {
  const [state, dispatch] = useReducer(navigationReducer, {
    ...initialState,
    activeTab: initialActiveTab || initialState.activeTab,
  });

  const setTab = useCallback((tab: TabId) => dispatch({ type: 'SET_TAB', tab }), []);
  const setStudySubTab = useCallback((subTab: string) => dispatch({ type: 'SET_STUDY_SUB_TAB', subTab }), []);
  const startMock = useCallback((mockId: string) => dispatch({ type: 'START_MOCK', mockId }), []);
  const clearMockId = useCallback(() => dispatch({ type: 'CLEAR_MOCK_ID' }), []);
  const openStudyNote = useCallback((noteId: string) => dispatch({ type: 'OPEN_STUDY_NOTE', noteId }), []);
  const clearNoteId = useCallback(() => dispatch({ type: 'CLEAR_NOTE_ID' }), []);
  const jumpToExplainer = useCallback((query: string, subject: Subject) => dispatch({ type: 'JUMP_TO_EXPLAINER', query, subject }), []);
  const clearExplainer = useCallback(() => dispatch({ type: 'CLEAR_EXPLAINER' }), []);
  const startPractice = useCallback((subject: Subject, autoStart?: boolean) => dispatch({ type: 'START_PRACTICE', subject, autoStart }), []);
  const clearPracticeInitial = useCallback(() => dispatch({ type: 'CLEAR_PRACTICE_INITIAL' }), []);

  return {
    state,
    dispatch,
    setTab,
    setStudySubTab,
    startMock,
    clearMockId,
    openStudyNote,
    clearNoteId,
    jumpToExplainer,
    clearExplainer,
    startPractice,
    clearPracticeInitial,
  };
}
