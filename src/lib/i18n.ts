// Simple i18n support for key strings

export const translations = {
  en: {
    // Navigation
    ingest: "Ingest",
    projects: "Projects",
    
    // Common
    analyze: "Analyze",
    share: "Share",
    print: "Print",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    loading: "Loading",
    error: "Error",
    success: "Success",
    
    // Requirement types
    needs: "Needs",
    wants: "Wants",
    need: "Need",
    want: "Want",
    
    // Priorities
    priority: "Priority",
    p0: "P0 - Critical",
    p1: "P1 - High",
    p2: "P2 - Medium",
    p3: "P3 - Low",
    
    // Actions
    runAnalysis: "Run Analysis",
    viewSource: "View Source",
    copyLink: "Copy Link",
    exportPDF: "Export PDF",
    
    // Filters
    allTypes: "All Types",
    needsOnly: "Needs Only",
    wantsOnly: "Wants Only",
    allPriorities: "All Priorities",
    
    // Empty states
    noMeetings: "No meetings yet",
    noTranscripts: "No transcripts yet",
    noAnalysis: "No analysis available",
    noRequirements: "No requirements match filters",
    
    // Tabs
    overview: "Overview",
    requirements: "Requirements",
    techSpec: "Tech Spec",
    salesBrief: "Sales Brief",
  },
  
  es: {
    // Navigation
    ingest: "Ingerir",
    projects: "Proyectos",
    
    // Common
    analyze: "Analizar",
    share: "Compartir",
    print: "Imprimir",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    loading: "Cargando",
    error: "Error",
    success: "Éxito",
    
    // Requirement types
    needs: "Necesidades",
    wants: "Deseos",
    need: "Necesidad",
    want: "Deseo",
    
    // Priorities
    priority: "Prioridad",
    p0: "P0 - Crítico",
    p1: "P1 - Alto",
    p2: "P2 - Medio",
    p3: "P3 - Bajo",
    
    // Actions
    runAnalysis: "Ejecutar Análisis",
    viewSource: "Ver Fuente",
    copyLink: "Copiar Enlace",
    exportPDF: "Exportar PDF",
    
    // Filters
    allTypes: "Todos los Tipos",
    needsOnly: "Solo Necesidades",
    wantsOnly: "Solo Deseos",
    allPriorities: "Todas las Prioridades",
    
    // Empty states
    noMeetings: "Sin reuniones aún",
    noTranscripts: "Sin transcripciones aún",
    noAnalysis: "Sin análisis disponible",
    noRequirements: "Ningún requisito coincide con los filtros",
    
    // Tabs
    overview: "Resumen",
    requirements: "Requisitos",
    techSpec: "Especificación Técnica",
    salesBrief: "Resumen de Ventas",
  }
};

export type Language = keyof typeof translations;

export function t(key: string, lang: Language = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}
