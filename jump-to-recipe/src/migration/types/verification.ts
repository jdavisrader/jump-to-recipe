/**
 * Type definitions for verification phase
 */

export interface VerificationConfig {
  legacyDb: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  newDb: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  ssh?: {
    host: string;
    port: number;
    username: string;
    privateKeyPath: string;
  };
  spotCheckCount: number; // Number of random recipes to verify
  importedDataDir: string; // Directory with import reports and mappings
}

export interface RecordCountComparison {
  table: string;
  legacyCount: number;
  newCount: number;
  difference: number;
  percentageMatch: number;
  status: 'match' | 'mismatch' | 'warning';
}

export interface SpotCheckResult {
  recipeId: string;
  legacyId: number;
  title: string;
  checks: {
    titleMatch: boolean;
    ingredientCountMatch: boolean;
    instructionCountMatch: boolean;
    authorMapped: boolean;
    tagsPreserved: boolean;
    orderingPreserved: boolean;
    noHtmlArtifacts: boolean;
    noEncodingIssues: boolean;
  };
  issues: string[];
  status: 'pass' | 'fail';
}

export interface FieldPopulationCheck {
  field: string;
  totalRecords: number;
  populatedCount: number;
  nullCount: number;
  emptyCount: number;
  populationRate: number;
  required: boolean;
  status: 'pass' | 'fail' | 'warning';
}

export interface HtmlArtifactCheck {
  recipeId: string;
  legacyId: number;
  title: string;
  field: string;
  artifacts: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface OrderingCheck {
  recipeId: string;
  legacyId: number;
  title: string;
  type: 'ingredients' | 'instructions';
  orderPreserved: boolean;
  issues: string[];
}

export interface TagAssociationCheck {
  recipeId: string;
  legacyId: number;
  title: string;
  legacyTags: string[];
  newTags: string[];
  allTagsPreserved: boolean;
  missingTags: string[];
  extraTags: string[];
}

export interface UserOwnershipCheck {
  recipeId: string;
  legacyId: number;
  title: string;
  legacyUserId: number;
  newAuthorId: string;
  ownershipMapped: boolean;
  issue?: string;
}

export interface VerificationResult {
  timestamp: string;
  duration: number;
  recordCounts: RecordCountComparison[];
  spotChecks: SpotCheckResult[];
  fieldPopulation: FieldPopulationCheck[];
  htmlArtifacts: HtmlArtifactCheck[];
  orderingChecks: OrderingCheck[];
  tagAssociations: TagAssociationCheck[];
  userOwnership: UserOwnershipCheck[];
  summary: {
    overallStatus: 'pass' | 'fail' | 'warning';
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    criticalIssues: string[];
    recommendations: string[];
  };
}

export interface VerificationReport {
  metadata: {
    timestamp: string;
    duration: number;
    legacyDatabase: string;
    newDatabase: string;
  };
  results: VerificationResult;
  detailedFindings: {
    recordCountDetails: RecordCountComparison[];
    spotCheckDetails: SpotCheckResult[];
    fieldPopulationDetails: FieldPopulationCheck[];
    htmlArtifactDetails: HtmlArtifactCheck[];
    orderingDetails: OrderingCheck[];
    tagAssociationDetails: TagAssociationCheck[];
    userOwnershipDetails: UserOwnershipCheck[];
  };
  recommendations: string[];
}
