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
import InteractiveReviewAdoption from './components/InteractiveReviewAdoption';
import ConceptCooccurrenceIndex from './components/ConceptCooccurrenceIndex';
import HypernymGenerationAudit from './components/HypernymGenerationAudit';
import KnowledgeConsistencyValidation from './components/KnowledgeConsistencyValidation';
import ApiIntegrationInference from './components/ApiIntegrationInference';
import TimeEntityNormalization from './components/TimeEntityNormalization';
import TemporalRelationAudit from './components/TemporalRelationAudit';
import LiteratureMultidimensionalParse from './components/LiteratureMultidimensionalParse';
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
import DataSourceManagement, { type DSMode } from './components/DataSourceManagement';
import MultimodalDatasetManagement from './components/MultimodalDatasetManagement';
import MappingManagement from './components/MappingManagement';
import GraphConstruction from './components/GraphConstruction';
import GraphTasks from './components/GraphTasks';
import GraphFusion from './components/GraphFusion';
import PropertyManagement from './components/PropertyManagement';
import HumanReview from './components/HumanReview';
import { AuditFeaturePage } from './components/AuditFeaturePage';
import type { AuditFeatureSelection } from './data/auditCatalogTypes';
import {
  resolveAuditAlgorithmId,
  resolveAuditAlgorithmDemoTab,
  resolveAuditAlgorithmTab,
  resolveGraphConstructionTab,
  resolveRuleEditorMode,
  resolveRuleDrawerFocus,
  resolveRuleListFocus,
  resolveRuleCategoryFilter,
  resolveHumanReviewTab,
  resolveEventReviewSubTab,
  resolveTemporalAuditMode,
  resolveLiteratureParseFocus,
  type AuditAlgorithmDemoTab,
  type AuditAlgorithmTab,
  type GraphConstructionTab,
  type RuleEditorMode,
  type RuleCategoryFilter,
  type RuleDrawerFocus,
  type RuleListFocus,
  type HumanReviewTab,
  type EventReviewSubTab,
  type TemporalAuditMode,
  type LiteratureParseFocus,
} from './data/auditPageMap';

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
  const [selectedAuditFeature, setSelectedAuditFeature] = useState<AuditFeatureSelection | null>(null);
  const [dataSourceView, setDataSourceView] = useState<DSMode>('structured');
  const [algorithmDemoTab, setAlgorithmDemoTab] = useState<AuditAlgorithmDemoTab | null>(null);
  const [algorithmInitialTab, setAlgorithmInitialTab] = useState<AuditAlgorithmTab | null>(null);
  const [autoStartDepTest, setAutoStartDepTest] = useState(false);
  const [graphConstructionTab, setGraphConstructionTab] = useState<GraphConstructionTab | null>(null);
  const [ruleEditorMode, setRuleEditorMode] = useState<RuleEditorMode | null>(null);
  const [ruleDrawerFocus, setRuleDrawerFocus] = useState<RuleDrawerFocus | null>(null);
  const [ruleListFocus, setRuleListFocus] = useState<RuleListFocus | null>(null);
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<RuleCategoryFilter | null>(null);
  const [humanReviewTab, setHumanReviewTab] = useState<HumanReviewTab | null>(null);
  const [eventReviewSubTab, setEventReviewSubTab] = useState<EventReviewSubTab | null>(null);
  const [temporalAuditMode, setTemporalAuditMode] = useState<TemporalAuditMode | null>(null);
  const [literatureParseFocus, setLiteratureParseFocus] = useState<LiteratureParseFocus | null>(null);

  const resolveDataSourceView = (pagePath: string): DSMode => {
    if (pagePath.includes('外部词典导入')) return 'lexicon';
    if (pagePath.includes('种子实例')) return 'seed';
    return 'structured';
  };

  const clearAlgorithmExtras = () => {
    setAlgorithmDemoTab(null);
    setAlgorithmInitialTab(null);
    setAutoStartDepTest(false);
    setGraphConstructionTab(null);
    setRuleEditorMode(null);
    setRuleDrawerFocus(null);
    setRuleListFocus(null);
    setRuleCategoryFilter(null);
    setHumanReviewTab(null);
    setEventReviewSubTab(null);
    setTemporalAuditMode(null);
    setLiteratureParseFocus(null);
  };

  const handleNavigate = (page: string) => {
    if (page === 'kg-datasource') setDataSourceView('structured');
    if (page !== 'algorithm-detail') clearAlgorithmExtras();
    setCurrentPage(page);
  };

  const handleAuditFeatureSelect = (feature: AuditFeatureSelection, pageId: string | null) => {
    setSelectedAuditFeature(feature);
    // 审计专用独立页优先（不与产品页共用）
    if (pageId === 'interactive-review-adoption' || pageId === 'concept-cooccurrence-index' || pageId === 'hypernym-generation-audit' || pageId === 'knowledge-consistency-validation' || pageId === 'api-integration-inference' || pageId === 'time-entity-normalization' || pageId === 'temporal-relation-audit' || pageId === 'literature-multidim-parse') {
      if (pageId === 'temporal-relation-audit') {
        setTemporalAuditMode(resolveTemporalAuditMode(feature.pagePath) ?? 'extraction');
      }
      if (pageId === 'literature-multidim-parse') {
        setLiteratureParseFocus(resolveLiteratureParseFocus(feature.pagePath));
      }
      setCurrentPage(pageId);
      return;
    }
    const algorithmId = resolveAuditAlgorithmId(feature.pagePath);
    if (algorithmId) {
      setSelectedAlgorithmId(algorithmId);
      setAlgorithmDemoTab(resolveAuditAlgorithmDemoTab(feature.pagePath));
      setAlgorithmInitialTab(resolveAuditAlgorithmTab(feature.pagePath));
      setAutoStartDepTest(false);
      setCurrentPage('algorithm-detail');
      return;
    }
    if (pageId === 'kg-datasource') {
      setDataSourceView(resolveDataSourceView(feature.pagePath || ''));
      setCurrentPage('kg-datasource');
      return;
    }
    if (pageId === 'graph-construction') {
      setGraphConstructionTab(resolveGraphConstructionTab(feature.pagePath));
      setCurrentPage('graph-construction');
      return;
    }
    if (pageId === 'rule-management') {
      setRuleEditorMode(resolveRuleEditorMode(feature.pagePath));
      setRuleDrawerFocus(resolveRuleDrawerFocus(feature.pagePath));
      setRuleListFocus(resolveRuleListFocus(feature.pagePath));
      setRuleCategoryFilter(resolveRuleCategoryFilter(feature.pagePath));
      setCurrentPage('rule-management');
      return;
    }
    if (pageId === 'human-review') {
      setHumanReviewTab(resolveHumanReviewTab(feature.pagePath));
      setEventReviewSubTab(resolveEventReviewSubTab(feature.pagePath));
      setCurrentPage('human-review');
      return;
    }
    if (pageId) {
      setCurrentPage(pageId);
    } else {
      setCurrentPage('audit-feature');
    }
  };

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
    clearAlgorithmExtras();
    setCurrentPage('algorithm-detail');
  };

  const handleBackToAlgorithmList = () => {
    setSelectedAlgorithmId(null);
    clearAlgorithmExtras();
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
        return (
          <RuleManagement
            key={`${ruleEditorMode ?? 'list'}-${ruleDrawerFocus ?? 'none'}-${ruleListFocus ?? 'none'}-${ruleCategoryFilter ?? 'all'}`}
            initialEditorMode={ruleEditorMode ?? undefined}
            initialDrawerFocus={ruleDrawerFocus ?? undefined}
            initialListFocus={ruleListFocus ?? undefined}
            initialCategoryFilter={ruleCategoryFilter ?? undefined}
          />
        );
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
            initialDemoTab={selectedAlgorithmId === 'candidate-term-generation' ? algorithmDemoTab ?? undefined : undefined}
            initialTab={algorithmInitialTab ?? undefined}
            autoStartDepTest={selectedAlgorithmId === 'dependency-graph' ? autoStartDepTest : false}
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
      case 'interactive-review-adoption':
        return <InteractiveReviewAdoption />;
      case 'concept-cooccurrence-index':
        return <ConceptCooccurrenceIndex />;
      case 'hypernym-generation-audit':
        return <HypernymGenerationAudit />;
      case 'knowledge-consistency-validation':
        return <KnowledgeConsistencyValidation />;
      case 'api-integration-inference':
        return <ApiIntegrationInference />;
      case 'time-entity-normalization':
        return <TimeEntityNormalization />;
      case 'temporal-relation-audit':
        return (
          <TemporalRelationAudit
            key={temporalAuditMode ?? 'extraction'}
            initialMode={temporalAuditMode ?? 'extraction'}
          />
        );
      case 'literature-multidim-parse':
        return (
          <LiteratureMultidimensionalParse
            key={literatureParseFocus ?? 'all'}
            initialFocus={literatureParseFocus ?? undefined}
          />
        );
      case 'human-review':
        return (
          <HumanReview
            key={`${humanReviewTab ?? 'default'}-${eventReviewSubTab ?? 'none'}`}
            initialTopTab={humanReviewTab ?? undefined}
            initialEventSubTab={eventReviewSubTab ?? undefined}
          />
        );
      case 'kg-ontology':
        return <OntologyManagement />;
      case 'kg-mapping':
        return <MappingManagement />;
      case 'kg-datasource':
        return <DataSourceManagement viewMode={dataSourceView} />;
      case 'graph-construction':
        return <GraphConstruction onNavigateTo={setCurrentPage} initialTab={graphConstructionTab ?? undefined} />;
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
      case 'audit-feature':
        return selectedAuditFeature ? (
          <AuditFeaturePage feature={selectedAuditFeature} />
        ) : (
          <Placeholder title="审计目录" desc="请从左侧「目录」中选择功能点" />
        );
      default:
        return <DataDashboard />;
    }
  };

  return (
    <div className="size-full flex bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        selectedAuditFeatureId={selectedAuditFeature?.id}
        onAuditFeatureSelect={handleAuditFeatureSelect}
      />
      <main className={`flex-1 overflow-hidden flex flex-col ${['app-center', 'graph-visualization', 'evolution-analysis', 'vertical-domain-graph', 'knowledge-search', 'literature-reader', 'knowledge-base', 'academic-poster', 'kg-ontology', 'kg-datasource', 'kg-mapping', 'graph-construction', 'graph-tasks', 'human-review', 'graph-fusion', 'property-management', 'multimodal-dataset', 'audit-feature'].includes(currentPage) ? '' : 'p-8 overflow-y-auto'}`}>
        <div className={['app-center', 'graph-visualization', 'evolution-analysis', 'vertical-domain-graph', 'knowledge-search', 'literature-reader', 'knowledge-base', 'academic-poster', 'kg-ontology', 'kg-datasource', 'kg-mapping', 'graph-construction', 'graph-tasks', 'human-review', 'graph-fusion', 'property-management', 'multimodal-dataset', 'audit-feature'].includes(currentPage) ? 'h-full flex flex-col' : ''}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}