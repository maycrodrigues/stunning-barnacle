import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import AppLayout from "./shared/layout/AppLayout";
import { ScrollToTop } from "./shared/components/common/ScrollToTop";
import { Loader } from "./shared/components/ui/loader/Loader";

// Lazy load components
const NotFound = lazy(() => import("./shared/pages/OtherPage/NotFound"));
const Home = lazy(() => import("./shared/pages/Dashboard/Home"));
const DashboardHomeV2 = lazy(() => import("./features/dashboard").then(module => ({ default: module.DashboardHomeV2 })));
const Members = lazy(() => import("./features/members").then(module => ({ default: module.Members })));
const DemandCreate = lazy(() => import("./features/demands").then(module => ({ default: module.DemandCreate })));
const DemandKanban = lazy(() => import("./features/demands").then(module => ({ default: module.DemandKanban })));
const DemandList = lazy(() => import("./features/demands").then(module => ({ default: module.DemandList })));
const DemandEdit = lazy(() => import("./features/demands").then(module => ({ default: module.DemandEdit })));
const DemandDetails = lazy(() => import("./features/demands").then(module => ({ default: module.DemandDetails })));
const SettingsPage = lazy(() => import("./features/settings").then(module => ({ default: module.SettingsPage })));
const ContactsPage = lazy(() => import("./features/contacts/pages/ContactsPage").then(module => ({ default: module.ContactsPage })));

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader /></div>}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<DashboardHomeV2 />} />
              <Route path="/members" element={<Members />} />
              <Route path="/demands/new" element={<DemandCreate />} />
              <Route path="/demands/list" element={<DemandList />} />
              <Route path="/demands/:id" element={<DemandDetails />} />
              <Route path="/demands/:id/edit" element={<DemandEdit />} />
              <Route path="/demands/kanban" element={<DemandKanban />} />
              <Route path="/demands" element={<Navigate to="/demands/list" replace />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/old-home" element={<Home />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}
