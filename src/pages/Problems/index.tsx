import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import Header from "../../components/shared/Header";

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.background};
`;

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h2`
  font-size: 32px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  text-align: center;
  margin-bottom: 2rem;
  animation: ${fadeInUp} 0.8s ease-out 0.2s backwards;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
  animation: ${fadeInUp} 0.8s ease-out 0.4s backwards;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background-color: ${(props) =>
    props.$active ? theme.colors.buttonPrimary : theme.colors.white};
  color: ${(props) =>
    props.$active ? theme.colors.white : theme.colors.primary};
  border: 2px solid ${theme.colors.buttonPrimary};
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonPrimary};
    color: ${theme.colors.white};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }
`;

const ProblemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ProblemCard = styled.div<{ delay?: number }>`
  background: ${theme.colors.white};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(65, 83, 120, 0.1);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.8s ease-out ${(props) => (props.delay || 0) * 0.1}s
    backwards;
  cursor: pointer;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(65, 83, 120, 0.15);
  }
`;

const ProblemHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const ProblemTitle = styled.h3`
  font-size: 20px;
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.header};
  margin-bottom: 0.5rem;
  flex: 1;
`;

const DifficultyBadge = styled.span<{ level: string }>`
  background-color: ${(props) => {
    switch (props.level) {
      case "beginner":
        return "#22c55e";
      case "intermediate":
        return "#f59e0b";
      case "advanced":
        return "#ef4444";
      default:
        return theme.colors.primary;
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ProblemDescription = styled.p`
  color: ${theme.colors.text};
  opacity: 0.8;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ProblemMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(65, 83, 120, 0.1);
`;

const MetaItem = styled.span`
  font-size: 14px;
  color: ${theme.colors.text};
  opacity: 0.7;
`;

const StartButton = styled.button`
  padding: 10px 20px;
  background-color: ${theme.colors.buttonPrimary};
  color: ${theme.colors.white};
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(65, 83, 120, 0.3);
  }
`;

interface Problem {
  id: string;
  name: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  description: string;
  timeLimit: number;
  maxScore: number;
  type: "lbo" | "dcf";
}

// Mock data for now - we'll connect to real data later
const mockProblems: Problem[] = [
  // LBO Problems
  {
    id: "1",
    name: "TechCorp LBO",
    difficulty: "beginner",
    description:
      "A straightforward LBO analysis of a technology company. Perfect for getting started with LBO modeling fundamentals.",
    timeLimit: 45,
    maxScore: 1000,
    type: "lbo",
  },
  {
    id: "2",
    name: "RetailMax Buyout",
    difficulty: "beginner",
    description:
      "Analyze the leveraged buyout of a retail chain. Focus on working capital and seasonality considerations.",
    timeLimit: 50,
    maxScore: 1000,
    type: "lbo",
  },
  {
    id: "3",
    name: "Manufacturing Giant",
    difficulty: "intermediate",
    description:
      "Complex manufacturing company LBO with multiple debt tranches and detailed cash flow analysis.",
    timeLimit: 60,
    maxScore: 1500,
    type: "lbo",
  },
  {
    id: "4",
    name: "Healthcare Services",
    difficulty: "intermediate",
    description:
      "LBO modeling for a healthcare services company with regulatory considerations and growth scenarios.",
    timeLimit: 65,
    maxScore: 1500,
    type: "lbo",
  },
  {
    id: "5",
    name: "Energy Conglomerate",
    difficulty: "advanced",
    description:
      "Multi-divisional energy company with complex debt structures, commodity hedging, and environmental considerations.",
    timeLimit: 90,
    maxScore: 2000,
    type: "lbo",
  },

  // DCF Problems
  {
    id: "dcf-1",
    name: "TechFlow SaaS DCF",
    difficulty: "beginner",
    description:
      "Value a high-growth SaaS company using DCF. Build revenue projections, calculate free cash flow, and determine enterprise value.",
    timeLimit: 40,
    maxScore: 1000,
    type: "dcf",
  },
  {
    id: "dcf-2",
    name: "RetailExpand DCF",
    difficulty: "beginner",
    description:
      "Value a retail chain with aggressive store expansion plans. Model store count growth, same-store sales, and working capital needs.",
    timeLimit: 45,
    maxScore: 1000,
    type: "dcf",
  },
  {
    id: "dcf-3",
    name: "IndustrialCo DCF",
    difficulty: "intermediate",
    description:
      "Multi-segment manufacturing company valuation. Model different growth rates per segment with detailed capex and depreciation.",
    timeLimit: 60,
    maxScore: 1500,
    type: "dcf",
  },
  {
    id: "dcf-4",
    name: "BioPharma Pipeline DCF",
    difficulty: "advanced",
    description:
      "Advanced DCF with probability-weighted drug pipeline, patent expiries, and R&D modeling. Risk-adjusted discount rates required.",
    timeLimit: 75,
    maxScore: 2000,
    type: "dcf",
  },
  {
    id: "dcf-5",
    name: "MegaCorp Conglomerate DCF",
    difficulty: "advanced",
    description:
      "Sum-of-the-parts valuation for a multi-division conglomerate. Each division requires different WACC and growth assumptions.",
    timeLimit: 90,
    maxScore: 2500,
    type: "dcf",
  },
];

const ProblemsPage: React.FC = () => {
  // const { user } = useAuth(); // Will be used for tracking user progress
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const handleStartProblem = (problemId: string) => {
    navigate(`/problem/${problemId}`);
  };

  const filteredProblems = mockProblems.filter((p) => {
    const difficultyMatch = selectedDifficulty === "all" || p.difficulty === selectedDifficulty;
    const typeMatch = selectedType === "all" || p.type === selectedType;
    return difficultyMatch && typeMatch;
  });

  return (
    <PageContainer>
      <Header />

      <Content>
        <PageTitle>Practice Problems</PageTitle>

        <FilterSection>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <FilterButton
              $active={selectedType === "all"}
              onClick={() => setSelectedType("all")}>
              All Types
            </FilterButton>
            <FilterButton
              $active={selectedType === "lbo"}
              onClick={() => setSelectedType("lbo")}>
              LBO Models
            </FilterButton>
            <FilterButton
              $active={selectedType === "dcf"}
              onClick={() => setSelectedType("dcf")}>
              DCF Models
            </FilterButton>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <FilterButton
              $active={selectedDifficulty === "all"}
              onClick={() => setSelectedDifficulty("all")}>
              All Difficulties
            </FilterButton>
            <FilterButton
              $active={selectedDifficulty === "beginner"}
              onClick={() => setSelectedDifficulty("beginner")}>
              Beginner
            </FilterButton>
            <FilterButton
              $active={selectedDifficulty === "intermediate"}
              onClick={() => setSelectedDifficulty("intermediate")}>
              Intermediate
            </FilterButton>
            <FilterButton
              $active={selectedDifficulty === "advanced"}
              onClick={() => setSelectedDifficulty("advanced")}>
              Advanced
            </FilterButton>
          </div>
        </FilterSection>

        <ProblemsGrid>
          {filteredProblems.map((problem, index) => (
            <ProblemCard key={problem.id} delay={index + 6}>
              <ProblemHeader>
                <div style={{ flex: 1 }}>
                  <ProblemTitle>{problem.name}</ProblemTitle>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <DifficultyBadge level={problem.difficulty}>
                      {problem.difficulty}
                    </DifficultyBadge>
                    <span style={{
                      backgroundColor: problem.type === 'lbo' ? '#6366f1' : '#10b981',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {problem.type}
                    </span>
                  </div>
                </div>
              </ProblemHeader>
              <ProblemDescription>{problem.description}</ProblemDescription>
              <ProblemMeta>
                <MetaItem>⏱️ {problem.timeLimit} min</MetaItem>
                <MetaItem>🎯 {problem.maxScore} pts</MetaItem>
                <StartButton onClick={() => handleStartProblem(problem.id)}>
                  Start Problem
                </StartButton>
              </ProblemMeta>
            </ProblemCard>
          ))}
        </ProblemsGrid>
      </Content>
    </PageContainer>
  );
};

export default ProblemsPage;
