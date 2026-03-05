import React, { useEffect, useState, useRef } from "react";
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
import { useContactsStore } from "../../contacts/store/contactsStore";
import { Contact } from "../../../shared/services/db";
import { ContactForm } from "../../contacts/components/ContactForm";
import { ContactFormData } from "../../contacts/types";
import { Plus } from "lucide-react";

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
  const { categoryOptions, urgencyOptions } = useAppStore();
  const { members, loadMembers } = useMemberStore();
  const { contacts, loadContacts, addContact } = useContactsStore();
  
  const [nameSuggestions, setNameSuggestions] = useState<Contact[]>([]);
  const [contactSuggestions, setContactSuggestions] = useState<Contact[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactFormInitialValues, setContactFormInitialValues] = useState<Partial<ContactFormData>>({});
  
  const nameInputRef = useRef<HTMLDivElement>(null);
  const contactInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMembers();
    loadContacts();
  }, [loadMembers, loadContacts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.contains(event.target as Node)) {
        setShowNameSuggestions(false);
      }
      if (contactInputRef.current && !contactInputRef.current.contains(event.target as Node)) {
        setShowContactSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setValue,
    watch,
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

  const requesterName = watch("requesterName");
  const requesterContact = watch("requesterContact");

  useEffect(() => {
    if (requesterName && requesterName.length > 2) {
      const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(requesterName.toLowerCase())
      );
      setNameSuggestions(filtered);
      setShowNameSuggestions(true);
    } else {
      setShowNameSuggestions(false);
    }
  }, [requesterName, contacts]);

  useEffect(() => {
    if (requesterContact && requesterContact.length > 2) {
      const filtered = contacts.filter(c => {
        const phoneMatch = c.phone?.includes(requesterContact);
        const emailMatch = c.email?.toLowerCase().includes(requesterContact.toLowerCase());
        return phoneMatch || emailMatch;
      });
      setContactSuggestions(filtered);
      setShowContactSuggestions(true);
    } else {
      setShowContactSuggestions(false);
    }
  }, [requesterContact, contacts]);

  const selectContact = (contact: Contact) => {
    setValue("requesterName", contact.name);
    setValue("requesterContact", contact.phone || contact.email || "");
    setShowNameSuggestions(false);
    setShowContactSuggestions(false);
  };

  const handleCreateContact = () => {
    const isEmail = requesterContact && requesterContact.includes("@");
    setContactFormInitialValues({
      name: requesterName || "",
      email: isEmail ? requesterContact : "",
      phone: requesterContact && !isEmail ? requesterContact : "",
    });
    setIsContactFormOpen(true);
    setShowNameSuggestions(false);
    setShowContactSuggestions(false);
  };

  const handleContactSubmit = async (data: ContactFormData) => {
    try {
      const newContact = await addContact(data);
      selectContact(newContact);
      setIsContactFormOpen(false);
    } catch (error) {
      console.error("Erro ao criar contato:", error);
    }
  };

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
                <div className="relative" ref={nameInputRef}>
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
                        autoComplete="off"
                        onFocus={() => {
                          if (field.value && field.value.length > 2) {
                            const filtered = contacts.filter(c => 
                              c.name.toLowerCase().includes(field.value.toLowerCase())
                            );
                            setNameSuggestions(filtered);
                            setShowNameSuggestions(true);
                          }
                        }}
                      />
                    )}
                  />
                  {showNameSuggestions && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                      {nameSuggestions.map((contact) => (
                        <li
                          key={contact.id}
                          className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-brand-100 dark:text-gray-100 dark:hover:bg-brand-900/30"
                          onClick={() => selectContact(contact)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{contact.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.phone || contact.email || "Sem contato"}
                            </span>
                          </div>
                        </li>
                      ))}
                      {nameSuggestions.length === 0 && (
                        <li
                          className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          onClick={handleCreateContact}
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="font-medium">Cadastrar novo contato</span>
                          </div>
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="relative" ref={contactInputRef}>
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
                        autoComplete="off"
                        onFocus={() => {
                          if (field.value && field.value.length > 2) {
                            const filtered = contacts.filter(c => {
                              const phoneMatch = c.phone?.includes(field.value);
                              const emailMatch = c.email?.toLowerCase().includes(field.value.toLowerCase());
                              return phoneMatch || emailMatch;
                            });
                            setContactSuggestions(filtered);
                            setShowContactSuggestions(true);
                          }
                        }}
                      />
                    )}
                  />
                  {showContactSuggestions && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 sm:text-sm">
                      {contactSuggestions.map((contact) => (
                        <li
                          key={contact.id}
                          className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-brand-100 dark:text-gray-100 dark:hover:bg-brand-900/30"
                          onClick={() => selectContact(contact)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{contact.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.phone || contact.email || "Sem contato"}
                            </span>
                          </div>
                        </li>
                      ))}
                      {contactSuggestions.length === 0 && (
                        <li
                          className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          onClick={handleCreateContact}
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="font-medium">Cadastrar novo contato</span>
                          </div>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 flex items-center justify-end gap-3 lg:col-span-2">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : submitLabel}
            </Button>
          </div>
        </div>
      </form>

      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
        onSubmit={handleContactSubmit}
        initialValues={contactFormInitialValues}
      />
    </div>
  );
};
