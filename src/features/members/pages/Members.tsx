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

export default function Members() {
  const { loadMembers, isLoading: isLoadingMembers } = useMemberStore();
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
        <Button
          variant="primary"
          onClick={handleAddMember}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Novo Membro
        </Button>
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
