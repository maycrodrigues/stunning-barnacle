import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import NotFound from "./shared/pages/OtherPage/NotFound";
import AppLayout from "./shared/layout/AppLayout";
import { ScrollToTop } from "./shared/components/common/ScrollToTop";
import Home from "./shared/pages/Dashboard/Home";
import { DashboardHomeV2 } from "./features/dashboard";
import { Members } from "./features/members";
import { DemandCreate, DemandKanban, DemandList, DemandEdit, DemandDetails } from "./features/demands";
import { SettingsPage } from "./features/settings";
import { ContactsPage } from "./features/contacts/pages/ContactsPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
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

            <Route index path="/old-home" element={<Home />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
