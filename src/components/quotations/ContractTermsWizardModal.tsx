import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, RotateCcw, FileText, ShieldCheck, Truck, DollarSign, Layers, HardHat } from 'lucide-react';

export interface ContractTermsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (compiledTerms: string) => void;
  grandTotal?: number;
  initialTerms?: string;
}

export type ContractingCategory = 'general' | 'supply' | 'fabrication_mep' | 'construction' | 'maintenance_services';

export const ContractTermsWizardModal: React.FC<ContractTermsWizardModalProps> = ({
  isOpen,
  onClose,
  onApply,
  grandTotal = 0,
  initialTerms = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<ContractingCategory>('general');

  // Step 1: Commercial & Payment Milestones
  const [enablePayment, setEnablePayment] = useState(true);
  const [paymentModel, setPaymentModel] = useState<'advance_progress_handover' | 'milestone_50_50' | 'net_30' | 'net_14' | 'advance_100' | 'custom'>('advance_progress_handover');
  const [paymentWindowDays, setPaymentWindowDays] = useState(14);
  const [paymentMethod, setPaymentMethod] = useState('Direct bank transfer against approved invoice/progress certificate');
  const [retentionPercentage, setRetentionPercentage] = useState(0); // e.g. 5% or 10% for construction
  const [taxTreatment, setTaxTreatment] = useState<'vat_15' | 'vat_exempt_0' | 'vat_inclusive'>('vat_15');
  const [customMilestoneText, setCustomMilestoneText] = useState(
    '• Advance Payment (30%): Due upon contract signing / mobilization.\n• Progress Claims (50%): Monthly valuations based on certified work completed.\n• Final Handover (20%): Due upon completion of snagging and commercial handover.'
  );

  // Step 2: Scope of Work, Inclusions & Exclusions
  const [enableScope, setEnableScope] = useState(true);
  const [scopeDefinition, setScopeDefinition] = useState('Supply, fabrication, transport, and site execution strictly as per itemized BOQ specifications and approved drawings.');
  const [enableExclusions, setEnableExclusions] = useState(true);
  const [exclusionsText, setExclusionsText] = useState('Unless explicitly itemized, scope excludes: municipal/authority permit fees, structural foundations/civil works, main electrical feeds, and crane offloading.');
  const [enableVariations, setEnableVariations] = useState(true);
  const [variationText, setVariationText] = useState('Any additional works, deviations, or client-requested changes shall be formally agreed via written Variation Order (VO) with cost and time impact approved prior to execution.');

  // Step 3: Execution Schedule, Site Readiness & Handover
  const [enableDelivery, setEnableDelivery] = useState(true);
  const [executionTimeline, setExecutionTimeline] = useState('Within 4 to 6 weeks from receipt of approved Purchase Order and Advance Payment.');
  const [clientObligations, setClientObligations] = useState('Client shall ensure unhindered site access, clear work front, necessary site permits, and free supply of water and power during installation/execution.');
  const [handoverInspectionDays, setHandoverInspectionDays] = useState(7);
  const [handoverNotes, setHandoverNotes] = useState('Upon substantial completion, joint inspection shall be conducted. Minor snag items shall not impede commercial handover or milestone settlement.');

  // Step 4: Quality Standards, Materials & Defect Liability (Warranty)
  const [enableWarranty, setEnableWarranty] = useState(true);
  const [materialCompliance, setMaterialCompliance] = useState('All materials supplied and fabricated shall comply with Saudi standard specifications (SASO / ASTM) and project submittal approvals.');
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [warrantyScope, setWarrantyScope] = useState('Defect Liability Period (DLP) covering repair or replacement of defective workmanship and material defects resulting from normal operating conditions.');
  const [responseHours, setResponseHours] = useState('Emergency rectification response within 24 hours; non-critical snag rectifications within 3 business days.');

  // Step 5: Contract Validity, Force Majeure & Governance
  const [enableLegal, setEnableLegal] = useState(true);
  const [quoteValidityDays, setQuoteValidityDays] = useState(30);
  const [governingLaw, setGoverningLaw] = useState('Kingdom of Saudi Arabia (Commercial Courts Jurisdiction)');
  const [forceMajeure, setForceMajeure] = useState(true);
  const [includeSignatureBlock, setIncludeSignatureBlock] = useState(true);

  // Step 6: Review & Final Live Editor
  const [finalCompiledText, setFinalCompiledText] = useState('');

  if (!isOpen) return null;

  // Compile clauses into professional contracting format
  const generateCompiledText = (): string => {
    const sections: string[] = [];
    let sectionNum = 1;

    // 1. Commercial Terms & Payment Schedule
    if (enablePayment) {
      const paymentLines: string[] = [];
      const totalFormatted = grandTotal > 0 ? ` (${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900)` : '';

      if (paymentModel === 'advance_progress_handover') {
        const pAdvance = grandTotal > 0 ? `${(grandTotal * 0.4).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900` : '40%';
        const pProgress = grandTotal > 0 ? `${(grandTotal * 0.4).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900` : '40%';
        const pFinal = grandTotal > 0 ? `${(grandTotal * 0.2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900` : '20%';
        paymentLines.push(`• Advance Mobilization (40%): ${pAdvance} due upon contract award / approved Purchase Order.`);
        paymentLines.push(`• Delivery / Installation Progress (40%): ${pProgress} upon physical material delivery and progress completion.`);
        paymentLines.push(`• Final Handover (20%): ${pFinal} upon final site inspection and commercial handover.`);
      } else if (paymentModel === 'milestone_50_50') {
        const split = grandTotal > 0 ? `${(grandTotal * 0.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} \uE900` : '50%';
        paymentLines.push(`• Advance Milestone (50%): ${split} due upon contract signing and procurement commencement.`);
        paymentLines.push(`• Handover Milestone (50%): ${split} due upon final delivery, installation & joint inspection.`);
      } else if (paymentModel === 'net_30' || paymentModel === 'net_14') {
        paymentLines.push(`• Credit Settlement Terms: Net ${paymentModel === 'net_30' ? '30' : '14'} calendar days from date of official corporate tax invoice and delivery note.`);
      } else if (paymentModel === 'advance_100') {
        paymentLines.push('• Advance Settlement: 100% full payment upon issuance of proforma invoice prior to mobilization / dispatch.');
      } else if (customMilestoneText.trim()) {
        paymentLines.push(customMilestoneText.trim());
      }

      if (retentionPercentage > 0) {
        paymentLines.push(`• Retention: ${retentionPercentage}% retention to be held and released at the conclusion of the Defect Liability Period.`);
      }

      paymentLines.push(`• Terms of Payment: ${paymentMethod} within ${paymentWindowDays} calendar days.`);

      if (taxTreatment === 'vat_15') {
        paymentLines.push('• Tax Treatment: Subject to 15% standard Value Added Tax (VAT) in accordance with ZATCA regulations.');
      } else if (taxTreatment === 'vat_exempt_0') {
        paymentLines.push('• Tax Treatment: 0% Tax Exempt / Reverse Charge mechanism applies as per contractual scope.');
      } else {
        paymentLines.push('• Tax Treatment: Quoted prices are inclusive of applicable Value Added Tax (VAT).');
      }

      sections.push(`${sectionNum}. Commercial Milestones & Payment Terms${totalFormatted}\n${paymentLines.join('\n')}`);
      sectionNum++;
    }

    // 2. Scope of Work, Inclusions & Exclusions
    if (enableScope) {
      const scopeLines: string[] = [];
      if (scopeDefinition.trim()) scopeLines.push(`• Scope of Works: ${scopeDefinition.trim()}`);
      if (enableExclusions && exclusionsText.trim()) scopeLines.push(`• Exclusions: ${exclusionsText.trim()}`);
      if (enableVariations && variationText.trim()) scopeLines.push(`• Variations & Changes: ${variationText.trim()}`);

      if (scopeLines.length > 0) {
        sections.push(`${sectionNum}. Scope of Work & Contract Boundaries\n${scopeLines.join('\n')}`);
        sectionNum++;
      }
    }

    // 3. Execution Timeline, Site Conditions & Handover
    if (enableDelivery) {
      const deliveryLines: string[] = [];
      if (executionTimeline.trim()) deliveryLines.push(`• Project Schedule: ${executionTimeline.trim()}`);
      if (clientObligations.trim()) deliveryLines.push(`• Site Conditions & Client Readiness: ${clientObligations.trim()}`);
      if (handoverInspectionDays > 0) deliveryLines.push(`• Handover & Snagging Inspection: Joint inspection shall take place within ${handoverInspectionDays} working days of completion notification.`);
      if (handoverNotes.trim()) deliveryLines.push(`• Acceptance Protocol: ${handoverNotes.trim()}`);

      if (deliveryLines.length > 0) {
        sections.push(`${sectionNum}. Execution Timeline & Site Readiness\n${deliveryLines.join('\n')}`);
        sectionNum++;
      }
    }

    // 4. Quality Standards, Materials & Warranty (DLP)
    if (enableWarranty) {
      const warrantyLines: string[] = [];
      if (materialCompliance.trim()) warrantyLines.push(`• Material & Workmanship Standards: ${materialCompliance.trim()}`);
      if (warrantyMonths > 0) warrantyLines.push(`• Defect Liability Period (DLP): ${warrantyMonths} months warranty from official handover against defective materials or workmanship.`);
      if (warrantyScope.trim()) warrantyLines.push(`• Warranty Coverage: ${warrantyScope.trim()}`);
      if (responseHours.trim()) warrantyLines.push(`• Rectification Response: ${responseHours.trim()}`);

      if (warrantyLines.length > 0) {
        sections.push(`${sectionNum}. Quality Standards & Defect Liability Guarantee\n${warrantyLines.join('\n')}`);
        sectionNum++;
      }
    }

    // 5. Contract Validity & Legal Governance
    if (enableLegal) {
      const legalLines: string[] = [];
      if (quoteValidityDays > 0) legalLines.push(`• Quotation Validity: Prices remain valid for ${quoteValidityDays} calendar days from quotation date due to market material price fluctuations.`);
      if (forceMajeure) legalLines.push('• Force Majeure: Neither party shall be liable for project delays caused by events beyond reasonable control, including extreme weather, regulatory restrictions, or site access embargoes.');
      if (governingLaw.trim()) legalLines.push(`• Governing Law & Jurisdiction: Governed by the statutory regulations and commercial jurisdiction of the ${governingLaw.trim()}.`);

      if (legalLines.length > 0) {
        sections.push(`${sectionNum}. General Contract Governance & Validity\n${legalLines.join('\n')}`);
        sectionNum++;
      }
    }

    // 6. Signature Execution
    if (includeSignatureBlock) {
      sections.push(`${sectionNum}. Mutual Acceptance & Execution\nBy signing below or issuing an official Purchase Order / Contract Agreement, both parties accept the itemized scope of work, technical specifications, commercial schedule, and contractual conditions outlined in this proposal.`);
    }

    return sections.join('\n\n');
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5) {
      setFinalCompiledText(generateCompiledText());
      setCurrentStep(6);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleApply = () => {
    const textToApply = currentStep === 6 ? finalCompiledText : generateCompiledText();
    onApply(textToApply);
    onClose();
  };

  // Quick Preset Handlers tailored to Contracting & Supply Archetypes
  const loadPreset = (category: ContractingCategory) => {
    setSelectedCategory(category);
    if (category === 'general') {
      // General Contracting Default
      setEnablePayment(true);
      setPaymentModel('advance_progress_handover');
      setPaymentWindowDays(14);
      setRetentionPercentage(0);
      setTaxTreatment('vat_15');
      setScopeDefinition('Supply, fabrication, transport, and site execution strictly as per itemized BOQ specifications and approved drawings.');
      setEnableExclusions(true);
      setExclusionsText('Unless explicitly itemized, scope excludes: municipal/authority permit fees, structural foundations/civil works, main electrical feeds, and crane offloading.');
      setExecutionTimeline('Within 4 to 6 weeks from receipt of approved Purchase Order and Advance Payment.');
      setClientObligations('Client shall ensure unhindered site access, clear work front, necessary site permits, and free supply of water and power during installation/execution.');
      setWarrantyMonths(12);
      setWarrantyScope('Defect Liability Period (DLP) covering repair or replacement of defective workmanship and material defects resulting from normal operating conditions.');
      setQuoteValidityDays(30);
    } else if (category === 'supply') {
      // Material Supply Only (Trading & Wholesale)
      setEnablePayment(true);
      setPaymentModel('net_30');
      setPaymentWindowDays(30);
      setRetentionPercentage(0);
      setTaxTreatment('vat_15');
      setScopeDefinition('Supply and delivery of materials strictly as per approved technical submittal and itemized quantities in this quotation.');
      setEnableExclusions(true);
      setExclusionsText('Scope covers supply only. Excludes site offloading, hoisting, civil works, installation, and post-delivery storage protection.');
      setExecutionTimeline('Delivery within 7 to 10 working days from receipt of approved Purchase Order.');
      setClientObligations('Client is responsible for immediate offloading upon vehicle arrival at designated project delivery location.');
      setWarrantyMonths(12);
      setWarrantyScope('Standard manufacturer warranty against material defects. Damaged goods must be notified in writing within 48 hours of delivery.');
      setQuoteValidityDays(15);
    } else if (category === 'fabrication_mep') {
      // Steel Fabrication / Sheds / MEP Works
      setEnablePayment(true);
      setPaymentModel('milestone_50_50');
      setPaymentWindowDays(14);
      setRetentionPercentage(5);
      setTaxTreatment('vat_15');
      setScopeDefinition('Complete fabrication, primer coating, painting/galvanizing, transport, and erection of structural works as per approved shop drawings.');
      setEnableExclusions(true);
      setExclusionsText('Civil foundation bolts embedding, third-party laboratory testing fees, and external crane rentals for overhead lifts exceeding 20m.');
      setExecutionTimeline('Fabrication: 3 weeks upon shop drawing approval. Site Erection: 2 weeks from foundation handover.');
      setClientObligations('Client shall provide certified leveled concrete foundation with embedment anchor bolts ready for structural handover.');
      setWarrantyMonths(12);
      setWarrantyScope('Comprehensive structural defect liability period covering welds, structural alignments, and paint coating integrity.');
      setQuoteValidityDays(21);
    } else if (category === 'construction') {
      // Turnkey Construction & Civil Works
      setEnablePayment(true);
      setPaymentModel('custom');
      setCustomMilestoneText(
        '• Mobilization Advance (20%): Due upon contract signing & site possession handover.\n• Interim Monthly Progress Valuations (70%): Billed monthly against certified work in place.\n• Substantial Completion & Snagging (5%): Due upon issuance of Practical Completion Certificate.\n• Retention Release (5%): Released after 12 months DLP inspection.'
      );
      setPaymentWindowDays(30);
      setRetentionPercentage(5);
      setTaxTreatment('vat_15');
      setScopeDefinition('Execution of civil, finishing, and MEP works in strict compliance with contract specifications, approved BOQ, and consultant supervision.');
      setEnableExclusions(true);
      setExclusionsText('Statutory municipal connection charges, utility meters, and permanent electrical/water connection costs.');
      setExecutionTimeline('As per mutually agreed Master Baseline Construction Schedule.');
      setClientObligations('Client / Consultant shall review and approve progress applications, inspection requests (RFI), and material submittals within 5 business days.');
      setWarrantyMonths(12);
      setWarrantyScope('12-Month Defect Liability Period (DLP) covering latent defects in building works and installed MEP systems.');
      setQuoteValidityDays(30);
    } else if (category === 'maintenance_services') {
      // Facility Maintenance, Manpower & Equipment Rental
      setEnablePayment(true);
      setPaymentModel('net_30');
      setPaymentWindowDays(30);
      setRetentionPercentage(0);
      setTaxTreatment('vat_15');
      setScopeDefinition('Provision of scheduled preventive maintenance, emergency repair callouts, and certified technical manpower / equipment operations.');
      setEnableExclusions(true);
      setExclusionsText('Consumable spares, fuel supply (unless specified wet-rate), and major capital overhaul components.');
      setExecutionTimeline('Immediate mobilization within 48 hours of approved Work Order / LPO issuance.');
      setClientObligations('Client shall authorize site gate passes, safety inductions, and provide secure storage for tools/machinery.');
      setWarrantyMonths(3);
      setWarrantyScope('Warranty on workmanship for repaired assemblies for a period of 90 days from service sign-off.');
      setQuoteValidityDays(30);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '880px', maxHeight: '92vh', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardHat style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.3px' }}>Contract Terms & Conditions Wizard</h3>
              <p style={{ fontSize: '13px', margin: '2px 0 0 0', opacity: 0.85 }}>General contracting terms, milestone schedules, scope boundaries & defect liabilities</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
            <X style={{ width: '22px', height: '22px' }} />
          </button>
        </div>

        {/* Contract Archetype / Trade Presets Bar */}
        <div style={{ padding: '10px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles style={{ width: '14px', height: '14px', color: '#d97706' }} /> Contract Type Presets:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'general', label: 'General Contracting' },
              { id: 'supply', label: 'Material Supply Only' },
              { id: 'fabrication_mep', label: 'Fabrication / Steel / MEP' },
              { id: 'construction', label: 'Civil / Turnkey Construction' },
              { id: 'maintenance_services', label: 'Maintenance & Rental' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => loadPreset(cat.id as ContractingCategory)}
                style={{
                  background: selectedCategory === cat.id ? '#0f172a' : '#ffffff',
                  color: selectedCategory === cat.id ? '#ffffff' : '#334155',
                  border: `1px solid ${selectedCategory === cat.id ? '#0f172a' : '#cbd5e1'}`,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '11.5px',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div style={{ padding: '10px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', overflowX: 'auto' }}>
          {[
            { step: 1, label: 'Payment & Milestones', icon: DollarSign },
            { step: 2, label: 'Scope & Exclusions', icon: Layers },
            { step: 3, label: 'Schedule & Handover', icon: Truck },
            { step: 4, label: 'Quality & Defect Liability', icon: ShieldCheck },
            { step: 5, label: 'Governance & Validity', icon: FileText },
            { step: 6, label: 'Review & Live Edit', icon: CheckCircle2 }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step === 6) setFinalCompiledText(generateCompiledText());
                  setCurrentStep(item.step);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#0f172a' : isCompleted ? '#e0f2fe' : 'transparent',
                  color: isActive ? '#ffffff' : isCompleted ? '#0369a1' : '#64748b',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon style={{ width: '14px', height: '14px' }} />
                <span>{item.step}. {item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          
          {/* STEP 1: Commercial & Payment */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Section 1: Commercial Milestones, Credit Terms & VAT</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Establish progress payment milestones, retention terms, and ZATCA tax handling.</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  <input type="checkbox" checked={enablePayment} onChange={e => setEnablePayment(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Include in Quotation
                </label>
              </div>

              {enablePayment && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>Payment Milestone Model:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {[
                        { id: 'advance_progress_handover', label: '40% Advance / 40% Progress / 20% Handover', desc: 'Standard contracting progress split' },
                        { id: 'milestone_50_50', label: '50% Advance / 50% Handover', desc: 'Fabrication & supply milestone' },
                        { id: 'net_30', label: 'Net 30 Calendar Days', desc: 'Standard commercial invoice credit' },
                        { id: 'net_14', label: 'Net 14 Calendar Days', desc: 'Direct corporate invoice turnaround' },
                        { id: 'advance_100', label: '100% Upfront Advance', desc: 'Full payment prior to supply/dispatch' },
                        { id: 'custom', label: 'Custom Milestone Valuation', desc: 'Custom construction progress schedule' }
                      ].map(m => (
                        <div
                          key={m.id}
                          onClick={() => setPaymentModel(m.id as any)}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: `2px solid ${paymentModel === m.id ? '#0f172a' : '#e2e8f0'}`,
                            background: paymentModel === m.id ? '#f8fafc' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '12.5px', color: paymentModel === m.id ? '#0f172a' : '#1e293b' }}>{m.label}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>{m.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {paymentModel === 'custom' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Custom Milestone Text:</label>
                      <textarea
                        value={customMilestoneText}
                        onChange={e => setCustomMilestoneText(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Settlement Window (Days):</label>
                      <input
                        type="number"
                        min="1"
                        value={paymentWindowDays}
                        onChange={e => setPaymentWindowDays(Number(e.target.value) || 14)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Retention Holding (%):</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={retentionPercentage}
                        onChange={e => setRetentionPercentage(Number(e.target.value) || 0)}
                        placeholder="0% (or 5% DLP hold)"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Payment Method:</label>
                      <input
                        type="text"
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>VAT Statutory Treatment:</label>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="vat" checked={taxTreatment === 'vat_15'} onChange={() => setTaxTreatment('vat_15')} />
                        Standard 15% VAT (ZATCA Tax Invoice)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="vat" checked={taxTreatment === 'vat_exempt_0'} onChange={() => setTaxTreatment('vat_exempt_0')} />
                        0% Tax Exempt / Reverse Charge
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="vat" checked={taxTreatment === 'vat_inclusive'} onChange={() => setTaxTreatment('vat_inclusive')} />
                        Quoted Price Inclusive of VAT
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: Scope & Exclusions */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Section 2: Scope of Work, Technical Boundaries & Exclusions</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Prevent scope creep by explicitly recording inclusions, exclusions, and variation order protocols.</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  <input type="checkbox" checked={enableScope} onChange={e => setEnableScope(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Include in Quotation
                </label>
              </div>

              {enableScope && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Scope of Work Definition:</label>
                    <textarea
                      value={scopeDefinition}
                      onChange={e => setScopeDefinition(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#1e293b', marginBottom: '6px' }}>
                      <input type="checkbox" checked={enableExclusions} onChange={e => setEnableExclusions(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      Explicit Contract Exclusions (Protects Against Scope Creep)
                    </label>
                    {enableExclusions && (
                      <textarea
                        value={exclusionsText}
                        onChange={e => setExclusionsText(e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                      />
                    )}
                  </div>

                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#1e293b', marginBottom: '6px' }}>
                      <input type="checkbox" checked={enableVariations} onChange={e => setEnableVariations(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      Variation & Change Order Procedure (Client Written Authorization Required)
                    </label>
                    {enableVariations && (
                      <textarea
                        value={variationText}
                        onChange={e => setVariationText(e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', background: '#ffffff' }}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: Execution Timeline & Site Readiness */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Section 3: Execution Timeline, Site Readiness & Handover</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Establish delivery timeframes, client site prerequisites, and snagging handover procedures.</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  <input type="checkbox" checked={enableDelivery} onChange={e => setEnableDelivery(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Include in Quotation
                </label>
              </div>

              {enableDelivery && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Project Execution / Delivery Schedule:</label>
                    <input
                      type="text"
                      value={executionTimeline}
                      onChange={e => setExecutionTimeline(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Site Readiness & Client Obligations (Access, Power, Water):</label>
                    <textarea
                      value={clientObligations}
                      onChange={e => setClientObligations(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Inspection Window (Days):</label>
                      <input
                        type="number"
                        min="1"
                        value={handoverInspectionDays}
                        onChange={e => setHandoverInspectionDays(Number(e.target.value) || 7)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Snagging & Commercial Handover Protocol:</label>
                      <input
                        type="text"
                        value={handoverNotes}
                        onChange={e => setHandoverNotes(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Quality & Defect Liability (DLP) */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Section 4: Quality Standards, Materials & Defect Liability Period (DLP)</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Define SASO/ASTM specifications, warranty period, and rectification SLA.</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  <input type="checkbox" checked={enableWarranty} onChange={e => setEnableWarranty(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Include in Quotation
                </label>
              </div>

              {enableWarranty && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Material Standards & Specifications (SASO / Project Approvals):</label>
                    <textarea
                      value={materialCompliance}
                      onChange={e => setMaterialCompliance(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Defect Liability Period (Months):</label>
                      <input
                        type="number"
                        min="0"
                        value={warrantyMonths}
                        onChange={e => setWarrantyMonths(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Defect Rectification Response SLA:</label>
                      <input
                        type="text"
                        value={responseHours}
                        onChange={e => setResponseHours(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Defect Liability Guarantee Scope:</label>
                    <textarea
                      value={warrantyScope}
                      onChange={e => setWarrantyScope(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 5: Governance & Validity */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Section 5: Contract Validity, Force Majeure & Governing Law</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Establish price quotation validity, force majeure protection, and Saudi commercial jurisdiction.</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  <input type="checkbox" checked={enableLegal} onChange={e => setEnableLegal(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Include in Quotation
                </label>
              </div>

              {enableLegal && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Quotation Price Validity (Days):</label>
                      <input
                        type="number"
                        min="1"
                        value={quoteValidityDays}
                        onChange={e => setQuoteValidityDays(Number(e.target.value) || 30)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Governing Law / Jurisdiction:</label>
                      <input
                        type="text"
                        value={governingLaw}
                        onChange={e => setGoverningLaw(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                      <input type="checkbox" checked={forceMajeure} onChange={e => setForceMajeure(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      Include Force Majeure Clause (Protects against unforeseen site embargos / extreme weather)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                      <input type="checkbox" checked={includeSignatureBlock} onChange={e => setIncludeSignatureBlock(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                      Include Formal Mutual Acceptance & Dual Signature Execution Clause
                    </label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 6: Review & Final Live Editor */}
          {currentStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Step 6: Review & Direct Live Editor</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>The text below will be inserted into the quotation. You can freely edit or fine-tune any words right now.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFinalCompiledText(generateCompiledText())}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  <RotateCcw style={{ width: '13px', height: '13px' }} /> Reset to Wizard Draft
                </button>
              </div>

              <textarea
                value={finalCompiledText}
                onChange={e => setFinalCompiledText(e.target.value)}
                rows={15}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '2px solid #0f172a',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  color: '#0f172a'
                }}
              />
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} /> Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', background: 'transparent', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Next Section <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
              >
                <CheckCircle2 style={{ width: '16px', height: '16px' }} /> Apply Contract Terms
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
