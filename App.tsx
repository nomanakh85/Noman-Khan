
import React, { useState, useMemo } from 'react';
import { AppView } from './types';
import { CarCustomizerIcon, ChatIcon, HighlightsIcon, LiveIcon, NewsIcon, PitStopIcon, PostRaceIcon, TeamRadioIcon } from './components/icons';

// Lazy load components for better performance
const RaceEngineerChat = React.lazy(() => import('./components/RaceEngineerChat'));
const CarCustomizer = React.lazy(() => import('./components/CarCustomizer'));
const RaceHighlights = React.lazy(() => import('./components/RaceHighlights'));
const PostRaceAnalysis = React.lazy(() => import('./components/PostRaceAnalysis'));
const LiveCommentator = React.lazy(() => import('./components/LiveCommentator'));
const TeamRadio = React.lazy(() => import('./components/TeamRadio'));
const PitStopStrategy = React.lazy(() => import('./components/PitStopStrategy'));
const RacingNews = React.lazy(() => import('./components/RacingNews'));

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.LIVE_COMMENTATOR);

  const navItems = useMemo(() => [
    { view: AppView.LIVE_COMMENTATOR, icon: <LiveIcon />, label: 'Live Commentary' },
    { view: AppView.CAR_CUSTOMIZER, icon: <CarCustomizerIcon />, label: 'Car Customizer' },
    { view: AppView.RACE_HIGHLIGHTS, icon: <HighlightsIcon />, label: 'Race Highlights' },
    { view: AppView.POST_RACE_ANALYSIS, icon: <PostRaceIcon />, label: 'Post-Race Analysis' },
    { view: AppView.RACE_ENGINEER_CHAT, icon: <ChatIcon />, label: 'Engineer Chat' },
    { view: AppView.PIT_STOP_STRATEGY, icon: <PitStopIcon />, label: 'Pit Stop Strategy' },
    { view: AppView.TEAM_RADIO, icon: <TeamRadioIcon />, label: 'Team Radio' },
    { view: AppView.RACING_NEWS, icon: <NewsIcon />, label: 'Racing News' },
  ], []);

  const renderActiveView = () => {
    switch (activeView) {
      case AppView.LIVE_COMMENTATOR: return <LiveCommentator />;
      case AppView.RACE_ENGINEER_CHAT: return <RaceEngineerChat />;
      case AppView.CAR_CUSTOMIZER: return <CarCustomizer />;
      case AppView.RACE_HIGHLIGHTS: return <RaceHighlights />;
      case AppView.POST_RACE_ANALYSIS: return <PostRaceAnalysis />;
      case AppView.TEAM_RADIO: return <TeamRadio />;
      case AppView.PIT_STOP_STRATEGY: return <PitStopStrategy />;
      case AppView.RACING_NEWS: return <RacingNews />;
      default: return <LiveCommentator />;
    }
  };

  return (
    <div className="min-h-screen bg-race-dark flex flex-col md:flex-row font-sans">
      <nav className="bg-black/50 md:w-64 p-4 flex flex-row md:flex-col items-center md:items-stretch border-b-2 md:border-b-0 md:border-r-2 border-race-green/50">
        <div className="text-2xl font-bold text-race-green mb-0 md:mb-8 text-center flex-shrink-0">AI RACING HUB</div>
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-2">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out text-sm md:text-base ${
              activeView === item.view
                ? 'bg-race-green text-race-dark font-bold shadow-lg'
                : 'bg-race-dark-300 text-race-light hover:bg-race-dark-200 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="ml-3 hidden md:inline">{item.label}</span>
          </button>
        ))}
        </div>
      </nav>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <React.Suspense fallback={<div className="flex justify-center items-center h-full text-race-green text-2xl">Loading Module...</div>}>
          {renderActiveView()}
        </React.Suspense>
      </main>
    </div>
  );
};

export default App;
