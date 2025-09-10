import React from 'react';
import { useParams } from 'react-router-dom';
import LBOModeler from '../../components/LBOModeler';

// Mock problem data
const problemData: Record<string, any> = {
  '1': {
    name: 'TechCorp LBO',
    difficulty: 'beginner',
    description: 'A straightforward LBO analysis of a technology company. Perfect for getting started with LBO modeling fundamentals.',
    timeLimit: 45,
    maxScore: 1000
  },
  '2': {
    name: 'RetailMax Buyout',
    difficulty: 'beginner', 
    description: 'Analyze the leveraged buyout of a retail chain. Focus on working capital and seasonality considerations.',
    timeLimit: 50,
    maxScore: 1000
  },
  '3': {
    name: 'Manufacturing Giant',
    difficulty: 'intermediate',
    description: 'Complex manufacturing company LBO with multiple debt tranches and detailed cash flow analysis.',
    timeLimit: 60,
    maxScore: 1500
  },
  '4': {
    name: 'Healthcare Services',
    difficulty: 'intermediate',
    description: 'LBO modeling for a healthcare services company with regulatory considerations and growth scenarios.',
    timeLimit: 65,
    maxScore: 1500
  },
  '5': {
    name: 'Energy Conglomerate',
    difficulty: 'advanced',
    description: 'Multi-divisional energy company with complex debt structures, commodity hedging, and environmental considerations.',
    timeLimit: 90,
    maxScore: 2000
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

  return (
    <LBOModeler 
      problemId={id!} 
      problemName={problem.name}
    />
  );
};

export default ProblemPage;