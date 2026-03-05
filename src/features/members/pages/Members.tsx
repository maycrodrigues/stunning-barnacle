import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../shared/components/common/PageBreadCrumb";
import PageMeta from "../../../shared/components/common/PageMeta";
import Button from "../../../shared/components/ui/button/Button";
import { PlusIcon } from "../../../shared/icons";
import { MemberList } from "../components/MemberList";
import { MemberForm } from "../components/MemberForm";
import { useMemberStore } from "../store/memberStore";
import { useAppStore } from "../../../shared/store/appStore";
import { Member } from "../../../shared/services/db";
import { generateFakeMembers } from "../utils/fakeMembers";

export default function Members() {
  const { loadMembers, isLoading: isLoadingMembers, addMember } = useMemberStore();
  const { loadSettings } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  useEffect(() => {
    loadMembers();
    loadSettings();
  }, [loadMembers, loadSettings]);

  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleGenerateFakes = async () => {
    if (!window.confirm("Deseja gerar 5 membros falsos para teste?")) return;
    
    try {
      const fakes = generateFakeMembers(5);
      // Create promises to add members in parallel (or sequential if needed)
      // Using sequential to avoid overwhelming the store/db logic if not robust enough
      for (const fake of fakes) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, tenantId, ...data } = fake;
        // The store's addMember will handle ID and timestamps
        await addMember(data);
      }
      alert("5 membros gerados com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar membros falsos:", error);
      alert("Erro ao gerar membros. Verifique o console.");
    }
  };

  return (
    <div>
      <PageMeta
        title="Membros | Gabinete Online"
        description="Gerenciamento de membros do gabinete"
      />
      <PageBreadcrumb pageTitle="Membros" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Membros da Equipe
        </h2>
        <div className="flex gap-2">
          {import.meta.env.DEV && (
            <Button
              variant="outline"
              onClick={handleGenerateFakes}
              className="flex items-center gap-2"
            >
              Gerar Fakes
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleAddMember}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Novo Membro
          </Button>
        </div>
      </div>

      {isLoadingMembers ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : (
        <MemberList onEdit={handleEditMember} />
      )}

      <MemberForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        memberToEdit={editingMember}
      />
    </div>
  );
}
