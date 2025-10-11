import React from 'react';
import { useParams } from 'react-router-dom';
import LBOModeler from '../../components/LBOModeler';
import DCFModeler from '../../components/DCFModeler';

// Mock problem data
const problemData: Record<string, any> = {
  // LBO Problems
  '1': {
    name: 'TechCorp LBO',
    difficulty: 'beginner',
    description: 'A straightforward LBO analysis of a technology company. Perfect for getting started with LBO modeling fundamentals.',
    timeLimit: 45,
    maxScore: 1000,
    type: 'lbo'
  },
  '2': {
    name: 'RetailMax Buyout',
    difficulty: 'beginner',
    description: 'Analyze the leveraged buyout of a retail chain. Focus on working capital and seasonality considerations.',
    timeLimit: 50,
    maxScore: 1000,
    type: 'lbo'
  },
  '3': {
    name: 'Manufacturing Giant',
    difficulty: 'intermediate',
    description: 'Complex manufacturing company LBO with multiple debt tranches and detailed cash flow analysis.',
    timeLimit: 60,
    maxScore: 1500,
    type: 'lbo'
  },
  '4': {
    name: 'Healthcare Services',
    difficulty: 'intermediate',
    description: 'LBO modeling for a healthcare services company with regulatory considerations and growth scenarios.',
    timeLimit: 65,
    maxScore: 1500,
    type: 'lbo'
  },
  '5': {
    name: 'Energy Conglomerate',
    difficulty: 'advanced',
    description: 'Multi-divisional energy company with complex debt structures, commodity hedging, and environmental considerations.',
    timeLimit: 90,
    maxScore: 2000,
    type: 'lbo'
  },

  // DCF Problems
  'dcf-1': {
    name: 'TechFlow SaaS DCF',
    difficulty: 'beginner',
    description: 'Value a high-growth SaaS company using DCF. Build revenue projections, calculate free cash flow, and determine enterprise value.',
    timeLimit: 40,
    maxScore: 1000,
    type: 'dcf'
  },
  'dcf-2': {
    name: 'RetailExpand DCF',
    difficulty: 'beginner',
    description: 'Value a retail chain with aggressive store expansion plans. Model store count growth, same-store sales, and working capital needs.',
    timeLimit: 45,
    maxScore: 1000,
    type: 'dcf'
  },
  'dcf-3': {
    name: 'IndustrialCo DCF',
    difficulty: 'intermediate',
    description: 'Multi-segment manufacturing company valuation. Model different growth rates per segment with detailed capex and depreciation.',
    timeLimit: 60,
    maxScore: 1500,
    type: 'dcf'
  },
  'dcf-4': {
    name: 'BioPharma Pipeline DCF',
    difficulty: 'advanced',
    description: 'Advanced DCF with probability-weighted drug pipeline, patent expiries, and R&D modeling. Risk-adjusted discount rates required.',
    timeLimit: 75,
    maxScore: 2000,
    type: 'dcf'
  },
  'dcf-5': {
    name: 'MegaCorp Conglomerate DCF',
    difficulty: 'advanced',
    description: 'Sum-of-the-parts valuation for a multi-division conglomerate. Each division requires different WACC and growth assumptions.',
    timeLimit: 90,
    maxScore: 2500,
    type: 'dcf'
  }
};

const ProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const problem = id ? problemData[id] : null;

  if (!problem) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h2>Problem Not Found</h2>
        <p>The problem you're looking for doesn't exist.</p>
      </div>
    );
  }

  // Route to appropriate modeler based on problem type
  if (problem.type === 'dcf') {
    return (
      <DCFModeler
        problemId={id!}
        problemName={problem.name}
      />
    );
  }

  // Default to LBO modeler
  return (
    <LBOModeler
      problemId={id!}
      problemName={problem.name}
    />
  );
};

export default ProblemPage;