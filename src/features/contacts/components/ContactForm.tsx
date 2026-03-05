import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../../shared/components/ui/modal";
import Input from "../../../shared/components/form/input/InputField";
import TextArea from "../../../shared/components/form/input/TextArea";
import Label from "../../../shared/components/form/Label";
import Button from "../../../shared/components/ui/button/Button";
import { ContactFormData, contactSchema } from "../types";
import { Contact } from "../../../shared/services/db";

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Contact;
  initialValues?: Partial<ContactFormData>;
  isLoading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialValues,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          email: initialData.email || "",
          phone: initialData.phone || "",
          address: initialData.address || "",
          notes: initialData.notes || "",
        });
      } else if (initialValues) {
        reset({
          name: initialValues.name || "",
          email: initialValues.email || "",
          phone: initialValues.phone || "",
          address: initialValues.address || "",
          notes: initialValues.notes || "",
        });
      } else {
        reset({
          name: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
        });
      }
    }
  }, [isOpen, initialData, initialValues, reset]);

  const onFormSubmit = async (data: ContactFormData) => {
    await onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {initialData ? "Editar Contato" : "Novo Contato"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Preencha as informações do contato abaixo.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="name"
                placeholder="Ex: João da Silva"
                error={!!errors.name}
                hint={errors.name?.message}
                className="bg-white dark:bg-gray-800"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  error={!!errors.email}
                  hint={errors.email?.message}
                  className="bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  error={!!errors.phone}
                  hint={errors.phone?.message}
                  className="bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Endereço</Label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="address"
                placeholder="Rua, Número, Bairro, Cidade - UF"
                error={!!errors.address}
                hint={errors.address?.message}
                className="bg-white dark:bg-gray-800"
              />
            )}
          />
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextArea
                {...field}
                rows={3}
                placeholder="Informações adicionais..."
                error={!!errors.notes}
                hint={errors.notes?.message}
                className="bg-white dark:bg-gray-800"
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : initialData ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
