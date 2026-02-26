import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../shared/components/ui/modal";
import Input from "../../../shared/components/form/input/InputField";
import Label from "../../../shared/components/form/Label";
import Button from "../../../shared/components/ui/button/Button";
import Select from "../../../shared/components/form/Select";
import { useAppStore } from "../../../shared/store/appStore";
import { useMemberStore } from "../store/memberStore";
import { Member } from "../../../shared/services/db";

const memberSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  roleId: z.string().optional(),
  photo: z.string().optional(),
  social: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    x: z.string().optional(),
  }).optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: Member | null;
}

export const MemberForm: React.FC<MemberFormProps> = ({
  isOpen,
  onClose,
  memberToEdit,
}) => {
  const { roleOptions } = useAppStore();
  const { addMember, updateMember } = useMemberStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      roleId: "",
      photo: "",
      social: {
        instagram: "",
        facebook: "",
        linkedin: "",
        x: "",
      },
    },
  });

  useEffect(() => {
    if (memberToEdit) {
      reset({
        name: memberToEdit.name,
        phone: memberToEdit.phone,
        email: memberToEdit.email || "",
        address: memberToEdit.address || "",
        roleId: memberToEdit.roleId || "",
        photo: memberToEdit.photo || "",
        social: {
          instagram: memberToEdit.social?.instagram || "",
          facebook: memberToEdit.social?.facebook || "",
          linkedin: memberToEdit.social?.linkedin || "",
          x: memberToEdit.social?.x || "",
        },
      });
    } else {
      reset({
        name: "",
        phone: "",
        email: "",
        address: "",
        roleId: "",
        photo: "",
        social: {
            instagram: "",
            facebook: "",
            linkedin: "",
            x: "",
        },
      });
    }
  }, [memberToEdit, reset, isOpen]);

  const onSubmit = async (data: MemberFormData) => {
    try {
      if (memberToEdit) {
        await updateMember(memberToEdit.id, data);
      } else {
        await addMember(data);
      }
      onClose();
      reset();
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
    }
  };

  const roleSelectOptions = roleOptions.map((role) => ({
    value: role.value,
    label: role.label,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {memberToEdit ? "Editar Membro" : "Novo Membro"}
        </h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
                id="name"
                placeholder="Nome completo"
                error={!!errors.name}
                hint={errors.name?.message}
                {...register("name")}
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
                id="phone"
                placeholder="(00) 00000-0000"
                error={!!errors.phone}
                hint={errors.phone?.message}
                {...register("phone")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    error={!!errors.email}
                    hint={errors.email?.message}
                    {...register("email")}
                />
            </div>
             <div className="flex flex-col gap-1">
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Cargo"
                      options={roleSelectOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione um cargo"
                    />
                  )}
                />
            </div>
        </div>
        
        <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
                id="address"
                placeholder="Endereço completo"
                error={!!errors.address}
                hint={errors.address?.message}
                {...register("address")}
            />
        </div>

        <div>
            <Label htmlFor="photo">Foto (URL)</Label>
            <Input
                id="photo"
                placeholder="https://exemplo.com/foto.jpg"
                error={!!errors.photo}
                hint={errors.photo?.message}
                {...register("photo")}
            />
        </div>

        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                Redes Sociais
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                        id="instagram"
                        placeholder="@usuario"
                        {...register("social.instagram")}
                    />
                </div>
                <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                        id="facebook"
                        placeholder="URL do perfil"
                        {...register("social.facebook")}
                    />
                </div>
                <div>
                    <Label htmlFor="linkedin">Linkedin</Label>
                    <Input
                        id="linkedin"
                        placeholder="URL do perfil"
                        {...register("social.linkedin")}
                    />
                </div>
                <div>
                    <Label htmlFor="x">X (Twitter)</Label>
                    <Input
                        id="x"
                        placeholder="@usuario"
                        {...register("social.x")}
                    />
                </div>
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
