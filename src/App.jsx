import React, { useState } from 'react';
import DraftingWorkspace from './drafting/DraftingWorkspace';
import WorkflowOrchestrator from './workflows/WorkflowOrchestrator';

const App = () => {
  const [surface, setSurface] = useState('drafting');

  return (
    <div className="w-full h-full">
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-sm">
            CCH
          </div>
          <div className="text-lg font-semibold">AnswerConnect Prototype</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSurface('drafting')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              surface === 'drafting' ? 'bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Drafting Workspace
          </button>
          <button
            onClick={() => setSurface('workflows')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              surface === 'workflows' ? 'bg-blue-500' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Workflow Orchestrator
          </button>
        </div>
      </div>

      {surface === 'drafting' ? <DraftingWorkspace /> : <WorkflowOrchestrator />}
    </div>
  );
};

export default App;
