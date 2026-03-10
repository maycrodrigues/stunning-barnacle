import { useEffect, useState } from "react";
import { useLocation } from "react-router";
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
  const { loadMembers, members, isLoading: isLoadingMembers, addMember } = useMemberStore();
  const { loadSettings } = useAppStore();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMembers();
    loadSettings();
  }, [loadMembers, loadSettings]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q) setSearchTerm(q);
  }, [location.search]);

  const filteredMembers = members.filter((member) => {
    if (!searchTerm.trim()) return true;
    const lower = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(lower) ||
      member.email?.toLowerCase().includes(lower) ||
      member.phone.toLowerCase().includes(lower) ||
      member.address?.toLowerCase().includes(lower) ||
      member.social?.instagram?.toLowerCase().includes(lower) ||
      member.social?.facebook?.toLowerCase().includes(lower) ||
      member.social?.linkedin?.toLowerCase().includes(lower) ||
      member.social?.x?.toLowerCase().includes(lower)
    );
  });

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

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar membros..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
      </div>

      {isLoadingMembers ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : (
        <MemberList onEdit={handleEditMember} members={filteredMembers} />
      )}

      <MemberForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        memberToEdit={editingMember}
      />
    </div>
  );
}
