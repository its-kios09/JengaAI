import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { PublicRoute } from '@/components/common/PublicRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { ProjectWizardPage } from '@/pages/projects/ProjectWizardPage';
import { DatasetListPage } from '@/pages/datasets/DatasetListPage';
import { DatasetDetailPage } from '@/pages/datasets/DatasetDetailPage';
import { TrainingListPage } from '@/pages/training/TrainingListPage';
import { TrainingMonitorPage } from '@/pages/training/TrainingMonitorPage';
import { InferencePage } from '@/pages/inference/InferencePage';
import { TemplateGalleryPage } from '@/pages/templates/TemplateGalleryPage';
import { ComputeMarketplacePage } from '@/pages/compute/ComputeMarketplacePage';
import { PipelineEditorPage } from '@/pages/pipeline/PipelineEditorPage';
import { TeachableMachinePage } from '@/pages/teachable/TeachableMachinePage';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes — redirect to dashboard if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Always accessible (verify works regardless of auth state) */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected routes — redirect to login if not authenticated */}
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
