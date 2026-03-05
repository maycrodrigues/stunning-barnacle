export interface Member {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  photo?: string;
  roleId?: string;
  social?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    x?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
