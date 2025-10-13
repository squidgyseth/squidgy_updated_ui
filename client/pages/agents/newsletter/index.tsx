// Agent Index: Newsletter Agent
// Category: MARKETING
// Generated at: 2025-10-12T20:48:23.131Z

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all pages
import NewsletterNewsletterLiquidBlanch17032840Page1 from './newsletter_liquid_blanch_17032840_page1';

export default function NewsletterAgent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="newsletter-liquid-blanch-17032840-page1" replace />} />
      <Route path="newsletter-liquid-blanch-17032840-page1" element={<NewsletterNewsletterLiquidBlanch17032840Page1 />} />
    </Routes>
  );
}

export const agentConfig = {
  "id": "newsletter",
  "name": "Newsletter Agent",
  "category": "MARKETING",
  "pages": [
    {
      "name": "newsletter_liquid-blanch-17032840_page1",
      "path": "newsletter-liquid-blanch-17032840-page1"
    }
  ]
};
