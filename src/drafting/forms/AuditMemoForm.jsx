import React from 'react';
import { ArrowLeft, Save, FileText } from 'lucide-react';

const AuditMemoForm = ({ onBack }) => {
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <FileText className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Audit File Memo</h1>
                            <p className="text-sm text-gray-500">Document audit findings</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                        Save Draft
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2">
                        <Save size={18} />
                        Create Audit Memo
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Audit Details</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Audit Control Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    placeholder="e.g. AUD-2024-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Auditor Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                    placeholder="Name of IRS/State Agent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Exam Issues</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Issues Under Exam</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" />
                                    <span className="text-gray-700">Unreported Income</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" />
                                    <span className="text-gray-700">Disallowed Deductions</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" />
                                    <span className="text-gray-700">Worker Classification</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded text-purple-600 focus:ring-purple-500" />
                                    <span className="text-gray-700">Other</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes & Findings</label>
                            <textarea
                                className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                                placeholder="Internal notes regarding the audit position..."
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 text-sm text-purple-800">
                        <strong>Note:</strong> Internal audit memos are privileged. Verify privilege logs before sharing.
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuditMemoForm;
