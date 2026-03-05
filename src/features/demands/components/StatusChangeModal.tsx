import React, { useEffect, useState, useRef } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Trash2, ArrowRight, AlertCircle, Plus } from 'lucide-react';
import Select from '../../../shared/components/form/Select';
import { useMemberStore } from '../../members/store/memberStore';
import { MemberForm } from '../../members/components/MemberForm';
import { Member } from '../../../shared/services/db';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string, attachment?: { type: 'image' | 'pdf', url: string, name: string } | null, responsibleId?: string) => void;
  oldStatusLabel: string;
  newStatusLabel: string;
  newStatusValue?: string;
  initialResponsibleId?: string;
  enableResponsibleSelection?: boolean;
  mode?: 'status-change' | 'responsible-change';
  isLoading?: boolean;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  oldStatusLabel,
  newStatusLabel,
  newStatusValue,
  initialResponsibleId,
  enableResponsibleSelection = false,
  mode = 'status-change',
  isLoading = false,
}) => {
  const { members, loadMembers } = useMemberStore();
  const [justification, setJustification] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [responsibleId, setResponsibleId] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMemberSuccess = (newMember: Member) => {
    setResponsibleId(newMember.id);
    setIsMemberFormOpen(false);
    // Ensure the new member is loaded in the store (it should be handled by the store, but forcing a reload or local update might be needed if loadMembers isn't reactive enough)
    loadMembers(); 
  };

  // Load members if needed
  useEffect(() => {
    if (isOpen && (newStatusValue === 'acoes-do-gabinete' || enableResponsibleSelection || mode === 'responsible-change')) {
      loadMembers();
    }
  }, [isOpen, newStatusValue, enableResponsibleSelection, mode]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setJustification('');
      setAttachmentFile(null);
      setResponsibleId(initialResponsibleId || '');
      setError('');
      setIsDragging(false);
    }
  }, [isOpen, initialResponsibleId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 5MB.');
      return false;
    }
    const fileType = file.type.toLowerCase();
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
        setError('Apenas imagens e PDFs são permitidos.');
        return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setAttachmentFile(file);
        setError('');
      } else {
        setAttachmentFile(null);
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setAttachmentFile(file);
        setError('');
      }
    }
  };

  const removeFile = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'responsible-change') {
      if (!responsibleId) {
        setError('Selecione um responsável.');
        return;
      }
      const member = members.find(m => m.id === responsibleId);
      const memberName = member ? member.name : 'Desconhecido';
      onConfirm(`Responsável alterado para ${memberName}`, null, responsibleId);
      return;
    }
    
    // Validate responsible selection if mandatory
    // For 'acoes-do-gabinete', it's mandatory.
    // For other statuses, we might want to allow it to be optional or cleared.
    // If we enable responsible selection explicitly, we might want to enforce it?
    // Let's keep it mandatory only for 'acoes-do-gabinete' for now to avoid breaking changes,
    // but allow selection if enabled.
    if (newStatusValue === 'acoes-do-gabinete' && !responsibleId) {
      setError('Selecione um responsável para esta demanda.');
      return;
    }

    if (!justification.trim()) {
      setError('A justificativa é obrigatória para alterar o status.');
      return;
    }

    let attachmentData = null;
    if (attachmentFile) {
      try {
        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
        
        const base64 = await toBase64(attachmentFile);
        const type = attachmentFile.type.startsWith('image/') ? 'image' : 'pdf';
        attachmentData = {
            type: type as 'image' | 'pdf',
            url: base64,
            name: attachmentFile.name
        };
      } catch (e) {
        setError('Erro ao processar o arquivo.');
        return;
      }
    }

    onConfirm(justification, attachmentData, responsibleId || undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                {mode === 'responsible-change' ? 'Alterar Responsável' : 'Confirmar Alteração'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Status Flow Visualization */}
            {mode === 'status-change' && (
              <div className="mb-6 flex items-center justify-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30 border border-dashed border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{oldStatusLabel}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{newStatusLabel}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Responsible Field */}
              {(newStatusValue === 'acoes-do-gabinete' || enableResponsibleSelection || mode === 'responsible-change') && (
                <div className="mb-5">
                  {members.length > 0 ? (
                    <Select
                      label={`Responsável${(newStatusValue === 'acoes-do-gabinete' || mode === 'responsible-change') ? ' *' : ''}`}
                      options={members.map(member => ({ value: member.id, label: member.name }))}
                      value={responsibleId}
                      onChange={(value) => {
                        setResponsibleId(value);
                        if (error) setError('');
                      }}
                      placeholder="Selecione um responsável"
                      className="w-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-700/30">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum membro encontrado.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsMemberFormOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                      >
                        <Plus className="h-4 w-4" />
                        Cadastrar Novo Membro
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Justification Field */}
              {mode === 'status-change' && (
                <>
                  <div className="mb-5">
                    <label htmlFor="justification" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Justificativa <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="justification"
                      rows={4}
                      className={`w-full rounded-lg border p-3 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white resize-none ${
                        error && !justification.trim()
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-500/50 dark:focus:ring-red-900/30'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100 dark:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-900/30'
                      }`}
                      placeholder="Descreva o motivo desta alteração..."
                      value={justification}
                      onChange={(e) => {
                          setJustification(e.target.value);
                          if (error) setError('');
                      }}
                      autoFocus
                    />
                  </div>

                  {/* Attachment Field */}
                  <div className="mb-6">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Anexo (Opcional)
                    </label>
                    
                    {!attachmentFile ? (
                      <div 
                        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all ${
                          isDragging 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700/50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="mb-2 rounded-full bg-gray-100 p-2 dark:bg-gray-700">
                          <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Clique para enviar ou arraste
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PDF ou Imagem (max. 5MB)
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="attachment"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-600">
                            {attachmentFile.type.startsWith('image/') ? (
                              <ImageIcon className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                              {attachmentFile.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-sm dark:hover:bg-gray-600 transition-all"
                          title="Remover arquivo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : (mode === 'responsible-change' ? 'Salvar Responsável' : 'Confirmar Alteração')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <MemberForm
        isOpen={isMemberFormOpen}
        onClose={() => setIsMemberFormOpen(false)}
        onSuccess={handleMemberSuccess}
      />
    </div>
  );
};
