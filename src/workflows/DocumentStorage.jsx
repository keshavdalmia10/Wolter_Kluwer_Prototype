import React from 'react';
import { FileText, Calendar, HardDrive } from 'lucide-react';

export const MOCK_DATABASE = [
    {
        id: 'doc_1099k_001',
        filename: 'Client_1099K_Dispute_Summary.pdf',
        uploadDate: '2024-03-15T10:30:00Z',
        description: `This document contains a comprehensive analysis of the client's 1099-K reporting discrepancies for the 2023 tax year. It outlines the specific transaction thresholds that triggered the reporting requirements and identifies several non-taxable personal reimbursements that were incorrectly categorized as business income. The client engaged in numerous peer-to-peer transactions that, while aggregated by the third-party settlement organization, do not constitute reportable gross receipts for trade or business purposes.\n\nThe conflict arises primarily from the commingling of personal and business accounts on the platform, leading to an inflated 1099-K figure that does not align with the client's actual books and records. The analysis details a reconciliation process to segregate these amounts, supported by bank statements and transaction logs. This step is crucial to prevent an automated underreporter notice (CP2000) from the IRS.\n\nThe summary concludes with a proposed dispute strategy, citing recent IRS guidance on third-party settlement organizations and the specific instructions for Schedule C. It recommends gathering supplementary affidavits from the non-business counterparties to substantiate the personal nature of the flagged transactions and submitting a detailed explanation statement with the tax return to proactively address the mismatch.`
    },
    {
        id: 'doc_section48_002',
        filename: 'Energy_Credit_Section48_Memo.docx',
        uploadDate: '2024-04-02T14:15:00Z',
        description: `A detailed memorandum assessing the client's eligibility for the Investment Tax Credit (ITC) under IRC Section 48 regarding their recent solar energy project installation. The memo evaluates the specific energy property components, including solar panels and energy storage technology, against the statutory requirements for qualified energy property. It specifically addresses the "beginning of construction" requirement and confirms that the project meets the physical work test before the applicable deadline.\n\nThe document further analyzes the calculation of the credit basis, excluding costs related to transmission and distribution that do not qualify as energy property. It breaks down the eligible basis into separate categories for the solar generation equipment and the energy storage property, as the latter has distinct requirements under the Inflation Reduction Act modifications. This segmentation ensures that the credit is maximized while maintaining compliance with the strict definition of qualified property.\n\nFinally, the memo discusses the impact of prevailing wage and apprenticeship requirements on the credit percentage. It notes that while the project began construction after January 29, 2023, the client has obtained necessary certifications from contractors regarding wage rates and apprentice labor hours. Failure to meet these requirements would result in a significant reduction of the credit rate from 30% to 6%, so the memo strongly advises maintaining a robust compliance file to support the enhanced credit claim.`
    },
    {
        id: 'doc_section48_003',
        filename: 'Section48_Credit_Transferability_Report.pdf',
        uploadDate: '2024-05-10T09:00:00Z',
        description: `This report explores the feasibility of transferring Investment Tax Credits (ITC) under the new Section 6418 provisions introduced by the Inflation Reduction Act. The client, having insufficient tax liability to fully utilize the generated credits from their renewable energy project, is considering selling the credits to an unrelated third party for cash. The report outlines the procedural requirements for making a valid transfer election, including the mandatory pre-filing registration with the IRS.\n\nA significant portion of the report is dedicated to due diligence requirements for potential buyers. It emphasizes that the transferee (buyer) bears the risk of recapture if the energy property ceases to be investment credit property or if there is a change in ownership. Therefore, the report recommends structuring the transfer agreement with comprehensive indemnification clauses and obtaining insurance to protect against recapture events that could invalidate the purchased credits.\n\nThe analysis also covers the tax treatment of the transfer proceeds. It clarifies that the cash received by the transferor is generally tax-exempt, while the payment made by the transferee is not deductible. The report concludes with a timeline for the transfer process, highlighting specific deadlines for the election statement and the need to file the transfer forms with both the transferor's and transferee's tax returns to finalize the transaction.`
    }
];

const DocumentStorage = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <HardDrive size={20} className="text-blue-600" />
                    Document Storage
                </h3>
                <span className="text-sm text-gray-500">{MOCK_DATABASE.length} documents</span>
            </div>

            <div className="divide-y divide-gray-100">
                {MOCK_DATABASE.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 border-none bg-transparent p-0 m-0">
                                {doc.filename}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{doc.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                </span>
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                                    ID: {doc.id}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentStorage;
