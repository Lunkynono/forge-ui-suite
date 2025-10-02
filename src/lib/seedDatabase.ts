import { supabase } from '@/integrations/supabase/client';

export async function seedDatabase() {
  try {
    // Check if project already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .maybeSingle();

    if (existing) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Insert project
    await supabase.from('projects').insert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'FinTech Iberia',
      description: 'Digital banking platform for European market',
      client_name: 'IberoBank',
    });

    // Insert meetings
    await supabase.from('meetings').insert([
      {
        id: '00000000-0000-0000-0000-000000000011',
        project_id: '00000000-0000-0000-0000-000000000001',
        date: '2025-01-15T10:00:00Z',
        title: 'Kickoff Discovery Meeting',
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        project_id: '00000000-0000-0000-0000-000000000001',
        date: '2025-01-22T14:00:00Z',
        title: 'Technical Requirements Discussion',
      },
    ]);

    // Insert transcripts
    await supabase.from('transcripts').insert([
      {
        id: '00000000-0000-0000-0000-000000000021',
        meeting_id: '00000000-0000-0000-0000-000000000011',
        language: 'es',
        content: `Cliente (CTO): Necesitamos una plataforma de banca digital que cumpla con PSD2 y GDPR. Es absolutamente crítico para Q2.

[00:05:12] Consultor: Entendido. ¿Qué funcionalidades son imprescindibles?

Cliente (Product Owner): Autenticación de dos factores, integración con Open Banking APIs, y cumplimiento SOC2. La latencia debe ser inferior a 200ms para todas las transacciones.

[00:12:30] Cliente (CTO): También queremos un modo oscuro en la interfaz, sería genial tener un chatbot de IA para soporte al cliente.

Cliente (Compliance Officer): El cifrado end-to-end es obligatorio. Debemos cumplir con las regulaciones de la UE sobre protección de datos.

[00:18:45] Consultor: ¿Necesitan capacidad offline?

Cliente (Product Owner): Sí, al menos para consulta de saldos y últimas transacciones. Y escalabilidad para 2 millones de usuarios concurrentes.

Cliente (CTO): El sistema debe integrarse con nuestro LDAP existente para SSO. Logging y auditoría completa de todas las operaciones.`,
      },
      {
        id: '00000000-0000-0000-0000-000000000022',
        meeting_id: '00000000-0000-0000-0000-000000000012',
        language: 'en',
        content: `Client (CTO): We need a digital banking platform that complies with PSD2 and GDPR. This is absolutely critical for Q2 launch.

[00:05:12] Consultant: Understood. What features are must-haves?

Client (Product Owner): Two-factor authentication, Open Banking API integration, and SOC2 compliance. Transaction latency must be under 200ms.

[00:12:30] Client (CTO): We would also like a dark mode UI, and it would be great to have an AI chatbot for customer support.

Client (Compliance Officer): End-to-end encryption is mandatory. We must comply with EU data protection regulations.

[00:18:45] Consultant: Do you need offline capability?

Client (Product Owner): Yes, at least for balance inquiries and recent transactions. And scalability to handle 2 million concurrent users.

Client (CTO): The system must integrate with our existing LDAP for SSO. Complete logging and audit trail for all operations is required.`,
      },
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
