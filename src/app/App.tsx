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
import RelationReasoningPage from './components/RelationReasoningPage';
import HumanMachineReviewPage from './components/HumanMachineReviewPage';
import VerifiedKnowledgeWritePage from './components/VerifiedKnowledgeWritePage';
import LlmApiIntegrationPage from './components/LlmApiIntegrationPage';
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
import HighPerformanceInferenceKernel from './components/HighPerformanceInferenceKernel';
import FactChangeListening from './components/FactChangeListening';
import InferenceTaskManagement from './components/InferenceTaskManagement';
import TimeEntityNormalization from './components/TimeEntityNormalization';
import FutureStatePrediction from './components/FutureStatePrediction';
import TemporalRelationAudit from './components/TemporalRelationAudit';
import LiteratureMultidimensionalParse from './components/LiteratureMultidimensionalParse';
import PatentTechnicalElementParse from './components/PatentTechnicalElementParse';
import PatentModuleDecomposition from './components/PatentModuleDecomposition';
import PatentLiteratureMatch from './components/PatentLiteratureMatch';
import SimilarityComputationEngine from './components/SimilarityComputationEngine';
import KgIntegratedWorkbench from './components/KgIntegratedWorkbench';
import CorpusSelectionConfig from './components/CorpusSelectionConfig';
import ContextPatternExtractionEngine from './components/ContextPatternExtractionEngine';
import PatternPreviewManagement from './components/PatternPreviewManagement';
import PatternApplicationEngine from './components/PatternApplicationEngine';
import NewInstanceExtraction from './components/NewInstanceExtraction';
import InstanceConfidenceEvaluation from './components/InstanceConfidenceEvaluation';
import PendingInstanceReview from './components/PendingInstanceReview';
import EntityAlignmentDisambiguation from './components/EntityAlignmentDisambiguation';
import BatchInstanceIngest from './components/BatchInstanceIngest';
import RuleLearningWorkbench from './components/RuleLearningWorkbench';
import DualFactorRankApi from './components/DualFactorRankApi';
import TermConfidenceGraphApi from './components/TermConfidenceGraphApi';
import QuadrupleStructureApi from './components/QuadrupleStructureApi';
import LocalLearningAnnotator from './components/LocalLearningAnnotator';
import EntityAttributeExtractApi from './components/EntityAttributeExtractApi';
import TextHighlightSeedAnnotator from './components/TextHighlightSeedAnnotator';
import EventAnnotationManagement from './components/EventAnnotationManagement';
import EventIngestWorkflow from './components/EventIngestWorkflow';
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
import MappingTransformFunction from './components/MappingTransformFunction';
import AttributePreciseExtract from './components/AttributePreciseExtract';
import MultiFormatLiteratureParse from './components/MultiFormatLiteratureParse';
import MultimodalContentTranscribe from './components/MultimodalContentTranscribe';
import LlmSemanticRefine from './components/LlmSemanticRefine';
import SciCoreTupleExtract from './components/SciCoreTupleExtract';
import StandardGraphApiServices from './components/StandardGraphApiServices';
import UpperIntelligentTools from './components/UpperIntelligentTools';
import TextInstanceMatching from './components/TextInstanceMatching';
import StructureInstanceMatching from './components/StructureInstanceMatching';
import InstanceFeatureEngineering from './components/InstanceFeatureEngineering';
import TextEntityRecognition from './components/TextEntityRecognition';
import CandidateEntityGeneration from './components/CandidateEntityGeneration';
import EntityLinkJudgment from './components/EntityLinkJudgment';
import LinkAnnotationMapping from './components/LinkAnnotationMapping';
import CrossLingualInstanceMatching from './components/CrossLingualInstanceMatching';
import CrossLingualQueryFusion from './components/CrossLingualQueryFusion';
import CrossLingualAttributeAlignment from './components/CrossLingualAttributeAlignment';
import CrossLingualKbAlignment from './components/CrossLingualKbAlignment';
import EntityMatchingDisambiguation from './components/EntityMatchingDisambiguation';
import GraphConstruction from './components/GraphConstruction';
import GraphTasks from './components/GraphTasks';
import GraphFusion from './components/GraphFusion';
import PropertyManagement from './components/PropertyManagement';
import SchemaConstraintRulesPage from './components/SchemaConstraintRulesPage';
import DataConsistencyScan from './components/DataConsistencyScan';
import ValidationReportPage from './components/ValidationReportPage';
import CompletionResultReviewPage from './components/CompletionResultReviewPage';
import TextEntityLocalizationPage from './components/TextEntityLocalizationPage';
import VisualEntityLocalizationPage from './components/VisualEntityLocalizationPage';
import TextConceptLocalizationPage from './components/TextConceptLocalizationPage';
import VisualConceptLocalizationPage from './components/VisualConceptLocalizationPage';
import RelationLocalizationPage from './components/RelationLocalizationPage';
import TextRelationLocalizationPage from './components/TextRelationLocalizationPage';
import VisualRelationLocalizationPage from './components/VisualRelationLocalizationPage';
import HumanReview from './components/HumanReview';
import { AuditFeaturePage } from './components/AuditFeaturePage';
import type { AuditFeatureSelection } from './data/auditCatalogTypes';
import {
  resolveAuditAlgorithmId,
  resolveAuditAlgorithmDemoTab,
  resolveAuditAlgorithmTab,
  resolveGraphConstructionTab,
  resolveGraphStrategyFocus,
  resolveRuleEditorMode,
  resolveRuleDrawerFocus,
  resolveRuleListFocus,
  resolveRuleCategoryFilter,
  resolveHumanReviewTab,
  resolveEventReviewSubTab,
  resolveKgReviewConsensusFocus,
  resolveRecognitionFocus,
  resolveTextEntityRecognitionFocus,
  resolveEntityLinkJudgmentFocus,
  resolveLinkAnnotationFocus,
  resolveLiteratureReaderFocus,
  resolveCrossLingualFocus,
  resolveCrossLingualQueryFocus,
  resolveCrossLingualAttributeFocus,
  resolveCrossLingualKbFocus,
  resolveEntityMatchingDisambiguationFocus,
  resolveRepresentationSpaceFocus,
  resolveScoringFunctionFocus,
  resolveEncodingModelFocus,
  resolveSupervisedSimilarityFocus,
  resolveNodeSimilarityFocus,
  resolveSemanticRetrievalFocus,
  resolveMultimodalRepresentationFocus,
  resolveOpenClipAutoStartTraining,
  resolveCallLogsFocus,
  resolveRelationReasoningFocus,
  resolveHumanMachineReviewFocus,
  resolveKnowledgeSearchFocus,
  resolvePropertyManagementTab,
  resolvePropertyManagementFocus,
  resolveAppCenterFocus,
  resolveAppCenterAssistantId,
  resolveAssociationStrengthFocus,
  resolveDatasetCategoryId,
  resolveDatasetCategoryTab,
  resolveDatasetCategoryFocus,
  resolveTemporalAuditMode,
  resolveGraphVizDockFocus,
  resolveIntegratedWorkbenchModule,
  resolvePatternPreviewFocus,
  resolveRuleLearningTab,
  resolveDualFactorRankFocus,
  resolveTermConfidenceGraphFocus,
  resolveQuadrupleStructureFocus,
  resolveLiteratureParseFocus,
  resolvePatentParseFocus,
  resolveLocalLearningTab,
  resolveEventAnnotationMgmtTab,
  resolveGraphTasksDashTab,
  resolveGraphConstructionAutoTask,
  resolveEntityAttrApiTab,
  resolveOntologyModelFocus,
  resolveMappingViewMode,
  resolveMultiFormatLitTab,
  resolveMultimodalTranscribeFocus,
  resolveLlmSemanticFocus,
  resolveSciCoreFocus,
  resolveStandardApiTab,
  resolveUpperToolTab,
  resolveAcademicPosterTab,
  resolveMultimodalDatasetFocus,
  resolveGraphFusionFocus,
  type AuditAlgorithmDemoTab,
  type AuditAlgorithmTab,
  type GraphConstructionTab,
  type GraphStrategyFocus,
  type RuleEditorMode,
  type RuleCategoryFilter,
  type RuleDrawerFocus,
  type RuleListFocus,
  type HumanReviewTab,
  type EventReviewSubTab,
  type RecognitionFocus,
  type TemporalAuditMode,
  type GraphVizDockFocus,
  type IntegratedWorkbenchModule,
  type PatternPreviewFocus,
  type RuleLearningTab,
  type DualFactorRankFocus,
  type TermConfidenceGraphFocus,
  type QuadrupleStructureFocus,
  type LiteratureParseFocus,
  type PatentParseFocus,
  type LocalLearningTab,
  type EventAnnotationMgmtTab,
  type GraphTasksDashTabFocus,
  type EntityAttrApiTab,
  type OntologyModelFocus,
  type MappingViewMode,
  type MultiFormatLitTab,
  type MultimodalTranscribeFocus,
  type LlmSemanticFocus,
  type SciCoreFocus,
  type StandardApiTab,
  type UpperToolTab,
  type AcademicPosterTab,
  type MultimodalDatasetFocus,
  type GraphFusionFocus,
  type EntityLinkJudgmentFocus,
  type LinkAnnotationFocus,
  type LiteratureReaderFocus,
  type CrossLingualFocus,
  type CrossLingualQueryFocus,
  type CrossLingualAttributeFocus,
  type CrossLingualKbFocus,
  type EntityMatchingDisambiguationFocus,
  type RepresentationSpaceFocus,
  type ScoringFunctionFocus,
  type EncodingModelFocus,
  type SupervisedSimilarityFocus,
  type NodeSimilarityFocus,
  type SemanticRetrievalFocus,
  type MultimodalRepresentationFocus,
  type CallLogsFocus,
  type RelationReasoningFocus,
  type HumanMachineReviewFocus,
  type KnowledgeSearchFocus,
  type PropertyManagementTab,
  type PropertyManagementFocus,
  type AppCenterFocus,
  type AssociationStrengthFocus,
  type DatasetCategoryTab,
  type DatasetCategoryFocus,
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
  const [autoStartOpenClipTraining, setAutoStartOpenClipTraining] = useState(false);
  const [graphConstructionTab, setGraphConstructionTab] = useState<GraphConstructionTab | null>(null);
  const [graphStrategyFocus, setGraphStrategyFocus] = useState<GraphStrategyFocus | null>(null);
  const [graphConstructionAutoTask, setGraphConstructionAutoTask] = useState(false);
  const [ruleEditorMode, setRuleEditorMode] = useState<RuleEditorMode | null>(null);
  const [ruleDrawerFocus, setRuleDrawerFocus] = useState<RuleDrawerFocus | null>(null);
  const [ruleListFocus, setRuleListFocus] = useState<RuleListFocus | null>(null);
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<RuleCategoryFilter | null>(null);
  const [humanReviewTab, setHumanReviewTab] = useState<HumanReviewTab | null>(null);
  const [eventReviewSubTab, setEventReviewSubTab] = useState<EventReviewSubTab | null>(null);
  const [kgReviewConsensusFocus, setKgReviewConsensusFocus] = useState(false);
  const [recognitionFocus, setRecognitionFocus] = useState<RecognitionFocus | null>(null);
  const [temporalAuditMode, setTemporalAuditMode] = useState<TemporalAuditMode | null>(null);
  const [graphVizDockFocus, setGraphVizDockFocus] = useState<GraphVizDockFocus | null>(null);
  const [integratedWorkbenchModule, setIntegratedWorkbenchModule] = useState<IntegratedWorkbenchModule | null>(null);
  const [ruleLearningTab, setRuleLearningTab] = useState<RuleLearningTab | null>(null);
  const [dualFactorRankFocus, setDualFactorRankFocus] = useState<DualFactorRankFocus | null>(null);
  const [termConfidenceGraphFocus, setTermConfidenceGraphFocus] = useState<TermConfidenceGraphFocus | null>(null);
  const [quadrupleStructureFocus, setQuadrupleStructureFocus] = useState<QuadrupleStructureFocus | null>(null);
  const [patternPreviewFocus, setPatternPreviewFocus] = useState<PatternPreviewFocus | null>(null);
  const [literatureParseFocus, setLiteratureParseFocus] = useState<LiteratureParseFocus | null>(null);
  const [patentParseFocus, setPatentParseFocus] = useState<PatentParseFocus | null>(null);
  const [localLearningTab, setLocalLearningTab] = useState<LocalLearningTab | null>(null);
  const [eventAnnotationMgmtTab, setEventAnnotationMgmtTab] = useState<EventAnnotationMgmtTab | null>(null);
  const [graphTasksDashTab, setGraphTasksDashTab] = useState<GraphTasksDashTabFocus | null>(null);
  const [entityAttrApiTab, setEntityAttrApiTab] = useState<EntityAttrApiTab | null>(null);
  const [mappingNormalizeFocus, setMappingNormalizeFocus] = useState(false);
  const [ontologyModelFocus, setOntologyModelFocus] = useState<OntologyModelFocus | null>(null);
  const [mappingViewMode, setMappingViewMode] = useState<MappingViewMode | null>(null);
  const [multiFormatLitTab, setMultiFormatLitTab] = useState<MultiFormatLitTab | null>(null);
  const [multimodalFocus, setMultimodalFocus] = useState<MultimodalTranscribeFocus | null>(null);
  const [llmSemanticFocus, setLlmSemanticFocus] = useState<LlmSemanticFocus | null>(null);
  const [sciCoreFocus, setSciCoreFocus] = useState<SciCoreFocus | null>(null);
  const [standardApiTab, setStandardApiTab] = useState<StandardApiTab | null>(null);
  const [upperToolTab, setUpperToolTab] = useState<UpperToolTab | null>(null);
  const [academicPosterTab, setAcademicPosterTab] = useState<AcademicPosterTab | null>(null);
  const [academicPosterDocId, setAcademicPosterDocId] = useState<string | null>(null);
  const [multimodalBuildFocus, setMultimodalBuildFocus] = useState<MultimodalDatasetFocus | null>(null);
  const [graphFusionFocus, setGraphFusionFocus] = useState<GraphFusionFocus | null>(null);
  const [entityLinkJudgmentFocus, setEntityLinkJudgmentFocus] = useState<EntityLinkJudgmentFocus | null>(null);
  const [linkAnnotationFocus, setLinkAnnotationFocus] = useState<LinkAnnotationFocus | null>(null);
  const [literatureReaderFocus, setLiteratureReaderFocus] = useState<LiteratureReaderFocus | null>(null);
  const [crossLingualFocus, setCrossLingualFocus] = useState<CrossLingualFocus | null>(null);
  const [crossLingualQueryFocus, setCrossLingualQueryFocus] = useState<CrossLingualQueryFocus | null>(null);
  const [crossLingualAttributeFocus, setCrossLingualAttributeFocus] = useState<CrossLingualAttributeFocus | null>(null);
  const [crossLingualKbFocus, setCrossLingualKbFocus] = useState<CrossLingualKbFocus | null>(null);
  const [entityMatchingDisambiguationFocus, setEntityMatchingDisambiguationFocus] = useState<EntityMatchingDisambiguationFocus | null>(null);
  const [representationSpaceFocus, setRepresentationSpaceFocus] = useState<RepresentationSpaceFocus | null>(null);
  const [scoringFunctionFocus, setScoringFunctionFocus] = useState<ScoringFunctionFocus | null>(null);
  const [encodingModelFocus, setEncodingModelFocus] = useState<EncodingModelFocus | null>(null);
  const [supervisedSimilarityFocus, setSupervisedSimilarityFocus] = useState<SupervisedSimilarityFocus | null>(null);
  const [nodeSimilarityFocus, setNodeSimilarityFocus] = useState<NodeSimilarityFocus | null>(null);
  const [semanticRetrievalFocus, setSemanticRetrievalFocus] = useState<SemanticRetrievalFocus | null>(null);
  const [multimodalRepresentationFocus, setMultimodalRepresentationFocus] = useState<MultimodalRepresentationFocus | null>(null);
  const [callLogsFocus, setCallLogsFocus] = useState<CallLogsFocus | null>(null);
  const [relationReasoningFocus, setRelationReasoningFocus] = useState<RelationReasoningFocus | null>(null);
  const [humanMachineReviewFocus, setHumanMachineReviewFocus] = useState<HumanMachineReviewFocus | null>(null);
  const [knowledgeSearchFocus, setKnowledgeSearchFocus] = useState<KnowledgeSearchFocus | null>(null);
  const [propertyManagementTab, setPropertyManagementTab] = useState<PropertyManagementTab | null>(null);
  const [propertyManagementFocus, setPropertyManagementFocus] = useState<PropertyManagementFocus | null>(null);
  const [appCenterFocus, setAppCenterFocus] = useState<AppCenterFocus | null>(null);
  const [appCenterAssistantId, setAppCenterAssistantId] = useState<string | null>(null);
  const [associationStrengthFocus, setAssociationStrengthFocus] = useState<AssociationStrengthFocus | null>(null);
  const [datasetCategoryTab, setDatasetCategoryTab] = useState<DatasetCategoryTab | null>(null);
  const [datasetCategoryFocus, setDatasetCategoryFocus] = useState<DatasetCategoryFocus | null>(null);

  const resolveDataSourceView = (pagePath: string): DSMode => {
    if (pagePath.includes('外部词典导入')) return 'lexicon';
    if (pagePath.includes('种子实例') || pagePath.includes('种子集管理')) return 'seed';
    return 'structured';
  };

  const clearAlgorithmExtras = () => {
    setAlgorithmDemoTab(null);
    setAlgorithmInitialTab(null);
    setAutoStartDepTest(false);
    setAutoStartOpenClipTraining(false);
    setGraphStrategyFocus(null);
    setGraphConstructionAutoTask(false);
    setRuleEditorMode(null);
    setRuleDrawerFocus(null);
    setRuleListFocus(null);
    setRuleCategoryFilter(null);
    setHumanReviewTab(null);
    setEventReviewSubTab(null);
    setKgReviewConsensusFocus(false);
    setRecognitionFocus(null);
    setTemporalAuditMode(null);
    setGraphVizDockFocus(null);
    setIntegratedWorkbenchModule(null);
    setPatternPreviewFocus(null);
    setRuleLearningTab(null);
    setDualFactorRankFocus(null);
    setTermConfidenceGraphFocus(null);
    setQuadrupleStructureFocus(null);
    setLiteratureParseFocus(null);
    setPatentParseFocus(null);
    setLocalLearningTab(null);
    setEventAnnotationMgmtTab(null);
    setGraphTasksDashTab(null);
    setEntityAttrApiTab(null);
    setMappingNormalizeFocus(false);
    setOntologyModelFocus(null);
    setMappingViewMode(null);
    setMultiFormatLitTab(null);
    setMultimodalFocus(null);
    setLlmSemanticFocus(null);
    setSciCoreFocus(null);
    setStandardApiTab(null);
    setUpperToolTab(null);
    setAcademicPosterTab(null);
    setAcademicPosterDocId(null);
    setMultimodalBuildFocus(null);
    setGraphFusionFocus(null);
    setEntityLinkJudgmentFocus(null);
    setLinkAnnotationFocus(null);
    setLiteratureReaderFocus(null);
    setCrossLingualFocus(null);
    setCrossLingualQueryFocus(null);
    setCrossLingualAttributeFocus(null);
    setCrossLingualKbFocus(null);
    setEntityMatchingDisambiguationFocus(null);
    setRepresentationSpaceFocus(null);
    setScoringFunctionFocus(null);
    setEncodingModelFocus(null);
    setSupervisedSimilarityFocus(null);
    setNodeSimilarityFocus(null);
    setSemanticRetrievalFocus(null);
    setMultimodalRepresentationFocus(null);
    setCallLogsFocus(null);
    setRelationReasoningFocus(null);
    setHumanMachineReviewFocus(null);
    setKnowledgeSearchFocus(null);
    setPropertyManagementTab(null);
    setPropertyManagementFocus(null);
    setAppCenterFocus(null);
    setAppCenterAssistantId(null);
    setAssociationStrengthFocus(null);
    setDatasetCategoryTab(null);
    setDatasetCategoryFocus(null);
  };

  const handleNavigate = (page: string, options?: {
    docId?: string;
    literatureReaderFocus?: LiteratureReaderFocus;
    academicPosterTab?: AcademicPosterTab;
  }) => {
    if (page === 'kg-datasource') setDataSourceView('structured');
    if (page !== 'algorithm-detail') clearAlgorithmExtras();
    setCallLogsFocus(null);
    setRelationReasoningFocus(null);
    setHumanMachineReviewFocus(null);
    setKnowledgeSearchFocus(null);
    setPropertyManagementTab(null);
    setPropertyManagementFocus(null);
    setAppCenterFocus(null);
    setAppCenterAssistantId(null);
    setMultimodalBuildFocus(null);
    setLiteratureReaderFocus(options?.literatureReaderFocus ?? null);
    setAcademicPosterTab(options?.academicPosterTab ?? null);
    setAcademicPosterDocId(options?.docId ?? null);
    setCurrentPage(page);
  };

  const handleAuditFeatureSelect = (feature: AuditFeatureSelection, pageId: string | null) => {
    setSelectedAuditFeature(feature);
    // 审计专用独立页优先（不与产品页共用）
    if (pageId === 'interactive-review-adoption' || pageId === 'concept-cooccurrence-index' || pageId === 'hypernym-generation-audit' || pageId === 'knowledge-consistency-validation' || pageId === 'high-performance-inference-kernel' || pageId === 'fact-change-listening' || pageId === 'inference-task-management' || pageId === 'api-integration-inference' || pageId === 'time-entity-normalization' || pageId === 'future-state-prediction' || pageId === 'temporal-relation-audit' || pageId === 'literature-multidim-parse' || pageId === 'patent-technical-parse' || pageId === 'patent-module-decomposition' || pageId === 'patent-literature-match' || pageId === 'similarity-computation-engine' || pageId === 'kg-integrated-workbench' || pageId === 'corpus-selection-config' || pageId === 'context-pattern-extraction-engine' || pageId === 'pattern-preview-management' || pageId === 'pattern-application-engine' || pageId === 'new-instance-extraction' || pageId === 'instance-confidence-evaluation' || pageId === 'pending-instance-review' || pageId === 'entity-alignment-disambiguation' || pageId === 'batch-instance-ingest' || pageId === 'rule-learning-workbench' || pageId === 'dual-factor-rank' || pageId === 'term-confidence-graph' || pageId === 'quadruple-structure' || pageId === 'local-learning-annotator' || pageId === 'event-annotation-mgmt' || pageId === 'event-ingest-workflow' || pageId === 'entity-attr-api' || pageId === 'text-highlight-seed' || pageId === 'mapping-transform-fn' || pageId === 'attribute-precise-extract' || pageId === 'multi-format-lit-parse' || pageId === 'multimodal-content-transcribe' || pageId === 'llm-semantic-refine' || pageId === 'sci-core-tuple-extract' || pageId === 'standard-graph-api' || pageId === 'upper-intelligent-tools' || pageId === 'text-instance-matching' || pageId === 'structure-instance-matching' || pageId === 'instance-feature-engineering' || pageId === 'text-entity-recognition' || pageId === 'candidate-entity-generation' || pageId === 'entity-link-judgment' || pageId === 'link-annotation-mapping' || pageId === 'cross-lingual-instance-matching' || pageId === 'cross-lingual-query-fusion' || pageId === 'cross-lingual-attribute-alignment' || pageId === 'cross-lingual-kb-alignment' || pageId === 'entity-matching-disambiguation') {
      if (pageId === 'temporal-relation-audit') {
        setTemporalAuditMode(resolveTemporalAuditMode(feature.pagePath) ?? 'extraction');
      }
      if (pageId === 'literature-multidim-parse') {
        setLiteratureParseFocus(resolveLiteratureParseFocus(feature.pagePath));
      }
      if (pageId === 'patent-technical-parse') {
        setPatentParseFocus(resolvePatentParseFocus(feature.pagePath));
      }
      if (pageId === 'local-learning-annotator') {
        setLocalLearningTab(resolveLocalLearningTab(feature.pagePath) ?? 'local');
      }
      if (pageId === 'event-annotation-mgmt') {
        setEventAnnotationMgmtTab(resolveEventAnnotationMgmtTab(feature.pagePath) ?? 'projects');
      }
      if (pageId === 'kg-integrated-workbench') {
        setIntegratedWorkbenchModule(resolveIntegratedWorkbenchModule(feature.pagePath));
      }
      if (pageId === 'pattern-preview-management') {
        setPatternPreviewFocus(resolvePatternPreviewFocus(feature.pagePath) ?? 'preview');
      }
      if (pageId === 'rule-learning-workbench') {
        setRuleLearningTab(resolveRuleLearningTab(feature.pagePath) ?? 'embedding');
      }
      if (pageId === 'dual-factor-rank') {
        setDualFactorRankFocus(resolveDualFactorRankFocus(feature.pagePath));
      }
      if (pageId === 'term-confidence-graph') {
        setTermConfidenceGraphFocus(resolveTermConfidenceGraphFocus(feature.pagePath));
      }
      if (pageId === 'quadruple-structure') {
        setQuadrupleStructureFocus(resolveQuadrupleStructureFocus(feature.pagePath));
      }
      if (pageId === 'entity-attr-api') {
        setEntityAttrApiTab(resolveEntityAttrApiTab(feature.pagePath) ?? 'single');
      }
      if (pageId === 'multi-format-lit-parse') {
        setMultiFormatLitTab(resolveMultiFormatLitTab(feature.pagePath) ?? 'pdf');
      }
      if (pageId === 'multimodal-content-transcribe') {
        setMultimodalFocus(resolveMultimodalTranscribeFocus(feature.pagePath));
      }
      if (pageId === 'llm-semantic-refine') {
        setLlmSemanticFocus(resolveLlmSemanticFocus(feature.pagePath));
      }
      if (pageId === 'sci-core-tuple-extract') {
        setSciCoreFocus(resolveSciCoreFocus(feature.pagePath));
      }
      if (pageId === 'standard-graph-api') {
        setStandardApiTab(resolveStandardApiTab(feature.pagePath) ?? 'query');
      }
      if (pageId === 'upper-intelligent-tools') {
        setUpperToolTab(resolveUpperToolTab(feature.pagePath) ?? 'analogy');
      }
      if (pageId === 'text-entity-recognition') {
        setRecognitionFocus(resolveTextEntityRecognitionFocus(feature.pagePath));
      }
      if (pageId === 'entity-link-judgment') {
        setEntityLinkJudgmentFocus(resolveEntityLinkJudgmentFocus(feature.pagePath));
      }
      if (pageId === 'link-annotation-mapping') {
        setLinkAnnotationFocus(resolveLinkAnnotationFocus(feature.pagePath));
      }
      if (pageId === 'cross-lingual-instance-matching') {
        setCrossLingualFocus(resolveCrossLingualFocus(feature.pagePath));
      }
      if (pageId === 'cross-lingual-query-fusion') {
        setCrossLingualQueryFocus(resolveCrossLingualQueryFocus(feature.pagePath));
      }
      if (pageId === 'cross-lingual-attribute-alignment') {
        setCrossLingualAttributeFocus(resolveCrossLingualAttributeFocus(feature.pagePath));
      }
      if (pageId === 'cross-lingual-kb-alignment') {
        setCrossLingualKbFocus(resolveCrossLingualKbFocus(feature.pagePath));
      }
      if (pageId === 'entity-matching-disambiguation') {
        setEntityMatchingDisambiguationFocus(resolveEntityMatchingDisambiguationFocus(feature.pagePath));
      }
      setCurrentPage(pageId);
      return;
    }
    const algorithmId = resolveAuditAlgorithmId(feature.pagePath);
    if (algorithmId) {
      setSelectedAlgorithmId(algorithmId);
      setAlgorithmDemoTab(resolveAuditAlgorithmDemoTab(feature.pagePath));
      setAlgorithmInitialTab(resolveAuditAlgorithmTab(feature.pagePath));
      setRepresentationSpaceFocus(
        algorithmId === 'representation-space'
          ? resolveRepresentationSpaceFocus(feature.pagePath)
          : null,
      );
      setScoringFunctionFocus(
        algorithmId === 'scoring-function'
          ? resolveScoringFunctionFocus(feature.pagePath)
          : null,
      );
      setEncodingModelFocus(
        algorithmId === 'encoding-model'
          ? resolveEncodingModelFocus(feature.pagePath)
          : null,
      );
      setSupervisedSimilarityFocus(
        algorithmId === 'supervised-similarity'
          ? resolveSupervisedSimilarityFocus(feature.pagePath)
          : null,
      );
      setNodeSimilarityFocus(
        algorithmId === 'node-similarity'
          ? resolveNodeSimilarityFocus(feature.pagePath)
          : null,
      );
      setSemanticRetrievalFocus(
        algorithmId === 'semantic-retrieval'
          ? resolveSemanticRetrievalFocus(feature.pagePath)
          : null,
      );
      setMultimodalRepresentationFocus(
        algorithmId === 'multimodal-representation'
          ? resolveMultimodalRepresentationFocus(feature.pagePath)
          : null,
      );
      setAutoStartOpenClipTraining(
        algorithmId === 'open-clip'
          ? resolveOpenClipAutoStartTraining(feature.pagePath)
          : false,
      );
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
      setGraphStrategyFocus(resolveGraphStrategyFocus(feature.pagePath));
      setGraphConstructionAutoTask(resolveGraphConstructionAutoTask(feature.pagePath));
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
      setKgReviewConsensusFocus(resolveKgReviewConsensusFocus(feature.pagePath));
      setRecognitionFocus(resolveRecognitionFocus(feature.pagePath));
      setCurrentPage('human-review');
      return;
    }
    if (pageId === 'graph-tasks') {
      setGraphTasksDashTab(resolveGraphTasksDashTab(feature.pagePath));
      setCurrentPage('graph-tasks');
      return;
    }
    if (pageId === 'academic-poster') {
      setAcademicPosterTab(resolveAcademicPosterTab(feature.pagePath) ?? 'poster');
      setAcademicPosterDocId(null);
      setCurrentPage('academic-poster');
      return;
    }
    if (pageId === 'multimodal-dataset') {
      setMultimodalBuildFocus(resolveMultimodalDatasetFocus(feature.pagePath));
      setCurrentPage('multimodal-dataset');
      return;
    }
    if (pageId === 'dataset-category-detail') {
      setSelectedDatasetCategoryId(resolveDatasetCategoryId(feature.pagePath) ?? 'entity-similarity');
      setDatasetCategoryTab(resolveDatasetCategoryTab(feature.pagePath));
      setDatasetCategoryFocus(resolveDatasetCategoryFocus(feature.pagePath));
      setCurrentPage('dataset-category-detail');
      return;
    }
    if (pageId === 'knowledge-graph-dashboard') {
      setAssociationStrengthFocus(resolveAssociationStrengthFocus(feature.pagePath));
      setCurrentPage('knowledge-graph-dashboard');
      return;
    }
    if (pageId === 'call-logs') {
      setCallLogsFocus(resolveCallLogsFocus(feature.pagePath));
      setCurrentPage('call-logs');
      return;
    }
    if (pageId === 'relation-reasoning') {
      setRelationReasoningFocus(resolveRelationReasoningFocus(feature.pagePath));
      setCurrentPage('relation-reasoning');
      return;
    }
    if (pageId === 'human-machine-review') {
      setHumanMachineReviewFocus(resolveHumanMachineReviewFocus(feature.pagePath));
      setCurrentPage('human-machine-review');
      return;
    }
    if (pageId === 'knowledge-search') {
      setKnowledgeSearchFocus(resolveKnowledgeSearchFocus(feature.pagePath));
      setCurrentPage('knowledge-search');
      return;
    }
    if (pageId === 'property-management') {
      setPropertyManagementTab(resolvePropertyManagementTab(feature.pagePath));
      setPropertyManagementFocus(resolvePropertyManagementFocus(feature.pagePath));
      setCurrentPage('property-management');
      return;
    }
    if (pageId === 'llm-api-integration') {
      setCurrentPage('llm-api-integration');
      return;
    }
    if (pageId === 'app-center') {
      setAppCenterFocus(resolveAppCenterFocus(feature.pagePath));
      setAppCenterAssistantId(resolveAppCenterAssistantId(feature.pagePath));
      setCurrentPage('app-center');
      return;
    }
    if (pageId === 'graph-fusion') {
      setGraphFusionFocus(resolveGraphFusionFocus(feature.pagePath));
      setCurrentPage('graph-fusion');
      return;
    }
    if (pageId === 'graph-visualization') {
      setGraphVizDockFocus(resolveGraphVizDockFocus(feature.pagePath));
      setCurrentPage('graph-visualization');
      return;
    }
    if (pageId === 'kg-mapping') {
      setMappingNormalizeFocus((feature.pagePath ?? '').includes('属性值标准化与清洗'));
      setMappingViewMode(resolveMappingViewMode(feature.pagePath) ?? 'list');
      setCurrentPage('kg-mapping');
      return;
    }
    if (pageId === 'kg-ontology') {
      setOntologyModelFocus(resolveOntologyModelFocus(feature.pagePath));
      setCurrentPage('kg-ontology');
      return;
    }
    if (pageId === 'literature-reader') {
      setLiteratureReaderFocus(resolveLiteratureReaderFocus(feature.pagePath));
      setCurrentPage('literature-reader');
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
        return (
          <KnowledgeGraphDashboard
            key={associationStrengthFocus ?? 'default'}
            initialAssociationFocus={associationStrengthFocus ?? undefined}
          />
        );
      case 'graph-fusion':
        return (
          <GraphFusion
            key={graphFusionFocus ?? 'default'}
            initialFocus={graphFusionFocus}
          />
        );
      case 'schema-constraint-rules':
        return <SchemaConstraintRulesPage />;
      case 'data-consistency-scan':
        return <DataConsistencyScan onNavigateTo={handleNavigate} />;
      case 'validation-report':
        return <ValidationReportPage />;
      case 'completion-result-review':
        return <CompletionResultReviewPage />;
      case 'text-entity-localization':
        return <TextEntityLocalizationPage />;
      case 'visual-entity-localization':
        return <VisualEntityLocalizationPage />;
      case 'text-concept-localization':
        return <TextConceptLocalizationPage />;
      case 'visual-concept-localization':
        return <VisualConceptLocalizationPage />;
      case 'relation-localization':
        return <RelationLocalizationPage />;
      case 'text-relation-localization':
        return <TextRelationLocalizationPage />;
      case 'visual-relation-localization':
        return <VisualRelationLocalizationPage />;
      case 'property-management':
        return (
          <PropertyManagement
            key={`${propertyManagementTab ?? 'entity'}-${propertyManagementFocus ?? 'plain'}`}
            initialTab={propertyManagementTab ?? undefined}
            initialFocus={propertyManagementFocus ?? undefined}
          />
        );
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
            key={`${selectedAlgorithmId}-${representationSpaceFocus ?? scoringFunctionFocus ?? encodingModelFocus ?? supervisedSimilarityFocus ?? nodeSimilarityFocus ?? semanticRetrievalFocus ?? multimodalRepresentationFocus ?? (autoStartOpenClipTraining ? 'open-clip-auto' : 'all')}`}
            algorithmId={selectedAlgorithmId}
            onBack={handleBackToAlgorithmList}
            initialDemoTab={selectedAlgorithmId === 'candidate-term-generation' ? algorithmDemoTab ?? undefined : undefined}
            initialTab={algorithmInitialTab ?? undefined}
            autoStartDepTest={selectedAlgorithmId === 'dependency-graph' ? autoStartDepTest : false}
            initialEmbeddingSpace={
              selectedAlgorithmId === 'representation-space' && representationSpaceFocus && representationSpaceFocus !== 'config'
                ? representationSpaceFocus
                : undefined
            }
            initialScoringFunctionSection={
              selectedAlgorithmId === 'scoring-function' && scoringFunctionFocus
                ? scoringFunctionFocus
                : undefined
            }
            initialEncodingModelFocus={
              selectedAlgorithmId === 'encoding-model' && encodingModelFocus
                ? encodingModelFocus
                : undefined
            }
            initialSupervisedSimilarityFocus={
              selectedAlgorithmId === 'supervised-similarity' && supervisedSimilarityFocus
                ? supervisedSimilarityFocus
                : undefined
            }
            initialNodeSimilarityFocus={
              selectedAlgorithmId === 'node-similarity' && nodeSimilarityFocus
                ? nodeSimilarityFocus
                : undefined
            }
            initialSemanticRetrievalFocus={
              selectedAlgorithmId === 'semantic-retrieval' && semanticRetrievalFocus
                ? semanticRetrievalFocus
                : undefined
            }
            initialMultimodalRepresentationFocus={
              selectedAlgorithmId === 'multimodal-representation' && multimodalRepresentationFocus
                ? multimodalRepresentationFocus
                : undefined
            }
            autoStartOpenClipTraining={
              selectedAlgorithmId === 'open-clip' ? autoStartOpenClipTraining : false
            }
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
        return (
          <MultimodalDatasetManagement
            key={multimodalBuildFocus ?? 'default'}
            initialFocus={multimodalBuildFocus}
          />
        );
      case 'dataset-category-detail':
        return selectedDatasetCategoryId ? (
          <DatasetCategoryDetail
            key={`${selectedDatasetCategoryId}-${datasetCategoryTab ?? 'list'}-${datasetCategoryFocus ?? 'all'}`}
            categoryId={selectedDatasetCategoryId}
            onBack={handleBackToDatasetCategories}
            initialTab={datasetCategoryTab ?? undefined}
            initialFocus={datasetCategoryFocus ?? undefined}
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
        return <ApiCallLogs key={callLogsFocus ?? 'all'} focusContext={callLogsFocus ?? undefined} />;
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
      case 'high-performance-inference-kernel':
        return <HighPerformanceInferenceKernel />;
      case 'fact-change-listening':
        return <FactChangeListening />;
      case 'inference-task-management':
        return <InferenceTaskManagement />;
      case 'api-integration-inference':
        return <ApiIntegrationInference />;
      case 'time-entity-normalization':
        return <TimeEntityNormalization />;
      case 'future-state-prediction':
        return <FutureStatePrediction />;
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
      case 'patent-technical-parse':
        return (
          <PatentTechnicalElementParse
            key={patentParseFocus ?? 'all'}
            initialFocus={patentParseFocus ?? undefined}
          />
        );
      case 'patent-module-decomposition':
        return <PatentModuleDecomposition />;
      case 'patent-literature-match':
        return <PatentLiteratureMatch />;
      case 'local-learning-annotator':
        return (
          <LocalLearningAnnotator
            key={localLearningTab ?? 'local'}
            initialTab={localLearningTab ?? 'local'}
          />
        );
      case 'entity-attr-api':
        return (
          <EntityAttributeExtractApi
            key={entityAttrApiTab ?? 'single'}
            initialTab={entityAttrApiTab ?? 'single'}
          />
        );
      case 'text-highlight-seed':
        return <TextHighlightSeedAnnotator />;
      case 'event-annotation-mgmt':
        return (
          <EventAnnotationManagement
            key={eventAnnotationMgmtTab ?? 'projects'}
            initialTab={eventAnnotationMgmtTab ?? 'projects'}
          />
        );
      case 'event-ingest-workflow':
        return <EventIngestWorkflow />;
      case 'human-review':
        return (
          <HumanReview
            key={`${humanReviewTab ?? 'default'}-${eventReviewSubTab ?? 'none'}-${kgReviewConsensusFocus ? 'consensus' : 'plain'}-${recognitionFocus ?? 'none'}`}
            initialTopTab={humanReviewTab ?? undefined}
            initialEventSubTab={eventReviewSubTab ?? undefined}
            focusConsensus={kgReviewConsensusFocus || undefined}
            initialRecognitionFocus={recognitionFocus ?? undefined}
          />
        );
      case 'kg-ontology':
        return (
          <OntologyManagement
            key={ontologyModelFocus ?? 'default'}
            initialModelFocus={ontologyModelFocus ?? undefined}
          />
        );
      case 'kg-mapping':
        return (
          <MappingManagement
            key={`${mappingViewMode ?? 'list'}-${mappingNormalizeFocus ? 'normalize' : 'plain'}`}
            focusNormalize={mappingNormalizeFocus || undefined}
            initialViewMode={mappingViewMode ?? undefined}
          />
        );
      case 'mapping-transform-fn':
        return <MappingTransformFunction />;
      case 'attribute-precise-extract':
        return <AttributePreciseExtract />;
      case 'multi-format-lit-parse':
        return (
          <MultiFormatLiteratureParse
            key={multiFormatLitTab ?? 'pdf'}
            initialTab={multiFormatLitTab ?? 'pdf'}
          />
        );
      case 'multimodal-content-transcribe':
        return (
          <MultimodalContentTranscribe
            key={multimodalFocus ?? 'all'}
            initialFocus={multimodalFocus}
          />
        );
      case 'llm-semantic-refine':
        return (
          <LlmSemanticRefine
            key={llmSemanticFocus ?? 'all'}
            initialFocus={llmSemanticFocus}
          />
        );
      case 'sci-core-tuple-extract':
        return (
          <SciCoreTupleExtract
            key={sciCoreFocus ?? 'all'}
            initialFocus={sciCoreFocus}
          />
        );
      case 'standard-graph-api':
        return (
          <StandardGraphApiServices
            key={standardApiTab ?? 'query'}
            initialTab={standardApiTab ?? 'query'}
          />
        );
      case 'upper-intelligent-tools':
        return (
          <UpperIntelligentTools
            key={upperToolTab ?? 'analogy'}
            initialTab={upperToolTab ?? 'analogy'}
          />
        );
      case 'similarity-computation-engine':
        return <SimilarityComputationEngine />;
      case 'kg-integrated-workbench':
        return (
          <KgIntegratedWorkbench
            key={integratedWorkbenchModule ?? 'all'}
            initialModule={integratedWorkbenchModule}
            onNavigate={handleNavigate}
          />
        );
      case 'corpus-selection-config':
        return <CorpusSelectionConfig />;
      case 'context-pattern-extraction-engine':
        return <ContextPatternExtractionEngine />;
      case 'pattern-preview-management':
        return (
          <PatternPreviewManagement
            key={patternPreviewFocus ?? 'preview'}
            initialFocus={patternPreviewFocus ?? 'preview'}
          />
        );
      case 'pattern-application-engine':
        return <PatternApplicationEngine />;
      case 'new-instance-extraction':
        return <NewInstanceExtraction />;
      case 'instance-confidence-evaluation':
        return <InstanceConfidenceEvaluation />;
      case 'pending-instance-review':
        return <PendingInstanceReview />;
      case 'entity-alignment-disambiguation':
        return <EntityAlignmentDisambiguation />;
      case 'batch-instance-ingest':
        return <BatchInstanceIngest />;
      case 'rule-learning-workbench':
        return (
          <RuleLearningWorkbench
            key={ruleLearningTab ?? 'embedding'}
            initialTab={ruleLearningTab ?? 'embedding'}
          />
        );
      case 'dual-factor-rank':
        return (
          <DualFactorRankApi
            key={dualFactorRankFocus ?? 'all'}
            initialFocus={dualFactorRankFocus}
          />
        );
      case 'term-confidence-graph':
        return (
          <TermConfidenceGraphApi
            key={termConfidenceGraphFocus ?? 'all'}
            initialFocus={termConfidenceGraphFocus}
          />
        );
      case 'quadruple-structure':
        return (
          <QuadrupleStructureApi
            key={quadrupleStructureFocus ?? 'all'}
            initialFocus={quadrupleStructureFocus}
          />
        );
      case 'text-instance-matching':
        return <TextInstanceMatching />;
      case 'structure-instance-matching':
        return <StructureInstanceMatching />;
      case 'instance-feature-engineering':
        return <InstanceFeatureEngineering />;
      case 'text-entity-recognition':
        return (
          <TextEntityRecognition
            key={recognitionFocus ?? 'all'}
            initialFocus={recognitionFocus}
          />
        );
      case 'candidate-entity-generation':
        return <CandidateEntityGeneration />;
      case 'entity-link-judgment':
        return (
          <EntityLinkJudgment
            key={entityLinkJudgmentFocus ?? 'all'}
            initialFocus={entityLinkJudgmentFocus}
          />
        );
      case 'link-annotation-mapping':
        return (
          <LinkAnnotationMapping
            key={linkAnnotationFocus ?? 'all'}
            initialFocus={linkAnnotationFocus}
          />
        );
      case 'cross-lingual-instance-matching':
        return (
          <CrossLingualInstanceMatching
            key={crossLingualFocus ?? 'all'}
            initialFocus={crossLingualFocus}
          />
        );
      case 'cross-lingual-query-fusion':
        return (
          <CrossLingualQueryFusion
            key={crossLingualQueryFocus ?? 'all'}
            initialFocus={crossLingualQueryFocus}
          />
        );
      case 'cross-lingual-attribute-alignment':
        return (
          <CrossLingualAttributeAlignment
            key={crossLingualAttributeFocus ?? 'all'}
            initialFocus={crossLingualAttributeFocus}
          />
        );
      case 'cross-lingual-kb-alignment':
        return (
          <CrossLingualKbAlignment
            key={crossLingualKbFocus ?? 'all'}
            initialFocus={crossLingualKbFocus}
          />
        );
      case 'entity-matching-disambiguation':
        return (
          <EntityMatchingDisambiguation
            key={entityMatchingDisambiguationFocus ?? 'all'}
            initialFocus={entityMatchingDisambiguationFocus}
          />
        );
      case 'kg-datasource':
        return <DataSourceManagement key={dataSourceView} viewMode={dataSourceView} />;
      case 'graph-construction':
        return (
          <GraphConstruction
            key={`${graphConstructionTab ?? 'default'}-${graphStrategyFocus ?? 'none'}-${graphConstructionAutoTask ? 'auto' : 'plain'}`}
            onNavigateTo={setCurrentPage}
            initialTab={graphConstructionTab ?? undefined}
            initialStrategyFocus={graphStrategyFocus ?? undefined}
            focusAutoTask={graphConstructionAutoTask || undefined}
          />
        );
      case 'graph-tasks':
        return (
          <GraphTasks
            key={graphTasksDashTab ?? 'default'}
            onNavigateTo={setCurrentPage}
            initialDashTab={
              graphTasksDashTab === 'candidates'
                ? 'candidates'
                : graphTasksDashTab === 'version-rollback'
                  ? 'changeset'
                : graphTasksDashTab === 'monitor' || graphTasksDashTab === 'logs'
                  ? 'monitor'
                  : undefined
            }
            focusTaskLogs={graphTasksDashTab === 'logs' || undefined}
            initialOpenExport={
              graphTasksDashTab === 'export-rdf' || graphTasksDashTab === 'export-formats' || undefined
            }
            exportFocus={
              graphTasksDashTab === 'export-rdf'
                ? 'rdf'
                : graphTasksDashTab === 'export-formats'
                  ? 'formats'
                  : undefined
            }
            initialOpenCustomUpload={graphTasksDashTab === 'custom-upload' || undefined}
            focusIncremental={graphTasksDashTab === 'incremental-update' || undefined}
            focusVersionRollback={graphTasksDashTab === 'version-rollback' || undefined}
          />
        );
      case 'verified-knowledge-write':
        return <VerifiedKnowledgeWritePage />;
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
        return <KnowledgeBase onNavigate={handleNavigate} />;
      case 'knowledge-search':
        return (
          <KnowledgeSearch
            key={knowledgeSearchFocus ?? 'default'}
            initialFocus={knowledgeSearchFocus ?? undefined}
          />
        );
      case 'knowledge-repository':
        return <KnowledgeRepository />;
      case 'literature-processing':
        return <LiteratureProcessing />;
      case 'literature-reader':
        return (
          <LiteratureReader
            key={literatureReaderFocus ?? 'default'}
            initialFocus={literatureReaderFocus}
          />
        );
      case 'patent-processing':
        return <PatentProcessing />;
      case 'api-keys':
        return <ApiKeyManagement />;
      case 'app-center':
        return (
          <ApplicationCenter
            key={`${appCenterAssistantId ?? 'default'}-${appCenterFocus ?? 'all'}`}
            initialAssistantId={appCenterAssistantId ?? undefined}
            initialFocus={appCenterFocus ?? undefined}
          />
        );
      case 'graph-visualization':
        return (
          <GraphVisualization
            key={graphVizDockFocus ?? 'default'}
            initialDockTab={graphVizDockFocus}
          />
        );
      case 'evolution-analysis':
        return <EvolutionAnalysis />;
      case 'vertical-domain-graph':
        return <VerticalDomainGraph />;
      case 'relation-analysis':
        return <RelationAnalysis />;
      case 'inference-prediction':
        return <InferencePrediction />;
      case 'relation-reasoning':
        return (
          <RelationReasoningPage
            key={relationReasoningFocus ?? 'all'}
            initialFocus={relationReasoningFocus ?? undefined}
          />
        );
      case 'human-machine-review':
        return (
          <HumanMachineReviewPage
            key={humanMachineReviewFocus ?? 'queue'}
            initialFocus={humanMachineReviewFocus ?? undefined}
          />
        );
      case 'llm-api-integration':
        return <LlmApiIntegrationPage />;
      case 'decision-support':
        return <DecisionSupport />;
      case 'knowledge-validation':
        return <KnowledgeValidation />;
      case 'academic-poster':
        return (
          <AcademicPoster
            key={`${academicPosterTab ?? 'poster'}-${academicPosterDocId ?? 'none'}`}
            initialTab={academicPosterTab ?? 'poster'}
            initialDocId={academicPosterDocId ?? undefined}
          />
        );
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
      <main className={`flex-1 overflow-hidden flex flex-col ${['app-center', 'graph-visualization', 'evolution-analysis', 'vertical-domain-graph', 'knowledge-search', 'literature-reader', 'knowledge-base', 'academic-poster', 'kg-ontology', 'kg-datasource', 'kg-mapping', 'graph-construction', 'graph-tasks', 'human-review', 'human-machine-review', 'graph-fusion', 'property-management', 'schema-constraint-rules', 'data-consistency-scan', 'validation-report', 'completion-result-review', 'text-entity-localization', 'visual-entity-localization', 'text-concept-localization', 'visual-concept-localization', 'relation-localization', 'text-relation-localization', 'visual-relation-localization', 'multimodal-dataset', 'candidate-entity-generation', 'link-annotation-mapping', 'entity-matching-disambiguation', 'fact-change-listening', 'inference-task-management', 'corpus-selection-config', 'pattern-preview-management', 'pending-instance-review', 'entity-alignment-disambiguation', 'batch-instance-ingest', 'rule-learning-workbench', 'audit-feature'].includes(currentPage) ? '' : 'p-8 overflow-y-auto'}`}>
        <div className={['app-center', 'graph-visualization', 'evolution-analysis', 'vertical-domain-graph', 'knowledge-search', 'literature-reader', 'knowledge-base', 'academic-poster', 'kg-ontology', 'kg-datasource', 'kg-mapping', 'graph-construction', 'graph-tasks', 'human-review', 'human-machine-review', 'graph-fusion', 'property-management', 'schema-constraint-rules', 'data-consistency-scan', 'validation-report', 'completion-result-review', 'text-entity-localization', 'visual-entity-localization', 'text-concept-localization', 'visual-concept-localization', 'relation-localization', 'text-relation-localization', 'visual-relation-localization', 'multimodal-dataset', 'candidate-entity-generation', 'link-annotation-mapping', 'entity-matching-disambiguation', 'fact-change-listening', 'inference-task-management', 'corpus-selection-config', 'pattern-preview-management', 'pending-instance-review', 'entity-alignment-disambiguation', 'batch-instance-ingest', 'rule-learning-workbench', 'audit-feature'].includes(currentPage) ? 'h-full flex flex-col' : ''}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}