import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.tsx';
import { ProtectedRoute } from '@/components/common/ProtectedRoute.tsx';
import { LoginPage } from '@/pages/auth/LoginPage.tsx';
import { RegisterPage } from '@/pages/auth/RegisterPage.tsx';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage.tsx';
import { DashboardPage } from '@/pages/dashboard/DashboardPage.tsx';
import { ProjectListPage } from '@/pages/projects/ProjectListPage.tsx';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage.tsx';
import { ProjectWizardPage } from '@/pages/projects/ProjectWizardPage.tsx';
import { DatasetListPage } from '@/pages/datasets/DatasetListPage.tsx';
import { DatasetDetailPage } from '@/pages/datasets/DatasetDetailPage.tsx';
import { TrainingListPage } from '@/pages/training/TrainingListPage.tsx';
import { TrainingMonitorPage } from '@/pages/training/TrainingMonitorPage.tsx';
import { InferencePage } from '@/pages/inference/InferencePage.tsx';
import { TemplateGalleryPage } from '@/pages/templates/TemplateGalleryPage.tsx';
import { ComputeMarketplacePage } from '@/pages/compute/ComputeMarketplacePage.tsx';
import { PipelineEditorPage } from '@/pages/pipeline/PipelineEditorPage.tsx';
import { TeachableMachinePage } from '@/pages/teachable/TeachableMachinePage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/new" element={<ProjectWizardPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/datasets" element={<DatasetListPage />} />
            <Route path="/datasets/:id" element={<DatasetDetailPage />} />
            <Route path="/training" element={<TrainingListPage />} />
            <Route path="/training/:id" element={<TrainingMonitorPage />} />
            <Route path="/inference" element={<InferencePage />} />
            <Route path="/templates" element={<TemplateGalleryPage />} />
            <Route path="/compute" element={<ComputeMarketplacePage />} />
            <Route path="/pipeline/new" element={<PipelineEditorPage />} />
            <Route path="/pipeline/:id" element={<PipelineEditorPage />} />
            <Route path="/teachable" element={<TeachableMachinePage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
