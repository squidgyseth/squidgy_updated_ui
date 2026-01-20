import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import GroupChatLayout from '../components/layout/GroupChatLayout';

export default function AgentRoutes() {
  return (
    <Routes>
      {/* Redirect /chat to /chat/personal_assistant by default */}
      <Route path="/" element={<Navigate to="/chat/personal_assistant" replace />} />
      
      {/* Group chat routes */}
      <Route path="/group/:groupId" element={<GroupChatLayout />} />
      
      {/* Main chat interface - relative paths since we're nested under /chat/* */}
      <Route path="/:agentId" element={<MainLayout />} />
      <Route path="/:agentId/:pageName" element={<MainLayout />} />
      
      {/* Legacy agent routes */}
      <Route path="/agents/:agentId" element={<MainLayout />} />
      <Route path="/agents/:agentId/:pageName" element={<MainLayout />} />
    </Routes>
  );
}