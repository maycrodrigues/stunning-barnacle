import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useAppStore } from "../store/appStore";
import { SystemStatusModal } from "../components/system/SystemStatusModal";
import { ApiValidationBanner } from "../components/system/ApiValidationBanner";
import { useSystemStatusStore } from "../store/systemStatusStore";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const loadDemands = useAppStore((state) => state.loadDemands);
  const loadSettings = useAppStore((state) => state.loadSettings);
  const startApiValidation = useSystemStatusStore((s) => s.startApiValidation);

  useEffect(() => {
    loadDemands();
    loadSettings();
    startApiValidation().catch(() => undefined);
  }, [loadDemands, loadSettings, startApiValidation]);

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <ApiValidationBanner />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
        <SystemStatusModal />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
