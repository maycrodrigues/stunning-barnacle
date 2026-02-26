import React, { useState, useEffect } from "react";
import { Modal } from "../../../shared/components/ui/modal";
import DatePicker from "../../../shared/components/form/date-picker";
import Button from "../../../shared/components/ui/button/Button";

interface DeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: Date | undefined) => Promise<void>;
  initialDate?: Date;
  isLoading?: boolean;
}

export const DeadlineModal: React.FC<DeadlineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  isLoading = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate);
    }
  }, [isOpen, initialDate]);

  const handleSave = async () => {
    await onSave(selectedDate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Definir Prazo
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecione a data limite para esta demanda.
        </p>
      </div>

      <div className="mb-6">
        <DatePicker
          id="deadline-modal-picker"
          label="Data Limite"
          placeholder="Selecione uma data"
          defaultDate={selectedDate}
          onChange={([date]) => setSelectedDate(date)}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
};
