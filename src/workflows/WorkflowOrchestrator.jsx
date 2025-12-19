import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  FileText,
  GitBranch,
  BarChart3,
  Settings,
  Plus,
  ChevronRight,
  Circle,
  Zap,
  Target,
  ArrowRight,
  Eye,
  Download,
} from 'lucide-react';

const WorkflowOrchestrator = () => {
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [canvasModules, setCanvasModules] = useState([]);
  const [draggedModule, setDraggedModule] = useState(null);
  const [connections, setConnections] = useState([]);
  const [draggingCanvasModule, setDraggingCanvasModule] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeDropdownModuleId, setActiveDropdownModuleId] = useState(null);
  const [configuringModule, setConfiguringModule] = useState(null);
  const [configFormData, setConfigFormData] = useState({});
  const [configStep, setConfigStep] = useState(1);


  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };


  const availableModules = [
    { id: 'trigger', name: 'Trigger', icon: Zap, color: 'bg-yellow-500', description: 'Start workflow' },
    { id: 'analyze', name: 'AI Analysis', icon: Target, color: 'bg-purple-500', description: 'Process with AI' },
    { id: 'validate', name: 'Validate', icon: CheckCircle, color: 'bg-green-500', description: 'Check rules' },
    { id: 'route', name: 'Route/Assign', icon: Users, color: 'bg-indigo-600', description: 'Assign to team' },
    { id: 'output', name: 'Output', icon: Download, color: 'bg-gray-700', description: 'Generate result' },
  ];



  const workflows = [
    {
      id: 1,
      name: 'IRS CP2000 Response Builder',
      description: 'Process CP2000 notices, reconcile income, draft response',
      steps: 5,
      accuracy: '96%',
      avgTime: '45 min',
      avgTimeMinutes: 45,
      trigger: 'Inbound CP2000 PDF',
      lastRun: '2 hours ago',
    },
  ];

  const metrics = [
    { label: 'Active Workflows', value: '1', change: '', trend: 'neutral' },
    { label: 'Total Triggers', value: '87', change: '+12', trend: 'up' },
    { label: 'Completion Rate', value: '96%', change: '+2%', trend: 'up' },
    { label: 'Avg. Cycle Time', value: '45 min', change: '-3 min', trend: 'up' },
  ];



  const getTimeCategory = (minutes) => {
    if (minutes <= 30) return { label: 'Fast', color: 'bg-green-100 text-green-700', icon: '⚡' };
    if (minutes <= 45) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: '⏱' };
    return { label: 'Long', color: 'bg-red-100 text-red-700', icon: '⏳' };
  };

  const getWorkflowSteps = (workflowId) => {
    const stepsByWorkflow = {
      1: [
        {
          id: 's1',
          name: 'Trigger: New CP2000 Notice',
          description: 'Detect inbound CP2000 notice and create case file',
          agent: 'Intake Service',
          detail: 'Parsing PDF, extracting notice fields, tagging client',
          duration: '2 min',
        },
        {
          id: 's3',
          name: 'AI Analysis',
          description: 'Reconcile notice vs. reported income',
          agent: 'AI Analyst',
          detail: 'Running reconciliations and highlighting discrepancies',
          duration: '12 min',
        },
        {
          id: 's4',
          name: 'Validate',
          description: 'Apply compliance checks and thresholds',
          agent: 'Rules Engine',
          detail: 'Applying business rules and variance checks',
          duration: '9 min',
        },
        {
          id: 's5',
          name: 'Route/Assign',
          description: 'Assign to preparer/reviewer and notify client',
          agent: 'Assignment Service',
          detail: 'Routing to team, posting client tasks',
          duration: '7 min',
          color: 'bg-indigo-600',
          icon: Users,
        },
        {
          id: 's6',
          name: 'Output',
          description: 'Draft response packet and export',
          agent: 'Export Service',
          detail: 'Generating draft response and attaching workpapers',
          duration: '7 min',
        },
      ],
    };
    return stepsByWorkflow[workflowId] || [];
  };





  const handleExportReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const reportContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Workflow Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .date { color: #666; font-size: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .metric-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: #1e40af; }
    .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: bold; color: #1e40af; }
    tr:hover { background: #f9fafb; }
    .chart { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .bar { display: inline-block; background: #3b82f6; margin: 0 5px; width: 60px; text-align: center; color: white; }
    .bar-container { display: flex; align-items: flex-end; height: 200px; gap: 20px; margin: 20px 0; }
    .bar-wrapper { display: flex; flex-direction: column; align-items: center; }
    .bar-label { margin-top: 10px; font-size: 12px; color: #666; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Workflow Performance Report</h1>
    <p class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>Report Period: Last 30 Days</p>
  </div>

  <h2>Summary Metrics</h2>
  <div class="metrics">
    <div class="metric-card">
      <div class="metric-value">87</div>
      <div class="metric-label">Total Workflow Runs</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">42 min</div>
      <div class="metric-label">Average Run Time</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">96%</div>
      <div class="metric-label">Success Rate</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">2 hrs ago</div>
      <div class="metric-label">Last Run</div>
    </div>
  </div>

  <h2>Per-Workflow Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Workflow Name</th>
        <th>Runs</th>
        <th>Avg Time</th>
        <th>Success Rate</th>
        <th>Last Run</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>IRS CP2000 Response Builder</td>
        <td>28</td>
        <td>45 min</td>
        <td>96%</td>
        <td>2 hours ago</td>
      </tr>
      <tr>
        <td>1099-K Threshold Change Client Audit</td>
        <td>23</td>
        <td>38 min</td>
        <td>94%</td>
        <td>1 week ago</td>
      </tr>
      <tr>
        <td>ERC Claim Validation Workflow</td>
        <td>19</td>
        <td>52 min</td>
        <td>98%</td>
        <td>Yesterday</td>
      </tr>
      <tr>
        <td>FinCEN Beneficial Ownership Filing</td>
        <td>17</td>
        <td>28 min</td>
        <td>97%</td>
        <td>3 days ago</td>
      </tr>
    </tbody>
  </table>

  <h2>Workflow Runs Trend</h2>
  <div class="chart">
    <p style="margin-bottom: 20px; color: #666;">Weekly workflow execution volume</p>
    <div class="bar-container">
      <div class="bar-wrapper">
        <div class="bar" style="height: 140px; display: flex; align-items: center; justify-content: center;">18</div>
        <div class="bar-label">Week 1</div>
      </div>
      <div class="bar-wrapper">
        <div class="bar" style="height: 180px; display: flex; align-items: center; justify-content: center;">23</div>
        <div class="bar-label">Week 2</div>
      </div>
      <div class="bar-wrapper">
        <div class="bar" style="height: 160px; display: flex; align-items: center; justify-content: center;">20</div>
        <div class="bar-label">Week 3</div>
      </div>
      <div class="bar-wrapper">
        <div class="bar" style="height: 200px; display: flex; align-items: center; justify-content: center;">26</div>
        <div class="bar-label">Week 4</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Generated by CCH AnswerConnect Cognitive Workflow Orchestrator<br>
    &copy; ${new Date().getFullYear()} Wolters Kluwer. All rights reserved.
  </div>
</body>
</html>
      `;

      const blob = new Blob([reportContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-metrics-report-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, 1500);
  };

  const handleDragStart = (e, module) => {
    // START: Refactored to use dataTransfer
    e.dataTransfer.setData('application/react-dnd-id', module.id);
    e.dataTransfer.effectAllowed = 'copy';
    // END: Refactored to use dataTransfer
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    // START: Refactored to use dataTransfer
    const moduleId = e.dataTransfer.getData('application/react-dnd-id');
    if (moduleId) {
      const moduleType = availableModules.find((m) => m.id === moduleId);
      if (!moduleType) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      const newModule = {
        ...moduleType,
        id: `${moduleId}-${Date.now()}`,
        x,
        y,
      };

      setCanvasModules((prevModules) => {
        const updatedModules = [...prevModules, newModule];

        // Auto-connect to the last module if one exists
        if (prevModules.length > 0) {
          const lastModule = prevModules[prevModules.length - 1];
          setConnections((prevConnections) => [
            ...prevConnections,
            { from: lastModule.id, to: newModule.id }
          ]);
        }

        return updatedModules;
      });
    }
    // END: Refactored to use dataTransfer
  };

  const handleCanvasModuleMouseDown = (e, moduleId) => {
    e.stopPropagation();
    const module = canvasModules.find((m) => m.id === moduleId);
    if (!module) return;
    const rect = e.currentTarget.closest('.canvas-area').getBoundingClientRect();
    setDraggingCanvasModule(moduleId); // START: Added missing state update
    setDragOffset({
      x: (e.clientX - rect.left - pan.x) / zoom - module.x,
      y: (e.clientY - rect.top - pan.y) / zoom - module.y,
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingCanvasModule) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
    const newY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
    setCanvasModules((mods) => mods.map((m) => (m.id === draggingCanvasModule ? { ...m, x: newX, y: newY } : m)));
  };

  const handleCanvasMouseUp = () => {
    setDraggingCanvasModule(null);
  };

  const handleRemoveModule = (moduleId) => {
    setCanvasModules(canvasModules.filter((m) => m.id !== moduleId));
    setConnections(connections.filter((c) => c.from !== moduleId && c.to !== moduleId));
  };

  const handleClearCanvas = () => {
    setCanvasModules([]);
    setConnections([]);
  };

  const handleRunWorkflow = () => {
    if (!activeWorkflow) return;
    setWorkflowRunning(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    const steps = getWorkflowSteps(activeWorkflow.id);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        }
        clearInterval(interval);
        setWorkflowRunning(false);
        setCompletedSteps((completed) => [...completed, prev]);
        return prev;
      });
    }, 2000);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.2), 1));
    } else {
      setPan((prev) => {
        const newX = Math.max(Math.min(prev.x - e.deltaX, 3000), -3000);
        const newY = Math.max(Math.min(prev.y - e.deltaY, 3000), -3000);
        return { x: newX, y: newY };
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-sm">CCH</div>
            <span className="text-xl font-semibold">AnswerConnect</span>
          </div>
          <ChevronRight className="text-gray-300" size={20} />
          <span className="text-gray-200">Cognitive Workflow Orchestrator</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm hover:text-gray-200" onClick={() => setShowBuilder(false)}>
            Close Builder
          </button>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowMetrics(false);
              setShowBuilder(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${!showMetrics && !showBuilder ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <GitBranch size={18} />
            Workflows
          </button>
          <button
            onClick={() => {
              setShowMetrics(true);
              setShowBuilder(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showMetrics ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => {
                setShowBuilder(true);
                setActiveWorkflow(null);
              }}
              className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2 shadow-md"
            >
              <Plus size={18} />
              Create New Workflow
            </button>
          </div>

          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Active Workflows</h3>
            <div className="space-y-2">
              {workflows.map((workflow) => {
                const timeCategory = getTimeCategory(workflow.avgTimeMinutes);
                return (
                  <div
                    key={workflow.id}
                    onClick={() => setActiveWorkflow(workflow)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${activeWorkflow?.id === workflow.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                  >
                    <div className="font-semibold text-gray-800 text-sm mb-1">{workflow.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{workflow.description}</div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-500">{workflow.steps} steps</span>
                      <span className="text-green-600 font-medium">{workflow.accuracy}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`${timeCategory.color} px-2 py-1 rounded-full font-medium w-20 text-center`} title={`Average time: ${workflow.avgTime}`}>
                        {timeCategory.icon} {timeCategory.label}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">Last: {workflow.lastRun}</span>
                    </div>
                  </div>
                );
              })}
            </div>


          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {showBuilder ? (
            <div className="h-full flex flex-col">
              <div className="bg-white border-b p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Workflow Builder</h1>
                    <p className="text-gray-600">Drag and drop modules to create your workflow</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleClearCanvas} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Clear Canvas
                    </button>
                    <button onClick={() => setShowBuilder(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium">
                      Save Workflow
                    </button>
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-2 border border-gray-300">
                      <button onClick={handleZoomOut} className="p-1 hover:bg-white rounded text-gray-600" title="Zoom Out">-</button>
                      <span className="mx-2 text-xs font-medium text-gray-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
                      <button onClick={handleZoomIn} className="p-1 hover:bg-white rounded text-gray-600" title="Zoom In">+</button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div
                        key={module.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, module)}
                        className={`${module.color} text-white px-4 py-3 rounded-lg cursor-move hover:opacity-90 flex items-center gap-2 flex-shrink-0 shadow-md`}
                      >
                        <Icon size={18} />
                        <div>
                          <div className="font-semibold text-sm">{module.name}</div>
                          <div className="text-xs opacity-90">{module.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="flex-1 bg-gray-100 relative overflow-hidden canvas-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onClick={() => setActiveDropdownModuleId(null)}
                onWheel={handleWheel}
                style={{
                  backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                  backgroundPosition: `${pan.x}px ${pan.y}px`,
                }}
              >
                <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
                  {canvasModules.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `scale(${1 / zoom})` }}>
                      <div className="text-center text-gray-400">
                        <GitBranch size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Drag modules here to build your workflow</p>
                        <p className="text-sm">Start with a Trigger module</p>
                      </div>
                    </div>
                  )}

                  <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {connections.map((conn, idx) => {
                      const fromModule = canvasModules.find((m) => m.id === conn.from);
                      const toModule = canvasModules.find((m) => m.id === conn.to);
                      if (!fromModule || !toModule) return null;

                      // Calculate centers
                      const x1 = fromModule.x + 80;
                      const y1 = fromModule.y + 40;
                      const x2 = toModule.x + 80;
                      const y2 = toModule.y + 40;

                      // Gap constant
                      const gap = 0;

                      // Source point (Right center of fromModule)
                      const startX = fromModule.x + 80 + gap;
                      const startY = fromModule.y;

                      // Target point (Left center of toModule)
                      const endX = toModule.x - 80 - gap;
                      const endY = toModule.y;

                      // Control points for cubic bezier (curvature)
                      const dist = Math.abs(endX - startX);
                      const cp1x = startX + (dist * 0.4); // Control point 1 towards right
                      const cp1y = startY;
                      const cp2x = endX - (dist * 0.4);   // Control point 2 towards left
                      const cp2y = endY;

                      const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;



                      return (
                        <g key={idx}>
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth={3 / zoom}
                            strokeDasharray={`${8 / zoom} ${6 / zoom}`}
                            markerEnd="url(#arrowhead)"
                          />
                        </g>
                      );
                    })}
                    <defs>
                      <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto" markerUnits="strokeWidth">
                        <polygon points="0 0, 5 2.5, 0 5" fill="#3b82f6" />
                      </marker>
                    </defs>
                  </svg>

                  {canvasModules.map((module) => {
                    const Icon = module.icon;
                    const isDragging = draggingCanvasModule === module.id;
                    const isDropdownOpen = activeDropdownModuleId === module.id;

                    return (
                      <div
                        key={module.id}
                        className={`absolute ${module.color} text-white rounded-lg shadow-lg group transition-shadow ${isDragging ? 'cursor-grabbing shadow-2xl z-50' : 'cursor-pointer hover:shadow-xl z-10'
                          }`}
                        style={{ left: `${module.x - 80}px`, top: `${module.y - 40}px`, width: '160px', height: '80px', userSelect: 'none', touchAction: 'none' }}
                        onMouseDown={(e) => handleCanvasModuleMouseDown(e, module.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Prevent opening if we just finished dragging (simple heuristic could be checking if isDragging was true, but React updates might make that tricky. 
                          // For now, let's assume click is fine. If dragging happened, usually pointer events might be captured differently, but let's test.)
                          if (!draggingCanvasModule) {
                            setActiveDropdownModuleId(isDropdownOpen ? null : module.id);
                          }
                        }}
                      >
                        <div className="p-3 h-full flex flex-col justify-center items-center relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveModule(module.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <span className="text-xs">×</span>
                          </button>
                          <Icon size={24} className="mb-1 pointer-events-none" />
                          <div className="font-semibold text-sm text-center pointer-events-none">{module.name}</div>

                          {/* Dropdown Menu */}
                          {isDropdownOpen && (
                            <div className="absolute top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Configure clicked for', module.name);
                                  setActiveDropdownModuleId(null);
                                  setConfiguringModule(module);
                                  setConfigFormData(module.config || {});
                                  setConfigStep(1);
                                }}
                              >
                                Configure
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-start gap-2 text-sm text-blue-900">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Quick Start:</strong> Drag a <strong>Trigger</strong> module to start, then add <strong>AI Analysis</strong>, <strong>Validate</strong>, and finish with <strong>Output</strong>. Modules will auto-connect in sequence.
                  </div>
                </div>
              </div>
            </div>
          ) : !showMetrics ? (
            activeWorkflow ? (
              <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800 mb-2">{activeWorkflow.name}</h1>
                      <p className="text-gray-600">{activeWorkflow.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRunWorkflow}
                        disabled={workflowRunning}
                        className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${workflowRunning ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                      >
                        <Play size={18} />
                        {workflowRunning ? 'Running...' : 'Run Workflow'}
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Settings size={18} />
                        Configure
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Total Steps</div>
                      <div className="text-2xl font-bold text-blue-600">{activeWorkflow.steps}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Avg. Time</div>
                      <div className="text-2xl font-bold text-green-600">{activeWorkflow.avgTime}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Accuracy</div>
                      <div className="text-2xl font-bold text-purple-600">{activeWorkflow.accuracy}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Trigger</div>
                      <div className="text-sm font-semibold text-orange-600 mt-2">{activeWorkflow.trigger}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <GitBranch size={20} className="text-blue-600" />
                    Workflow Pipeline
                  </h2>

                  <div className="space-y-4">
                    {getWorkflowSteps(activeWorkflow.id).map((step, index) => {
                      const isCompleted = completedSteps.includes(index);
                      const isCurrent = currentStep === index && workflowRunning;
                      const isPending = index > currentStep || !workflowRunning;
                      return (
                        <div key={step.id} className="relative">
                          {index < getWorkflowSteps(activeWorkflow.id).length - 1 && (
                            <div className={`absolute left-5 top-12 w-0.5 h-16 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                          )}

                          <div
                            className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${isCurrent
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : isCompleted
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white'
                              }`}
                          >
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                              {isCompleted ? <CheckCircle size={20} /> : isCurrent ? <Zap size={20} /> : <Circle size={20} />}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-bold text-gray-800">{step.name}</h3>
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                                <div className="text-right">
                                  <div
                                    className={`text-xs font-semibold px-3 py-1 rounded-full ${isCompleted
                                      ? 'bg-green-100 text-green-700'
                                      : isCurrent
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                      }`}
                                  >
                                    {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">{step.duration}</div>
                                </div>
                              </div>

                              {(isCurrent || isCompleted) && (
                                <div className="mt-3 bg-white border border-gray-200 rounded p-3">
                                  <div className="text-xs text-gray-600 mb-1">
                                    <strong>Agent:</strong> {step.agent}
                                  </div>
                                  <div className="text-xs text-gray-700">{step.detail}</div>
                                  {isCurrent && (
                                    <div className="mt-2">
                                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {completedSteps.length === getWorkflowSteps(activeWorkflow.id).length && (
                    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">Workflow Completed Successfully!</h3>
                          <p className="text-sm text-gray-600">All steps executed without errors</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded p-3">
                          <div className="text-xs text-gray-600">Total Time</div>
                          <div className="text-xl font-bold text-green-600">47 min</div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className="text-xs text-gray-600">Sources Processed</div>
                          <div className="text-xl font-bold text-blue-600">47</div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className="text-xs text-gray-600">Citations Verified</div>
                          <div className="text-xl font-bold text-purple-600">23</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2">
                          <Eye size={18} />
                          View Output
                        </button>
                        <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2">
                          <Download size={18} />
                          Download Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="mx-auto mb-4 text-gray-400" size={64} />
                  <h2 className="text-xl font-bold text-gray-700 mb-2">Select a Workflow</h2>
                  <p className="text-gray-500">Choose a workflow from the left panel to view details</p>
                </div>
              </div>
            )
          ) : (
            <div className="max-w-6xl mx-auto p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Workflow Analytics</h1>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-xs text-gray-600 mb-2">{metric.label}</div>
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold text-gray-800">{metric.value}</div>
                      <div className={`text-xs font-semibold ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Workflow Performance Trends</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Success Rate Over Time</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span>Success Rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Completion Time</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 relative border-l border-b border-gray-300">
                    <div
                      className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2"
                      style={{ marginLeft: '-30px' }}
                    >
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>

                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-gray-200"></div>
                      ))}
                    </div>

                    <svg className="w-full h-full" viewBox="0 0 600 250" preserveAspectRatio="none">
                      <polyline
                        points="0,87 50,58 100,50 150,62 200,37 250,25 300,30 350,20 400,32 450,12 500,10 550,15 600,10"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        className="drop-shadow-lg"
                      />
                      {[87, 58, 50, 62, 37, 25, 30, 20, 32, 12, 10, 15, 10].map((y, idx) => (
                        <circle key={idx} cx={idx * 50} cy={y} r="4" fill="#3b82f6" />
                      ))}

                      <polyline
                        points="0,150 50,145 100,130 150,140 200,120 250,125 300,110 350,115 400,105 450,100 500,95 550,90 600,85"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                      {[150, 145, 130, 140, 120, 125, 110, 115, 105, 100, 95, 90, 85].map((y, idx) => (
                        <circle key={idx} cx={idx * 50} cy={y} r="4" fill="#10b981" />
                      ))}
                    </svg>

                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-500">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                      <span>Jul</span>
                      <span>Aug</span>
                      <span>Sep</span>
                      <span>Oct</span>
                      <span>Nov</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Workflow Executions</h2>
                <div className="space-y-3">
                  {[
                    { name: 'IRS CP2000 Response Builder', time: '2 hours ago', status: 'success', duration: '47 min' },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={20} />
                        <div>
                          <div className="font-medium text-gray-800">{activity.name}</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-700">{activity.duration}</div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 bg-white border-l overflow-y-auto p-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Zap size={18} />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleExportReport}
                disabled={isExporting}
                className="w-full text-left px-3 py-2 bg-white rounded border hover:bg-purple-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Generating Report...' : 'Export Metrics Report'}
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Pro Tip</h3>
            <p className="text-sm text-gray-700">
              Use the workflow builder to chain multiple processes together. For example, connect "Trigger" → "AI Analysis" → "Validate" → "Route/Assign" to create end-to-end automation that saves hours of manual review time.
            </p>
          </div>
        </div>
      </div>


      {
        configuringModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Configure {configuringModule.name}
                  {configuringModule.name === 'Trigger' && <span className="text-sm font-normal text-gray-500 ml-2">(Step {configStep} of 2)</span>}
                </h2>
                <button onClick={() => setConfiguringModule(null)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                  ×
                </button>
              </div>

              <div className="p-6">
                {configuringModule.name === 'Trigger' ? (
                  <>
                    {/* Step 1: Mode Selection */}
                    {configStep === 1 && (
                      <div className="space-y-3">
                        <p className="font-medium text-gray-700 mb-2">Select Trigger Mode:</p>
                        {['Topic Match', 'Jurisdiction Detection', 'Cross-Reference Detection'].map((option) => (
                          <label key={option} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              name="triggerMode"
                              value={option}
                              checked={configFormData.triggerMode === option}
                              onChange={(e) => setConfigFormData({ ...configFormData, triggerMode: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-gray-800">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Step 2: Details */}
                    {configStep === 2 && (
                      <div className="space-y-6">
                        {configFormData.triggerMode === 'Topic Match' && (
                          <>
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Monitored Topics / Codes:</p>
                              <div className="space-y-2 ml-1">
                                {['§48', 'ERC', '1099-K'].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={configFormData.topics?.[item] || false}
                                      onChange={(e) => setConfigFormData({
                                        ...configFormData,
                                        topics: { ...configFormData.topics, [item]: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Content Source:</p>
                              <div className="space-y-2 ml-1">
                                {['IRS', 'State Authorities'].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={configFormData.sources?.[item] || false}
                                      onChange={(e) => setConfigFormData({
                                        ...configFormData,
                                        sources: { ...configFormData.sources, [item]: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {configFormData.triggerMode === 'Jurisdiction Detection' && (
                          <>
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Jurisdictions:</p>
                              <div className="space-y-2 ml-1">
                                {['California', 'New York'].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={configFormData.jurisdictions?.[item] || false}
                                      onChange={(e) => setConfigFormData({
                                        ...configFormData,
                                        jurisdictions: { ...configFormData.jurisdictions, [item]: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Authority Sources:</p>
                              <div className="space-y-2 ml-1">
                                {['CDTFA', 'State DOR'].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={configFormData.authorities?.[item] || false}
                                      onChange={(e) => setConfigFormData({
                                        ...configFormData,
                                        authorities: { ...configFormData.authorities, [item]: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {configFormData.triggerMode === 'Cross-Reference Detection' && (
                          <>
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Primary Authority Type:</p>
                              <div className="space-y-2 ml-1">
                                {['IRS Notice'].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={configFormData.primaryAuth?.[item] || false}
                                      onChange={(e) => setConfigFormData({
                                        ...configFormData,
                                        primaryAuth: { ...configFormData.primaryAuth, [item]: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Referenced Authority Types:</p>
                              <div className="space-y-2 ml-1">
                                {['Rev. Proc.', 'IRC Section'].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={configFormData.referencedAuth?.[item] || false}
                                      onChange={(e) => setConfigFormData({
                                        ...configFormData,
                                        referencedAuth: { ...configFormData.referencedAuth, [item]: e.target.checked }
                                      })}
                                      className="rounded text-blue-600"
                                    />
                                    <span>{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : configuringModule.name === 'AI Analysis' ? (
                  <div className="space-y-6">
                    {/* Analysis Type */}
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Analysis Type:</p>
                      <select
                        value={configFormData.analysisType || 'Client Impact Analysis'}
                        onChange={(e) => setConfigFormData({ ...configFormData, analysisType: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option>Client Impact Analysis</option>
                        <option>Regulatory Change Analysis</option>
                        <option>Risk Assessment</option>
                      </select>
                    </div>


                  </div>
                ) : configuringModule.name === 'Validate' ? (
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Validation Rules</h3>

                    {/* Citation Check */}
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Citation Check:</p>
                      <label className="flex items-center gap-2 cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={configFormData.citationCheck || false}
                          onChange={(e) => setConfigFormData({ ...configFormData, citationCheck: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="text-gray-700">All conclusions must be supported by authorities</span>
                      </label>
                    </div>

                    {/* Recency Check */}
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Recency Check:</p>
                      <label className="flex items-center gap-2 cursor-pointer ml-1">
                        <input
                          type="checkbox"
                          checked={configFormData.recencyCheck || false}
                          onChange={(e) => setConfigFormData({ ...configFormData, recencyCheck: e.target.checked })}
                          className="rounded text-blue-600"
                        />
                        <span className="text-gray-700">Flag outdated or superseded guidance</span>
                      </label>
                    </div>

                    {/* Completeness Rules */}
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Completeness Rules:</p>
                      <div className="space-y-2 ml-1">
                        {['Effective date identified', 'Applicability section included'].map((item) => (
                          <label key={item} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={configFormData.completeness?.[item] || false}
                              onChange={(e) => setConfigFormData({
                                ...configFormData,
                                completeness: { ...configFormData.completeness, [item]: e.target.checked }
                              })}
                              className="rounded text-blue-600"
                            />
                            <span className="text-gray-700">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : configuringModule.name === 'Route/Assign' ? (
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-800 border-b pb-2">Assignment Logic</h3>

                    {/* Primary Reviewer */}
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Primary Reviewer:</p>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={configFormData.primaryReviewer || ''}
                        onChange={(e) => setConfigFormData({ ...configFormData, primaryReviewer: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                ) : configuringModule.name === 'Output' ? (
                  <div className="space-y-6">
                    {/* Step 1: Format & Destination */}
                    {configStep === 1 && (
                      <>
                        {/* Format */}
                        <div>
                          <p className="font-medium text-gray-700 mb-2">Format:</p>
                          <div className="space-y-2 ml-1">
                            {['PDF', 'HTML'].map((item) => (
                              <label key={item} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={configFormData.format?.[item] || false}
                                  onChange={(e) => setConfigFormData({
                                    ...configFormData,
                                    format: { ...configFormData.format, [item]: e.target.checked }
                                  })}
                                  className="rounded text-blue-600"
                                />
                                <span className="text-gray-700">{item}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Destination */}
                        <div>
                          <p className="font-medium text-gray-700 mb-2">Destination:</p>
                          <select
                            value={configFormData.destination || 'Local'}
                            onChange={(e) => setConfigFormData({ ...configFormData, destination: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="Local">Local</option>
                            <option value="Email">Email</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Step 2: Details */}
                    {configStep === 2 && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        {configFormData.destination === 'Local' ? (
                          <div>
                            <p className="font-medium text-gray-700 mb-2">Local Options:</p>
                            <label className="flex items-center gap-2 cursor-pointer ml-1">
                              <input
                                type="checkbox"
                                checked={configFormData.downloadEnabled || false}
                                onChange={(e) => setConfigFormData({ ...configFormData, downloadEnabled: e.target.checked })}
                                className="rounded text-blue-600"
                              />
                              <span className="text-gray-700">Download</span>
                            </label>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-gray-700 mb-2">Email Recipient:</p>
                            <input
                              type="email"
                              placeholder="recipient@example.com"
                              value={configFormData.emailRecipient || ''}
                              onChange={(e) => setConfigFormData({ ...configFormData, emailRecipient: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Report will be sent automatically upon completion.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No configuration options available for this module type.</p>
                  </div>
                )}
              </div>

              <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setConfiguringModule(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>

                {/* Back Button (Step 2) */}
                {(configuringModule.name === 'Trigger' || configuringModule.name === 'Output') && configStep === 2 && (
                  <button
                    onClick={() => setConfigStep(1)}
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                  >
                    Back
                  </button>
                )}

                {/* Next/Save Button */}
                {(configuringModule.name === 'Trigger' && configStep === 1) || (configuringModule.name === 'Output' && configStep === 1) ? (
                  <button
                    onClick={() => {
                      if (configuringModule.name === 'Trigger') {
                        if (configFormData.triggerMode) {
                          setConfigStep(2);
                        } else {
                          alert('Please select a trigger mode');
                        }
                      } else if (configuringModule.name === 'Output') {
                        // Default to Local if nothing selected yet
                        if (!configFormData.destination) {
                          setConfigFormData(prev => ({ ...prev, destination: 'Local' }));
                        }
                        setConfigStep(2);
                      }
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCanvasModules((prev) => prev.map((m) => m.id === configuringModule.id ? { ...m, config: configFormData } : m));
                      setConfiguringModule(null);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Save Configuration
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        isExporting && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Generating report...
          </div>
        )
      }
    </div >
  );
};

export default WorkflowOrchestrator;
