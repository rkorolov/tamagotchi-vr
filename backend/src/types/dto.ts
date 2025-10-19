export type PetState = 'healthy' | 'sick' | 'dead';

export interface PetDTO {
  id: string;
  name: string;
  species: string;
  state: PetState;
  ownerId?: string;
}

export interface ListingDTO {
  id: string;
  petId: string;
  sellerId: string;
  priceCents: number;
  status: 'active' | 'sold' | 'canceled';
}

export interface OrderDTO {
  id: string;
  userId: string;
  petId: string;
  action: 'heal' | 'revive' | 'buy';
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  providerRef?: string;
  createdAt?: string;
}

export interface OrderCreateRequest {
  petId: string;
  action: OrderDTO['action'];
}

export interface OrderCreateResponse {
  checkoutUrl: string;
  orderId: string;
}
