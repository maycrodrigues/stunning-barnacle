import { useState } from "react";
import { DemandFormData } from "../types";
import { useAppStore } from "../../../shared/store/appStore";
import { useContactsStore } from "../../contacts/store/contactsStore";

export const useCreateDemand = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addDemand = useAppStore((state) => state.addDemand);
  const { contacts, addContact, loadContacts } = useContactsStore();

  const createDemand = async (data: DemandFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure contacts are loaded
      if (contacts.length === 0) {
        await loadContacts();
      }

      // Check if contact exists
      const existingContact = contacts.find(
        (c) =>
          c.name.toLowerCase() === data.requesterName.toLowerCase() &&
          (c.phone === data.requesterContact || c.email === data.requesterContact)
      );

      // If contact does not exist and we have name and contact info, create it
      if (!existingContact && data.requesterName && data.requesterContact) {
          const isEmail = data.requesterContact.includes("@");
          await addContact({
            name: data.requesterName,
            email: isEmail ? data.requesterContact : undefined,
            phone: !isEmail ? data.requesterContact : undefined,
            notes: "Criado automaticamente via Nova Demanda",
            address: "",
          });
        }

      await addDemand(data);
      console.log("Demand created and saved to DB:", data);
      return true;
    } catch (err) {
      setError("Erro ao criar demanda. Tente novamente.");
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDemand,
    isLoading,
    error,
  };
};
