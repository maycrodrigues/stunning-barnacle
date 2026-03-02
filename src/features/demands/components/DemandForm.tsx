import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../shared/components/form/input/InputField";
import Select from "../../../shared/components/form/Select";
import TextArea from "../../../shared/components/form/input/TextArea";
import Button from "../../../shared/components/ui/button/Button";
import { LocationPicker } from "./LocationPicker";
import { demandSchema, DemandFormData } from "../types";
import { useAppStore } from "../../../shared/store/appStore";
import { useMemberStore } from "../../members/store/memberStore";

interface DemandFormProps {
  initialValues?: Partial<DemandFormData>;
  onSubmit: (data: DemandFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
  submitLabel?: string;
}

export const DemandForm: React.FC<DemandFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  submitLabel = "Salvar",
}) => {
  const { categoryOptions, urgencyOptions, statusOptions } = useAppStore();
  const { members, loadMembers } = useMemberStore();

  useEffect(() => {
    loadMembers();
  }, []);

  const responsibleOptions = React.useMemo(() => {
    return [
      { value: "", label: "Sem responsável definido" },
      ...members.map((member) => ({
        value: member.id,
        label: member.name,
      })),
    ];
  }, [members]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DemandFormData>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      title: "",
      category: "",
      urgency: "",
      description: "",
      location: undefined,
      requesterName: "",
      requesterContact: "",
      responsibleId: "",
      ...initialValues,
    },
  });

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Details */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Detalhes da Ocorrência
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Preencha as informações principais
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Ex: Buraco na rua, Lâmpada queimada..."
                      hint={errors.title?.message}
                      error={!!errors.title}
                      className="bg-white dark:bg-gray-800"
                    />
                  )}
                />

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={categoryOptions}
                        placeholder="Categoria"
                        onChange={field.onChange}
                        defaultValue={field.value}
                        className="bg-white dark:bg-gray-800"
                      />
                      {errors.category && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.category.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="urgency"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={urgencyOptions}
                        placeholder="Urgência"
                        onChange={field.onChange}
                        defaultValue={field.value}
                        className="bg-white dark:bg-gray-800"
                      />
                      {errors.urgency && (
                        <p className="mt-1.5 text-xs text-error-500">
                          {errors.urgency.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="responsibleId"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={responsibleOptions}
                        placeholder="Responsável (Opcional)"
                        onChange={field.onChange}
                        defaultValue={field.value}
                        className="bg-white dark:bg-gray-800"
                      />
                    </div>
                  )}
                />

                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      {...field}
                      placeholder="Descreva detalhadamente a situação..."
                      rows={4}
                      hint={errors.description?.message}
                      error={!!errors.description}
                      className="bg-white dark:bg-gray-800"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Location */}
          <div className="space-y-6">
            <div className="h-full rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Localização
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Selecione o local no mapa
                  </p>
                </div>
              </div>

              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <div className="h-[calc(100%-80px)] min-h-[300px]">
                    <LocationPicker
                      value={field.value}
                      onChange={field.onChange}
                      className="h-full"
                    />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Bottom Full Width: Requester Data */}
          <div className="col-span-1 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Dados do Solicitante
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Informações para contato e retorno
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  name="requesterName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Nome completo *"
                      hint={errors.requesterName?.message}
                      error={!!errors.requesterName}
                      className="bg-white dark:bg-gray-800"
                    />
                  )}
                />

                <Controller
                  name="requesterContact"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Telefone ou E-mail"
                      hint={errors.requesterContact?.message}
                      error={!!errors.requesterContact}
                      className="bg-white dark:bg-gray-800"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
          <Button variant="outline" onClick={onCancel} type="button" disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};
