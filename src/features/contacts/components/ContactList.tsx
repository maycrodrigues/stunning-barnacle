import React from "react";
import { Contact } from "../../../shared/services/db";
import { Edit2, Trash2, Phone, Mail, MapPin } from "lucide-react";

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onEdit,
  onDelete,
}) => {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-700 mb-4">
          <div className="w-12 h-12 text-gray-400 dark:text-gray-500 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Nenhum contato encontrado
        </h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
          Comece adicionando um novo contato à sua lista.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-lg">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Adicionado em {new Date(contact.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(contact)}
                  className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-brand-400"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(contact.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-red-400"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {contact.email && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-brand-600 truncate">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-brand-600 truncate">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.address && (
                <div className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <span className="truncate">{contact.address}</span>
                </div>
              )}
              {!contact.email && !contact.phone && !contact.address && (
                <div className="text-sm text-gray-400 italic">
                  Sem informações de contato adicionais
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {contact.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
