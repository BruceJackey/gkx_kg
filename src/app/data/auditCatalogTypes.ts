export type AuditCatalogNodeType =
  | 'root'
  | 'level1'
  | 'level2'
  | 'level3'
  | 'level4'
  | 'level5'
  | 'feature';

export interface AuditCatalogNode {
  id: string;
  name: string;
  type: AuditCatalogNodeType;
  children?: AuditCatalogNode[];
  reqId?: string;
  pagePath?: string;
  featureDesc?: string;
  auditNote?: string;
}

export interface AuditFeatureSelection {
  id: string;
  name: string;
  reqId: string;
  pagePath: string;
  featureDesc: string;
  auditNote: string;
  /** 一至五级路径，用于面包屑展示 */
  pathLabels: string[];
}
