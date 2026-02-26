import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useContactsStore } from "../store/contactsStore";
import { ContactList } from "../components/ContactList";
import { ContactForm } from "../components/ContactForm";
import { ContactFormData } from "../types";
import { Contact } from "../../../shared/services/db";

export const ContactsPage: React.FC = () => {
  const { contacts, isLoading, loadContacts, addContact, updateContact, deleteContact } = useContactsStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleAdd = () => {
    setEditingContact(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este contato?")) {
      await deleteContact(id);
    }
  };

  const handleSubmit = async (data: ContactFormData) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, data);
      } else {
        await addContact(data);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Ocorreu um erro ao salvar o contato.");
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contatos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie sua agenda de contatos
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          <Plus size={20} />
          <span>Novo Contato</span>
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <ContactList
          contacts={filteredContacts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <ContactForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingContact}
        isLoading={isLoading}
      />
    </div>
  );
};
