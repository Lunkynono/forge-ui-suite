// Example transcripts with real content matching the spec

export const EXAMPLE_TRANSCRIPTS = {
  fintech_es: {
    title: "FinTech Iberia Discovery Call",
    language: "es",
    content: `[00:02:15] Cliente (CTO): Necesitamos cumplimiento PSD2 obligatorio para operar en la UE. Es crítico que el sistema maneje autenticación fuerte de cliente.

[00:03:42] Cliente (CTO): La seguridad es mandatoria - necesitamos cifrado end-to-end para todas las transacciones. Debe cumplir con los estándares bancarios europeos.

[00:05:20] Sales: Entendido. ¿Qué requisitos tienen para latencia y disponibilidad?

[00:06:10] Cliente (CTO): Necesitamos SLA del 99.9% como mínimo. El tiempo de respuesta debe ser inferior a 200ms para transacciones. Esto es obligatorio para la experiencia del usuario.

[00:08:30] Cliente (Marketing): Nos gustaría tener un dashboard con modo oscuro y animaciones suaves. Sería ideal para la marca.

[00:10:15] Cliente (CTO): Para el equipo de ventas de campo, sería bueno tener modo offline. No es crítico pero ayudaría mucho.

[00:12:45] Cliente (CTO): La residencia de datos debe estar solo en la UE. Es un requisito legal obligatorio por GDPR.

[00:15:20] Sales: ¿Qué pasa con la autenticación de usuarios?

[00:16:00] Cliente (CTO): Necesitamos SSO con OIDC. Nuestros empleados ya usan Azure AD.

[00:18:30] Cliente (Marketing): ¿Se puede integrar un chatbot en la landing page? Sería genial para soporte inicial.

[00:20:10] Cliente (CTO): Asumimos que el sistema soportará al menos 10,000 usuarios concurrent. ¿Es posible?

[00:22:00] Sales: Sin problema. ¿Tienen alguna preocupación sobre la migración de datos existentes?

[00:23:15] Cliente (CTO): Sí, ese es un riesgo. Tenemos datos legacy en sistemas antiguos. ¿Cómo manejarían eso?

[00:25:40] Cliente (CFO): ¿Cuál es el timeline estimado para la implementación completa?

[00:27:00] Sales: Dependiendo de los requisitos P0, podríamos tener una primera versión en 8-12 semanas.

[00:28:30] Cliente (CTO): Perfecto. También necesitamos logging completo de todas las transacciones para auditorías. Es obligatorio por cumplimiento.`
  },

  tech_retail_en: {
    title: "Tech Retail Platform Requirements",
    language: "en",
    content: `[00:01:30] Client (VP Engineering): We need SOC2 compliance ready before launch. This is a must-have for our enterprise customers.

[00:03:00] Client (VP Engineering): Data residency must be EU-only for European customers. It's a legal requirement we can't compromise on.

[00:05:15] Sales: Understood. What about authentication requirements?

[00:05:45] Client (VP Engineering): We require SSO integration via OIDC. We use Okta internally and need seamless integration.

[00:07:20] Client (Product): We would like to have a chatbot on the landing page for customer support. It's not critical but would be nice to have.

[00:09:00] Client (VP Engineering): Performance is critical. We need API response times under 300ms for the 95th percentile.

[00:11:30] Client (Product): For the UI, we'd love to have a dark mode option and smooth animations. It's important for brand consistency but not a deal-breaker.

[00:13:45] Client (VP Engineering): We must have comprehensive audit logging for all user actions. Compliance teams need full traceability.

[00:16:00] Client (VP Engineering): Encryption at rest and in transit is mandatory. We're handling sensitive customer data.

[00:18:20] Sales: What about scalability expectations?

[00:19:00] Client (VP Engineering): We're expecting 50,000 concurrent users at peak. The system must handle this without degradation.

[00:21:15] Client (Product): Would be great to have real-time analytics dashboard. Not urgent but valuable for decision making.

[00:23:30] Client (VP Engineering): We assume the system will integrate with our existing inventory management API. Is that feasible?

[00:25:00] Sales: Absolutely. Any concerns about the migration process?

[00:26:15] Client (VP Engineering): Yes, that's a risk. We have legacy data in multiple systems. How do you typically handle data migration?

[00:28:40] Client (CFO): What's the expected timeline for full deployment?

[00:30:00] Sales: For P0 features, we can target 10-12 weeks for initial launch.

[00:31:30] Client (Product): One more thing - we'd like to have offline mode for our field sales team. Not critical but would improve their workflow.

[00:33:00] Client (VP Engineering): Important question - what's your disaster recovery plan? We need RTO under 4 hours.`
  }
};
