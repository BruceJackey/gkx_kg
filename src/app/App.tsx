import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataDashboard } from './components/DataDashboard';
import { KnowledgeGraphDashboard } from './components/KnowledgeGraphDashboard';
import OntologyAndProperty from './components/OntologyAndProperty';
import RuleManagement from './components/RuleManagement';
import { AlgorithmCategories } from './components/AlgorithmCategories';
import { AlgorithmCategoryDetail } from './components/AlgorithmCategoryDetail';
import { AlgorithmDetailPage } from './components/AlgorithmDetailPage';
import { DatasetCategories } from './components/DatasetCategories';
import { DatasetCategoryDetail } from './components/DatasetCategoryDetail';
import { TaskManagement } from './components/TaskManagement';
import { GraphServiceList } from './components/GraphServiceList';
import { GraphServiceDetail } from './components/GraphServiceDetail';
import { ApplicationCenter } from './components/ApplicationCenter';
import { GraphVisualization } from './components/GraphVisualization';
import { EvolutionAnalysis } from './components/EvolutionAnalysis';
import { ApiKeyManagement } from './components/ApiKeyManagement';
import KnowledgeSearch from './components/KnowledgeSearch';
import KnowledgeRepository from './components/KnowledgeRepository';
import KnowledgeBase from './components/KnowledgeBase';
import LiteratureProcessing from './components/LiteratureProcessing';
import LiteratureReader from './components/LiteratureReader';
import RelationAnalysis from './components/RelationAnalysis';
import InferencePrediction from './components/InferencePrediction';
import DecisionSupport from './components/DecisionSupport';
import KnowledgeValidation from './components/KnowledgeValidation';
import AcademicPoster from './components/AcademicPoster';
import PatentProcessing from './components/PatentProcessing';
import { ApiCallLogs } from './components/ApiCallLogs';
import TermReview from './components/TermReview';
import { AlgorithmApiManagement } from './components/AlgorithmApiManagement';
import { PipelineApiManagement } from './components/PipelineApiManagement';
import { PipelineServiceDetail } from './components/PipelineServiceDetail';
import { AlgorithmServiceDetail } from './components/AlgorithmServiceDetail';
import VerticalDomainGraph from './components/VerticalDomainGraph';
import TextSemanticExtraction from './components/TextSemanticExtraction';
import EntityExtraction from './components/EntityExtraction';
import KGConstructionEngine from './components/KGConstructionEngine';
import ConflictManagementPage from './components/ConflictManagementPage';
import OntologyManagement from './components/OntologyManagement';
import DataSourceManagement from './components/DataSourceManagement';
import MultimodalDatasetManagement from './components/MultimodalDatasetManagement';
import MappingManagement from './components/MappingManagement';
import GraphConstruction from './components/GraphConstruction';
import GraphTasks from './components/GraphTasks';
import GraphFusion from './components/GraphFusion';
import PropertyManagement from './components/PropertyManagement';
import HumanReview from './components/HumanReview';

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-1">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-400 max-w-xs">{desc}</p>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('data-dashboard');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState<string | null>(null);
  const [selectedDatasetCategoryId, setSelectedDatasetCategoryId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedAlgorithmServiceId, setSelectedAlgorithmServiceId] = useState<string | null>(null);
  const [selectedPipelineServiceId, setSelectedPipelineServiceId] = useState<string | null>(null);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage('category-detail');
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
    setSelectedAlgorithmId(null);
    setCurrentPage('algorithm-list');
  };

  const handleSelectAlgorithm = (algorithmId: string) => {
    setSelectedAlgorithmId(algorithmId);
    setCurrentPage('algorithm-detail');
  };

  const handleBackToAlgorithmList = () => {
    setSelectedAlgorithmId(null);
    setCurrentPage('category-detail');
  };

  const handleSelectDatasetCategory = (categoryId: string) => {
    setSelectedDatasetCategoryId(categoryId);
    setCurrentPage('dataset-category-detail');
  };

  const handleBackToDatasetCategories = () => {
    setSelectedDatasetCategoryId(null);
    setCurrentPage('algorithm-dataset');
  };

  const handleNavigateToAlgorithm = (algorithmId: string) => {
    setSelectedAlgorithmId(algorithmId);
    setCurrentPage('algorithm-detail');
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentPage('service-detail');
  };

  const handleBackToServiceList = () => {
    setSelectedServiceId(null);
    setCurrentPage('service-list');
  };

  const handleSelectAlgorithmService = (serviceId: string) => {
    setSelectedAlgorithmServiceId(serviceId);
    setCurrentPage('algorithm-service-detail');
  };

  const handleBackToAlgorithmServiceList = () => {
    setSelectedAlgorithmServiceId(null);
    setCurrentPage('algorithm-service-list');
  };

  const handleSelectPipelineService = (serviceId: string) => {
    setSelectedPipelineServiceId(serviceId);
    setCurrentPage('pipeline-service-detail');
  };

  const handleBackToPipelineServiceList = () => {
    setSelectedPipelineServiceId(null);
    setCurrentPage('pipeline-service-list');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'data-dashboard':
        return <DataDashboard />;
      case 'knowledge-graph-dashboard':
        return <KnowledgeGraphDashboard />;
      case 'graph-fusion':
        return <GraphFusion />;
      case 'property-management':
        return <PropertyManagement />;
      case 'rule-management':
        return <RuleManagement />;
      case 'algorithm-list':
        return <AlgorithmCategories onSelectCategory={handleSelectCategory} />;
      case 'category-detail':
        return selectedCategoryId ? (
          <AlgorithmCategoryDetail
            categoryId={selectedCategoryId}
            onBack={handleBackToCategories}
            onSelectAlgorithm={handleSelectAlgorithm}
          />
        ) : (
          <AlgorithmCategories onSelectCategory={handleSelectCategory} />
        );
      case 'algorithm-detail':
        return selectedAlgorithmId ? (
          <AlgorithmDetailPage
            algorithmId={selectedAlgorithmId}
            onBack={handleBackToAlgorithmList}
            onNavigateToService={(algId) => {
              setSelectedAlgorithmServiceId(algId);
              setCurrentPage('algorithm-service-detail');
            }}
          />
        ) : (
          <AlgorithmCategories onSelectCategory={handleSelectCategory} />
        );
      case 'algorithm-dataset':
        return <DatasetCategories onSelectCategory={handleSelectDatasetCategory} />;
      case 'multimodal-dataset':
        return <MultimodalDatasetManagement />;
      case 'dataset-category-detail':
        return selectedDatasetCategoryId ? (
          <DatasetCategoryDetail
            categoryId={selectedDatasetCategoryId}
            onBack={handleBackToDatasetCategories}
          />
        ) : (
          <DatasetCategories onSelectCategory={handleSelectDatasetCategory} />
        );
      case 'algorithm-tasks':
        return <TaskManagement />;
      case 'algorithm-service-list':
        return <AlgorithmApiManagement onSelectService={handleSelectAlgorithmService} />;
      case 'algorithm-service-detail':
        return selectedAlgorithmServiceId ? (
          <AlgorithmServiceDetail
            serviceId={selectedAlgorithmServiceId}
            onBack={handleBackToAlgorithmServiceList}
            onViewAlgorithm={(algId) => {
              setSelectedAlgorithmId(algId);
              setCurrentPage('algorithm-detail');
            }}
          />
        ) : (
          <AlgorithmApiManagement onSelectService={handleSelectAlgorithmService} />
        );
      case 'call-logs':
        return <ApiCallLogs />;
      case 'term-review':
        return <TermReview />;
      case 'human-review':
        return <HumanReview />;
      case 'kg-ontology':
        return <OntologyManagement />;
      case 'kg-mapping':
        return <MappingManagement />;
      case 'kg-datasource':
        return <DataSourceManagement />;
      case 'graph-construction':
        return <GraphConstruction onNavigateTo={setCurrentPage} />;
      case 'graph-tasks':
        return <GraphTasks onNavigateTo={setCurrentPage} />;
      case 'kg-construction':
        return <KGConstructionEngine onBack={() => setCurrentPage('data-dashboard')} />;
      case 'text-semantic-extraction':
        return <TextSemanticExtraction onBack={() => setCurrentPage('data-dashboard')} />;
      case 'entity-extraction':
        return <EntityExtraction onBack={() => setCurrentPage('entity-extraction')} />;
      case 'conflict-management':
        return <ConflictManagementPage />;
      case 'pipeline-service-list':
        return <PipelineApiManagement onSelectService={handleSelectPipelineService} />;
      case 'pipeline-service-detail':
        return selectedPipelineServiceId ? (
          <PipelineServiceDetail
            serviceId={selectedPipelineServiceId}
            onBack={handleBackToPipelineServiceList}
          />
        ) : (
          <PipelineApiManagement onSelectService={handleSelectPipelineService} />
        );
      case 'service-list':
        return (
          <GraphServiceList
            onSelectService={handleSelectService}
          />
        );
      case 'service-detail':
        return selectedServiceId ? (
          <GraphServiceDetail
            serviceId={selectedServiceId}
            onBack={handleBackToServiceList}
          />
        ) : (
          <GraphServiceList
            onSelectService={handleSelectService}
          />
        );
      case 'knowledge-base':
        return <KnowledgeBase onNavigate={setCurrentPage} />;
      case 'knowledge-search':
        return <KnowledgeSearch />;
      case 'knowledge-repository':
        return <KnowledgeRepository />;
      case 'literature-processing':
        return <LiteratureProcessing />;
      case 'literature-reader':
        return <LiteratureReader />;
      case 'patent-processing':
        return <PatentProcessing />;
      case 'api-keys':
        return <ApiKeyManagement />;
      case 'app-center':
        return <ApplicationCenter />;
      case 'graph-visualization':
        return <GraphVisualization />;
      case 'evolution-analysis':
        return <EvolutionAnalysis />;
      case 'vertical-domain-graph':
        return <VerticalDomainGraph />;
      case 'relation-analysis':
        return <RelationAnalysis />;
      case 'inference-prediction':
        return <InferencePrediction />;
      case 'decision-support':
        return <DecisionSupport />;
      case 'knowledge-validation':
        return <KnowledgeValidation />;
      case 'academic-poster':
        return <AcademicPoster />;
      default:
        return <DataDashboard />;
    }
  };

  return (
    <div className="size-full flex bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <main className={`flex-1 overflow-hidden flex flex-col ${['app-center', 'graph-visualization', 'evolution-analysis', 'vertical-domain-graph', 'knowledge-search', 'literature-reader', 'knowledge-base', 'academic-poster', 'kg-ontology', 'kg-datasource', 'kg-mapping', 'graph-construction', 'graph-tasks', 'human-review', 'graph-fusion', 'property-management', 'multimodal-dataset'].includes(currentPage) ? '' : 'p-8 overflow-y-auto'}`}>
        <div className={['app-center', 'graph-visualization', 'evolution-analysis', 'vertical-domain-graph', 'knowledge-search', 'literature-reader', 'knowledge-base', 'academic-poster', 'kg-ontology', 'kg-datasource', 'kg-mapping', 'graph-construction', 'graph-tasks', 'human-review', 'graph-fusion', 'property-management', 'multimodal-dataset'].includes(currentPage) ? 'h-full flex flex-col' : ''}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}