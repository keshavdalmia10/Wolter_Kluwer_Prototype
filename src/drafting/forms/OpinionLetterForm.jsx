import React from 'react';
import { ArrowLeft, Save, FileText } from 'lucide-react';

const OpinionLetterForm = ({ onBack }) => {
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
                        <div className="bg-green-100 p-2 rounded-lg">
                            <FileText className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Tax Opinion Letter</h1>
                            <p className="text-sm text-gray-500">Provide formal tax advice</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                        Save Draft
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
                        <Save size={18} />
                        Create Letter
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Recipient Information</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Addressee Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="e.g. John Doe, CFO"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Entity</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="e.g. Doe Enterprises LLC"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Opinion Scope</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Matter</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                placeholder="e.g. Tax Treatment of Merger Acquisition Costs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion Level</label>
                            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white">
                                <option>More Likely Than Not (&gt;50%)</option>
                                <option>Substantial Authority (~40%)</option>
                                <option>Reasonable Basis (~20%)</option>
                                <option>Should / Will (High Confidence)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-sm text-green-800">
                        <strong>Note:</strong> This template helps structure formal tax opinions. Ensure all circular 230 requirements are met.
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OpinionLetterForm;
