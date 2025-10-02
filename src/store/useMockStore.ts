import { create } from 'zustand';
import projectsData from '@/mocks/projects.json';
import meetingsData from '@/mocks/meetings.json';
import transcriptsData from '@/mocks/transcripts.json';
import analysesData from '@/mocks/analyses.json';
import { analyzeTranscript, type AnalysisResult } from '@/lib/analyzeTranscript.mock';
import { EXAMPLE_TRANSCRIPTS } from '@/mocks/exampleTranscripts';

export interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  meetingCount: number;
  transcriptCount: number;
}

export interface Speaker {
  id: string;
  name: string;
  segments: number;
}

export interface Transcript {
  id: string;
  meetingId: string;
  projectId: string;
  title: string;
  language: string;
  duration: number;
  wordCount: number;
  createdAt: string;
  status: string;
  content: string;
  speakers: Speaker[];
  metadata: {
    recordingQuality: string;
    source: string;
    version: number;
  };
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  transcriptIds: string[];
  status: string;
  language: string;
}

export interface Analysis {
  id: string;
  transcriptId: string;
  projectId: string;
  type: 'sentiment' | 'topics' | 'action_items' | 'summary' | 'requirements';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  results?: Record<string, any> | AnalysisResult;
}

interface MockStore {
  projects: Project[];
  meetings: Meeting[];
  transcripts: Transcript[];
  analyses: Analysis[];
  currentProject: string | null;
  nextSteps: Record<string, boolean>;
  
  // Actions
  addTranscript: (transcript: Omit<Transcript, 'id' | 'createdAt' | 'status'>) => void;
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  runMockAnalysis: (transcriptId: string, type: Analysis['type']) => Promise<void>;
  toggleNextStep: (stepId: string) => void;
  setCurrentProject: (projectId: string) => void;
  getProjectTranscripts: (projectId: string) => Transcript[];
  getProjectMeetings: (projectId: string) => Meeting[];
  getTranscriptAnalyses: (transcriptId: string) => Analysis[];
  loadExampleTranscripts: () => void;
}

export const useMockStore = create<MockStore>((set, get) => ({
  projects: projectsData as Project[],
  meetings: meetingsData as Meeting[],
  transcripts: transcriptsData as Transcript[],
  analyses: analysesData as Analysis[],
  currentProject: projectsData[0]?.id || null,
  nextSteps: {},

  addTranscript: (transcript) => {
    const newTranscript: Transcript = {
      ...transcript,
      id: `trans-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'processing',
    };

    set((state) => ({
      transcripts: [...state.transcripts, newTranscript],
    }));

    // Simulate processing completion
    setTimeout(() => {
      set((state) => ({
        transcripts: state.transcripts.map((t) =>
          t.id === newTranscript.id ? { ...t, status: 'processed' } : t
        ),
      }));
    }, 2000);
  },

  addMeeting: (meeting) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meeting-${Date.now()}`,
    };

    set((state) => ({
      meetings: [...state.meetings, newMeeting],
    }));
  },

  runMockAnalysis: async (transcriptId, type) => {
    const transcript = get().transcripts.find((t) => t.id === transcriptId);
    if (!transcript) return;

    const project = get().projects.find((p) => p.id === transcript.projectId);

    const newAnalysis: Analysis = {
      id: `analysis-${Date.now()}`,
      transcriptId,
      projectId: transcript.projectId,
      type,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      analyses: [...state.analyses, newAnalysis],
    }));

    // Simulate analysis processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    let results: Record<string, any> | AnalysisResult = {};
    
    // Use the mock analyzer for comprehensive analysis
    if (type === 'sentiment' || type === 'requirements') {
      const analysisResult = analyzeTranscript(
        transcript.content,
        project?.name || 'Customer'
      );
      
      if (type === 'requirements') {
        // Return full structured analysis
        results = analysisResult;
      } else {
        // For sentiment, derive from needs/wants analysis
        const totalItems = analysisResult.needs.length + analysisResult.wants.length;
        const p0Count = analysisResult.needs.filter(n => n.priority === 'P0').length;
        const positiveRatio = totalItems > 0 ? (analysisResult.needs.length / totalItems) : 0.5;
        
        results = {
          overall: p0Count > 2 ? 'urgent' : positiveRatio > 0.6 ? 'positive' : 'neutral',
          score: positiveRatio,
          breakdown: {
            positive: positiveRatio,
            neutral: 1 - positiveRatio,
            negative: analysisResult.risks.length / 10,
          },
          needs_count: analysisResult.needs.length,
          wants_count: analysisResult.wants.length,
          risks_count: analysisResult.risks.length,
        };
      }
    } else {
      // Fallback for other analysis types
      switch (type) {
        case 'topics':
          results = {
            topics: [
              { name: 'Strategy', confidence: 0.89, mentions: 12 },
              { name: 'Market Analysis', confidence: 0.82, mentions: 8 },
              { name: 'Product Development', confidence: 0.76, mentions: 6 },
            ],
          };
          break;
        case 'action_items':
          results = {
            items: [
              {
                text: 'Follow up with stakeholders',
                assignee: transcript.speakers[0]?.name || 'Unassigned',
                priority: 'high',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              },
            ],
          };
          break;
        case 'summary':
          results = {
            summary: 'This meeting covered key strategic initiatives and market opportunities.',
            keyPoints: [
              'Discussed market expansion strategy',
              'Reviewed competitive landscape',
              'Identified action items for next quarter',
            ],
          };
          break;
      }
    }

    set((state) => ({
      analyses: state.analyses.map((a) =>
        a.id === newAnalysis.id
          ? { ...a, status: 'completed' as const, results }
          : a
      ),
    }));
  },

  toggleNextStep: (stepId) => {
    set((state) => ({
      nextSteps: {
        ...state.nextSteps,
        [stepId]: !state.nextSteps[stepId],
      },
    }));
  },

  setCurrentProject: (projectId) => {
    set({ currentProject: projectId });
  },

  getProjectTranscripts: (projectId) => {
    return get().transcripts.filter((t) => t.projectId === projectId);
  },

  getProjectMeetings: (projectId) => {
    return get().meetings.filter((m) => m.projectId === projectId);
  },

  getTranscriptAnalyses: (transcriptId) => {
    return get().analyses.filter((a) => a.transcriptId === transcriptId);
  },

  loadExampleTranscripts: () => {
    const currentProject = get().currentProject;
    if (!currentProject) return;

    const meeting1Id = `meeting-${Date.now()}-1`;
    const meeting2Id = `meeting-${Date.now()}-2`;

    // Add example meetings
    set((state) => ({
      meetings: [
        ...state.meetings,
        {
          id: meeting1Id,
          projectId: currentProject,
          title: EXAMPLE_TRANSCRIPTS.fintech_es.title,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 1800,
          participants: ['Client (CTO)', 'Client (Marketing)', 'Client (CFO)', 'Sales'],
          transcriptIds: [],
          status: 'completed',
          language: EXAMPLE_TRANSCRIPTS.fintech_es.language,
        },
        {
          id: meeting2Id,
          projectId: currentProject,
          title: EXAMPLE_TRANSCRIPTS.tech_retail_en.title,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 2040,
          participants: ['Client (VP Engineering)', 'Client (Product)', 'Client (CFO)', 'Sales'],
          transcriptIds: [],
          status: 'completed',
          language: EXAMPLE_TRANSCRIPTS.tech_retail_en.language,
        },
      ],
    }));

    // Add example transcripts
    const transcript1: Transcript = {
      id: `trans-example-${Date.now()}-1`,
      meetingId: meeting1Id,
      projectId: currentProject,
      title: EXAMPLE_TRANSCRIPTS.fintech_es.title,
      language: EXAMPLE_TRANSCRIPTS.fintech_es.language,
      duration: 1800,
      wordCount: EXAMPLE_TRANSCRIPTS.fintech_es.content.split(' ').length,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'processed',
      content: EXAMPLE_TRANSCRIPTS.fintech_es.content,
      speakers: [
        { id: 'cto', name: 'Cliente (CTO)', segments: 10 },
        { id: 'marketing', name: 'Cliente (Marketing)', segments: 2 },
        { id: 'cfo', name: 'Cliente (CFO)', segments: 1 },
        { id: 'sales', name: 'Sales', segments: 5 },
      ],
      metadata: {
        recordingQuality: 'high',
        source: 'example',
        version: 1,
      },
    };

    const transcript2: Transcript = {
      id: `trans-example-${Date.now()}-2`,
      meetingId: meeting2Id,
      projectId: currentProject,
      title: EXAMPLE_TRANSCRIPTS.tech_retail_en.title,
      language: EXAMPLE_TRANSCRIPTS.tech_retail_en.language,
      duration: 2040,
      wordCount: EXAMPLE_TRANSCRIPTS.tech_retail_en.content.split(' ').length,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'processed',
      content: EXAMPLE_TRANSCRIPTS.tech_retail_en.content,
      speakers: [
        { id: 'vp', name: 'Client (VP Engineering)', segments: 12 },
        { id: 'product', name: 'Client (Product)', segments: 4 },
        { id: 'cfo', name: 'Client (CFO)', segments: 1 },
        { id: 'sales', name: 'Sales', segments: 4 },
      ],
      metadata: {
        recordingQuality: 'high',
        source: 'example',
        version: 1,
      },
    };

    set((state) => ({
      transcripts: [...state.transcripts, transcript1, transcript2],
    }));
  },
}));
