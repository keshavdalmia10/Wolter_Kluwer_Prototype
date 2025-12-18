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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplatesLibrary, setShowTemplatesLibrary] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  const availableModules = [
    { id: 'trigger', name: 'Trigger', icon: Zap, color: 'bg-yellow-500', description: 'Start workflow' },
    { id: 'extract', name: 'Extract Data', icon: FileText, color: 'bg-blue-500', description: 'Parse documents' },
    { id: 'analyze', name: 'AI Analysis', icon: Target, color: 'bg-purple-500', description: 'Process with AI' },
    { id: 'validate', name: 'Validate', icon: CheckCircle, color: 'bg-green-500', description: 'Check rules' },
    { id: 'route', name: 'Route/Assign', icon: Users, color: 'bg-orange-500', description: 'Assign to team' },
    { id: 'output', name: 'Output', icon: Download, color: 'bg-gray-700', description: 'Generate result' },
  ];

  const workflowTemplates = [
    {
      id: 'cp2000',
      name: 'IRS CP2000 Notice Response',
      description: 'Automated workflow for parsing CP2000 notices, reconciling discrepancies, and drafting response letters',
      category: 'Tax Compliance',
      steps: 6,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'route', 'output'],
    },
    {
      id: '1099k',
      name: '1099-K Threshold Audit',
      description: 'Scan payment processor data, identify threshold breaches, and generate client outreach materials',
      category: 'Tax Compliance',
      steps: 5,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'output'],
    },
    {
      id: 'erc',
      name: 'ERC Claim Validation',
      description: 'Verify eligibility for Employee Retention Credit, calculate amounts, and prepare 941-X filings',
      category: 'Tax Compliance',
      steps: 6,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'route', 'output'],
    },
    {
      id: 'fincen',
      name: 'FinCEN BOI Filing',
      description: 'Collect ownership documents, identify beneficial owners, and prepare FinCEN beneficial ownership reports',
      category: 'Tax Compliance',
      steps: 5,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'output'],
    },
    {
      id: 'quarterly-review',
      name: 'Quarterly Tax Review',
      description: 'Automated quarterly client tax position review with recommendations',
      category: 'Client Management',
      steps: 7,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'route', 'output'],
    },
    {
      id: 'document-intake',
      name: 'Client Document Intake',
      description: 'Process and organize incoming client documents with AI classification',
      category: 'Document Processing',
      steps: 4,
      modules: ['trigger', 'extract', 'analyze', 'output'],
    },
    {
      id: 'r-and-d-credit',
      name: 'R&D Tax Credit Analysis',
      description: 'Identify eligible R&D activities and calculate available tax credits',
      category: 'Tax Compliance',
      steps: 6,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'route', 'output'],
    },
    {
      id: 'state-nexus',
      name: 'State Nexus Assessment',
      description: 'Evaluate multi-state business activities for tax nexus obligations',
      category: 'Tax Compliance',
      steps: 5,
      modules: ['trigger', 'extract', 'analyze', 'validate', 'output'],
    },
  ];

  const workflows = [
    {
      id: 1,
      name: 'IRS CP2000 Response Builder',
      description: 'Process CP2000 notices, reconcile income, draft response',
      steps: 6,
      accuracy: '96%',
      avgTime: '45 min',
      avgTimeMinutes: 45,
      trigger: 'Inbound CP2000 PDF',
      lastRun: '2 hours ago',
    },
    {
      id: 2,
      name: '1099-K Threshold Change Client Audit',
      description: 'Audit clients impacted by 1099-K threshold changes',
      steps: 5,
      accuracy: '94%',
      avgTime: '38 min',
      avgTimeMinutes: 38,
      trigger: 'Scheduled weekly',
      lastRun: '1 week ago',
    },
    {
      id: 3,
      name: 'ERC Claim Validation Workflow',
      description: 'Validate ERC eligibility and generate filings',
      steps: 6,
      accuracy: '98%',
      avgTime: '52 min',
      avgTimeMinutes: 52,
      trigger: 'Manual run',
      lastRun: 'Yesterday',
    },
    {
      id: 4,
      name: 'FinCEN Beneficial Ownership Filing',
      description: 'Collect ownership documents and prepare filings',
      steps: 5,
      accuracy: '97%',
      avgTime: '28 min',
      avgTimeMinutes: 28,
      trigger: 'Case intake',
      lastRun: '3 days ago',
    },
  ];

  const metrics = [
    { label: 'Active Workflows', value: '12', change: '+3', trend: 'up' },
    { label: 'Total Triggers', value: '87', change: '+12', trend: 'up' },
    { label: 'Completion Rate', value: '96%', change: '+2%', trend: 'up' },
    { label: 'Avg. Cycle Time', value: '42 min', change: '-8 min', trend: 'up' },
  ];

  const categories = ['All', ...new Set(workflowTemplates.map((t) => t.category))];

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
          id: 's2',
          name: 'Extract Data',
          description: 'OCR and structured extraction of notice data',
          agent: 'OCR Worker',
          detail: 'Running document intelligence and normalizing fields',
          duration: '8 min',
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
      2: [
        {
          id: 's1',
          name: 'Trigger: Weekly audit',
          description: 'Pull clients impacted by 1099-K thresholds',
          agent: 'Scheduler',
          detail: 'Fetching merchant data and thresholds',
          duration: '4 min',
        },
        {
          id: 's2',
          name: 'Extract Data',
          description: 'Ingest payment processor exports',
          agent: 'Data Intake',
          detail: 'Standardizing transaction data',
          duration: '10 min',
        },
        {
          id: 's3',
          name: 'AI Analysis',
          description: 'Detect anomalies and threshold crossings',
          agent: 'Risk Model',
          detail: 'Flagging unusual volumes and mismatches',
          duration: '12 min',
        },
        {
          id: 's4',
          name: 'Validate',
          description: 'Apply audit rules and thresholds',
          agent: 'Rules Engine',
          detail: 'Checking variance vs. prior periods',
          duration: '6 min',
        },
        {
          id: 's5',
          name: 'Output',
          description: 'Generate outreach and audit packet',
          agent: 'Export Service',
          detail: 'Drafting client outreach material',
          duration: '6 min',
        },
      ],
      3: [
        {
          id: 's1',
          name: 'Trigger: Manual run',
          description: 'Start ERC validation for selected client',
          agent: 'User Trigger',
          detail: 'Collecting inputs and prior filings',
          duration: '3 min',
        },
        {
          id: 's2',
          name: 'Extract Data',
          description: 'Parse payroll and revenue data',
          agent: 'Data Pipeline',
          detail: 'Standardizing payroll CSVs',
          duration: '11 min',
        },
        {
          id: 's3',
          name: 'AI Analysis',
          description: 'Eligibility and credit computation',
          agent: 'Credit Engine',
          detail: 'LLM explanation plus formula-based calc',
          duration: '14 min',
        },
        {
          id: 's4',
          name: 'Validate',
          description: 'Apply IRS guidance and thresholds',
          agent: 'Rules Engine',
          detail: 'Cross-checking revenue drops and shutdown periods',
          duration: '10 min',
        },
        {
          id: 's5',
          name: 'Route/Assign',
          description: 'Send to reviewer and client portal',
          agent: 'Assignment Service',
          detail: 'Notify reviewer, stage client tasks',
          duration: '7 min',
        },
        {
          id: 's6',
          name: 'Output',
          description: 'Generate 941-X and memo',
          agent: 'Export Service',
          detail: 'Export filings and research memo',
          duration: '8 min',
        },
      ],
      4: [
        {
          id: 's1',
          name: 'Trigger: Case intake',
          description: 'New BOI case created',
          agent: 'Intake Service',
          detail: 'Collecting org and owners',
          duration: '3 min',
        },
        {
          id: 's2',
          name: 'Extract Data',
          description: 'Parse identity and ownership docs',
          agent: 'Document Intelligence',
          detail: 'Scanning IDs and ownership forms',
          duration: '10 min',
        },
        {
          id: 's3',
          name: 'AI Analysis',
          description: 'BOI eligibility and gaps',
          agent: 'Compliance Model',
          detail: 'Flagging missing beneficial ownership info',
          duration: '12 min',
        },
        {
          id: 's4',
          name: 'Validate',
          description: 'Jurisdictional validation',
          agent: 'Rules Engine',
          detail: 'Applying state/FinCEN rules',
          duration: '7 min',
        },
        {
          id: 's5',
          name: 'Output',
          description: 'Generate BOI filing packet',
          agent: 'Export Service',
          detail: 'Drafting filing and summary',
          duration: '6 min',
        },
      ],
    };
    return stepsByWorkflow[workflowId] || stepsByWorkflow[1];
  };

  const filteredTemplates = workflowTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template) => {
    const spacing = 200;
    const startY = 150;
    const newModules = template.modules.map((moduleId, index) => {
      const moduleType = availableModules.find((m) => m.id === moduleId);
      return {
        ...moduleType,
        id: `${moduleId}-${Date.now()}-${index}`,
        x: 400,
        y: startY + index * spacing,
      };
    });
    setCanvasModules(newModules);
    setShowTemplateModal(false);
    setShowTemplatesLibrary(false);
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
    setDraggedModule(module);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedModule) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCanvasModules([
        ...canvasModules,
        {
          ...draggedModule,
          id: `${draggedModule.id}-${Date.now()}`,
          x,
          y,
        },
      ]);
      setDraggedModule(null);
    }
  };

  const handleCanvasModuleMouseDown = (e, moduleId) => {
    e.stopPropagation();
    const module = canvasModules.find((m) => m.id === moduleId);
    if (!module) return;
    const rect = e.currentTarget.closest('.canvas-area').getBoundingClientRect();
    setDraggingCanvasModule(moduleId);
    setDragOffset({ x: e.clientX - rect.left - module.x, y: e.clientY - rect.top - module.y });
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingCanvasModule) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
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
          <button className="text-sm hover:text-gray-200">Help</button>
          <button className="text-sm hover:text-gray-200">Settings</button>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-3 shadow-sm">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowMetrics(false);
              setShowBuilder(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              !showMetrics && !showBuilder ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              showMetrics ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      activeWorkflow?.id === workflow.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
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

            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Templates</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <div className="font-medium text-gray-700 text-sm">Energy Tax Credit Research</div>
                  <div className="text-xs text-gray-500 mt-1">Standard template</div>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <div className="font-medium text-gray-700 text-sm">Compliance Checklist Generator</div>
                  <div className="text-xs text-gray-500 mt-1">Regulatory review</div>
                </div>
              </div>
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
                style={{
                  backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                {canvasModules.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-gray-400">
                      <GitBranch size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Drag modules here to build your workflow</p>
                      <p className="text-sm">Start with a Trigger module</p>
                    </div>
                  </div>
                )}

                <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                  {connections.map((conn, idx) => {
                    const fromModule = canvasModules.find((m) => m.id === conn.from);
                    const toModule = canvasModules.find((m) => m.id === conn.to);
                    if (!fromModule || !toModule) return null;
                    const x1 = fromModule.x + 80;
                    const y1 = fromModule.y + 40;
                    const x2 = toModule.x + 80;
                    const y2 = toModule.y + 40;
                    return <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrowhead)" />;
                  })}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>

                {canvasModules.map((module) => {
                  const Icon = module.icon;
                  const isDragging = draggingCanvasModule === module.id;
                  return (
                    <div
                      key={module.id}
                      className={`absolute ${module.color} text-white rounded-lg shadow-lg group transition-shadow ${
                        isDragging ? 'cursor-grabbing shadow-2xl z-50' : 'cursor-grab'
                      }`}
                      style={{ left: `${module.x - 80}px`, top: `${module.y - 40}px`, width: '160px', height: '80px', userSelect: 'none', touchAction: 'none' }}
                      onMouseDown={(e) => handleCanvasModuleMouseDown(e, module.id)}
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
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-start gap-2 text-sm text-blue-900">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Quick Start:</strong> Drag a <strong>Trigger</strong> module to start, then add <strong>Extract Data</strong>, <strong>AI Analysis</strong>, <strong>Validate</strong>, and finish with <strong>Output</strong>. Modules will auto-connect in sequence.
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
                        className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          workflowRunning ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
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
                            className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : isCompleted
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
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
                                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                      isCompleted
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
                    { name: '1099-K Threshold Change Client Audit', time: '5 hours ago', status: 'success', duration: '38 min' },
                    { name: 'ERC Claim Validation Workflow', time: 'Yesterday', status: 'success', duration: '52 min' },
                    { name: 'FinCEN Beneficial Ownership Filing', time: '2 days ago', status: 'success', duration: '28 min' },
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
          {!showTemplatesLibrary ? (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Zap size={18} />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button onClick={() => setShowTemplateModal(true)} className="w-full text-left px-3 py-2 bg-white rounded border hover:bg-purple-50 text-sm">
                    Create from Template
                  </button>
                  <button onClick={() => setShowTemplatesLibrary(true)} className="w-full text-left px-3 py-2 bg-white rounded border hover:bg-purple-50 text-sm">
                    View All Templates
                  </button>
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
                  Use the workflow builder to chain multiple processes together. For example, connect "Document Extract" → "AI Analysis" → "Compliance Check" to create end-to-end automation that saves hours of manual review time.
                </p>
              </div>
            </>
          ) : (
            <div>
              <button
                onClick={() => {
                  setShowTemplatesLibrary(false);
                  setTemplateSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
              >
                Back to Quick Actions
              </button>

              <h3 className="text-lg font-bold text-gray-800 mb-4">Templates Library</h3>

              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
              />

              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">{template.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{template.category}</span>
                          <span className="text-xs text-gray-500">{template.steps} steps</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full mt-2 px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Choose a Workflow Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {workflowTemplates.slice(0, 4).map((template) => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded ml-3 flex-shrink-0">{template.steps} steps</span>
                  </div>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t px-6 py-4 bg-gray-50">
              <button onClick={() => setShowTemplateModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          Generating report...
        </div>
      )}
    </div>
  );
};

export default WorkflowOrchestrator;
