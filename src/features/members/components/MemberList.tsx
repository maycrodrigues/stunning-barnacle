import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";
import Avatar from "../../../shared/components/ui/avatar/Avatar";
import Button from "../../../shared/components/ui/button/Button";
import { useMemberStore } from "../store/memberStore";
import { useAppStore } from "../../../shared/store/appStore";
import { Member } from "../../../shared/services/db";
import { PencilIcon, TrashBinIcon } from "../../../shared/icons"; // Assuming these icons exist
import Swal from "sweetalert2";

interface MemberListProps {
  onEdit: (member: Member) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ onEdit }) => {
  const { members, removeMember } = useMemberStore();
  const { roleOptions } = useAppStore();

  const handleDelete = async (member: Member) => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: `Deseja realmente excluir ${member.name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await removeMember(member.id);
        Swal.fire("Excluído!", "O membro foi removido.", "success");
      } catch (error) {
        Swal.fire("Erro!", "Erro ao excluir membro.", "error");
      }
    }
  };

  const getRoleLabel = (roleId?: string) => {
    if (!roleId) return "-";
    const role = roleOptions.find((r) => r.value === roleId);
    return role ? role.label : roleId;
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <svg
            className="h-8 w-8 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Nenhum membro encontrado
        </h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Comece adicionando um novo membro à sua equipe.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50">
            <TableRow>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Membro
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cargo
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Contato
              </TableCell>
              <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Ações
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0">
                        {member.photo ? (
                            <Avatar src={member.photo} size="medium" />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                                <span className="text-sm font-medium">
                                    {member.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      {member.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {getRoleLabel(member.roleId)}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col">
                    <span>{member.phone}</span>
                    {member.social?.instagram && (
                        <span className="text-xs text-gray-400">{member.social.instagram}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(member)}
                        className="p-2"
                    >
                        <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(member)}
                        className="p-2 text-error-500 hover:text-error-600 dark:text-error-400 dark:hover:text-error-300"
                    >
                        <TrashBinIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
