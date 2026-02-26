import React, { useState } from "react";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import PageMeta from "../../../shared/components/common/PageMeta";
import Button from "../../../shared/components/ui/button/Button";
import { CategorySettings } from "../components/CategorySettings";
import { UrgencySettings } from "../components/UrgencySettings";
import { StatusSettings } from "../components/StatusSettings";
import { LocationSettings } from "../components/LocationSettings";
import { TratativaSettings } from "../components/TratativaSettings";
import { RoleSettings } from "../components/RoleSettings";

type Tab = "categories" | "urgencies" | "status" | "location" | "tratativas" | "roles";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  return (
    <>
      <PageMeta
        title="Configurações | Gabinete Online"
        description="Configurações do sistema Gabinete Online"
      />
      <PageBreadcrumb pageTitle="Configurações" />

      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <Button
              variant="ghost"
              size="none"
              onClick={() => setActiveTab("categories")}
              className={`
                rounded-none hover:bg-transparent justify-start gap-0
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${
                  activeTab === "categories"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }
              `}
            >
              Categorias
            </Button>
            <Button
              variant="ghost"
              size="none"
              onClick={() => setActiveTab("roles")}
              className={`
                rounded-none hover:bg-transparent justify-start gap-0
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${
                  activeTab === "roles"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }
              `}
            >
              Cargos
            </Button>
            <Button
              variant="ghost"
              size="none"
              onClick={() => setActiveTab("urgencies")}
              className={`
                rounded-none hover:bg-transparent justify-start gap-0
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${
                  activeTab === "urgencies"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }
              `}
            >
              Urgências
            </Button>
            <Button
              variant="ghost"
              size="none"
              onClick={() => setActiveTab("status")}
              className={`
                rounded-none hover:bg-transparent justify-start gap-0
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${
                  activeTab === "status"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }
              `}
            >
              Status
            </Button>
            <Button
              variant="ghost"
              size="none"
              onClick={() => setActiveTab("tratativas")}
              className={`
                rounded-none hover:bg-transparent justify-start gap-0
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${
                  activeTab === "tratativas"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }
              `}
            >
              Tratativas
            </Button>
            <Button
              variant="ghost"
              size="none"
              onClick={() => setActiveTab("location")}
              className={`
                rounded-none hover:bg-transparent justify-start gap-0
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                ${
                  activeTab === "location"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }
              `}
            >
              Localização
            </Button>
          </nav>
        </div>

        <div>
          {activeTab === "categories" && <CategorySettings />}
          {activeTab === "roles" && <RoleSettings />}
          {activeTab === "urgencies" && <UrgencySettings />}
          {activeTab === "status" && <StatusSettings />}
          {activeTab === "tratativas" && <TratativaSettings />}
          {activeTab === "location" && <LocationSettings />}
        </div>
      </div>
    </>
  );
};
