// Agent Index: SMM Assistant
// Category: MARKETING
// Generated at: 2025-10-07T21:26:17.963Z

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all pages
import SmmAssistantSmmAssistantAbc123SMMDashboardPage1 from './smm_assistant_abc123_smm_dashboard_page1.tsx';
import SmmAssistantSmmAssistantDef456AnalyticsViewPage2 from './smm_assistant_def456_analytics_view_page2.tsx';
import SmmAssistantSmmAssistantGhi789ContentCreatorPage3 from './smm_assistant_ghi789_content_creator_page3.tsx';
import SmmAssistantSmmAssistantLiquidBlanch17032840Page4 from './smm_assistant_liquid_blanch_17032840_page4.tsx';

export default function SmmAssistantAgent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="smm-assistant-abc123-smm-dashboard-page1" replace />} />
      <Route path="smm-assistant-abc123-smm-dashboard-page1" element={<SmmAssistantSmmAssistantAbc123SMMDashboardPage1 />} />
      <Route path="smm-assistant-def456-analytics-view-page2" element={<SmmAssistantSmmAssistantDef456AnalyticsViewPage2 />} />
      <Route path="smm-assistant-ghi789-content-creator-page3" element={<SmmAssistantSmmAssistantGhi789ContentCreatorPage3 />} />
      <Route path="smm-assistant-liquid-blanch-17032840-page4" element={<SmmAssistantSmmAssistantLiquidBlanch17032840Page4 />} />
    </Routes>
  );
}

export const agentConfig = {
  "id": "smm_assistant",
  "name": "SMM Assistant",
  "category": "MARKETING",
  "pages": [
    {
      "name": "smm_assistant_abc123_SMM-Dashboard_page1",
      "path": "smm-assistant-abc123-smm-dashboard-page1"
    },
    {
      "name": "smm_assistant_def456_Analytics-View_page2",
      "path": "smm-assistant-def456-analytics-view-page2"
    },
    {
      "name": "smm_assistant_ghi789_Content-Creator_page3",
      "path": "smm-assistant-ghi789-content-creator-page3"
    },
    {
      "name": "smm_assistant_liquid-blanch-17032840_page4",
      "path": "smm-assistant-liquid-blanch-17032840-page4"
    },

  ]
};
