import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import ScriptGen from './pages/ScriptGen';
import Growth from './pages/Growth';
import Templates from './pages/Templates';
import Assistant from './pages/Assistant';
import { View, ScriptResult } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [generatedScript, setGeneratedScript] = useState<ScriptResult | null>(null);

  const handleScriptToEditor = (script: ScriptResult) => {
      setGeneratedScript(script);
      setCurrentView(View.EDITOR);
  };

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case View.EDITOR:
        return <Editor initialScript={generatedScript} />;
      case View.SCRIPT_AI:
        return <ScriptGen onUseScript={handleScriptToEditor} />;
      case View.ASSISTANT:
        return <Assistant />;
      case View.GROWTH:
        return <Growth />;
      case View.TEMPLATES:
        return <Templates />;
      case View.SETTINGS:
        return <div className="p-8 text-white">Settings Page Placeholder</div>;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;