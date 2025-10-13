// Agent Index: Test Multi-Page Agent
// Category: MARKETING
// Generated at: 2025-10-07T21:18:48.506Z

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all pages
import TestMultipageDeployedPage1 from './deployed_page_1';
import TestMultipageDeployedPage2 from './deployed_page_2';

export default function TestMultipageAgent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="deployed-page-1" replace />} />
      <Route path="deployed-page-1" element={<TestMultipageDeployedPage1 />} />
      <Route path="deployed-page-2" element={<TestMultipageDeployedPage2 />} />
    </Routes>
  );
}

export const agentConfig = {
  "id": "test_multipage",
  "name": "Test Multi-Page Agent",
  "category": "MARKETING",
  "pages": [
    {
      "name": "deployed_page_1",
      "path": "deployed-page-1"
    },
    {
      "name": "deployed_page_2",
      "path": "deployed-page-2"
    }
  ]
};
