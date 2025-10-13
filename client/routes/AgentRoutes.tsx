import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

export default function AgentRoutes() {
  return (
    <Routes>
      {/* Main chat interface - relative paths since we're nested under /chat/* */}
      <Route path="/" element={<MainLayout />} />
      <Route path="/:agentId" element={<MainLayout />} />
      <Route path="/:agentId/:pageName" element={<MainLayout />} />
      
      {/* Legacy agent routes */}
      <Route path="/agents/:agentId" element={<MainLayout />} />
      <Route path="/agents/:agentId/:pageName" element={<MainLayout />} />
    </Routes>
  );
}