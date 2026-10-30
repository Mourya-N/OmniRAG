import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ChatExplorer } from './components/ChatExplorer';
import { SearchExplorer } from './components/SearchExplorer';
import { DocumentManager } from './components/DocumentManager';
import { EvaluationDashboard } from './components/EvaluationDashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'chat' && <ChatExplorer />}
        {activeTab === 'search' && <SearchExplorer />}
        {activeTab === 'documents' && <DocumentManager />}
        {activeTab === 'evaluation' && <EvaluationDashboard />}
      </main>
    </div>
  );
};

export default App;
